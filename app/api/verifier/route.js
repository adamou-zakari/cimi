import { construirePrompt, SANS_SOURCE } from "@/lib/prompts";

const TAVILY_URL = "https://api.tavily.com/search";

// Le modele est configurable via .env.local (GEMINI_MODEL).
// gemini-3.1-flash-lite : version stable, ~1500 requetes/jour.
// Les modeles en preversion sont limites a 20/jour.
const MODELE = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

const CLES_VALIDES = ["vrai", "faux", "partiel", "non_verifiable"];

export async function POST(requete) {
  try {
    const { affirmation, langue = "fr" } = await requete.json();

    if (!affirmation || affirmation.trim().length < 10) {
      return Response.json(
        { error: "Phrase trop courte pour etre verifiee" },
        { status: 400 }
      );
    }

    // ETAPE 1 - Chercher sur le web.
    const rechercheReponse = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: affirmation,
        max_results: 3,
        search_depth: "basic",
      }),
    });

    if (!rechercheReponse.ok) {
      const detail = await rechercheReponse.text();
      console.error("Tavily a refuse:", rechercheReponse.status, detail);
      throw new Error("Recherche web indisponible");
    }

    const recherche = await rechercheReponse.json();
    const sources = recherche.results || [];

    // Aucune source : on s'arrete sans appeler le modele.
    // Sans sources, il comblerait le vide avec ce qu'il croit savoir.
    if (sources.length === 0) {
      const secours = SANS_SOURCE[langue] || SANS_SOURCE.fr;
      return Response.json({
        affirmation,
        cle: "non_verifiable",
        verdict: secours.verdict,
        explication: secours.explication,
        confiance: secours.confiance,
        sources: [],
      });
    }

    // ETAPE 2 - Demander a Gemini de conclure a partir des sources.
    const geminiReponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: construirePrompt(affirmation, sources, langue) }] },
          ],
          generationConfig: { temperature: 0, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!geminiReponse.ok) {
      const detail = await geminiReponse.text();
      console.error(`Gemini (${MODELE}) a refuse:`, geminiReponse.status, detail);

      if (geminiReponse.status === 503) {
        return Response.json(
          { error: "Le service est momentanement surcharge. Reessayez." },
          { status: 503 }
        );
      }
      if (geminiReponse.status === 429) {
        return Response.json(
          { error: "Limite quotidienne atteinte. Reessayez plus tard." },
          { status: 429 }
        );
      }
      throw new Error("Analyse indisponible");
    }

    const resultat = await geminiReponse.json();
    let texte = resultat.candidates[0].content.parts[0].text.trim();
    texte = texte.replace(/```json|```/g, "").trim();

    const verdict = JSON.parse(texte);

    // ETAPE 3 - Rattacher les vraies sources aux numeros cites.
    const sourcesUtilisees = (verdict.sources_utilisees || [])
      .map((numero) => sources[numero - 1])
      .filter(Boolean)
      .map((s) => ({ titre: s.title, url: s.url }));

    // La cle determine la couleur ; le verdict est traduit pour l'utilisateur.
    // Ce decouplage evite de maintenir une table de traduction par langue.
    const cle = CLES_VALIDES.includes(verdict.cle) ? verdict.cle : "non_verifiable";

    return Response.json({
      affirmation: verdict.affirmation,
      cle,
      verdict: verdict.verdict,
      explication: verdict.explication,
      confiance: verdict.confiance,
      sources: sourcesUtilisees,
    });
  } catch (error) {
    console.error("Erreur verification:", error);
    return Response.json(
      { error: "La verification n'a pas abouti" },
      { status: 500 }
    );
  }
}
