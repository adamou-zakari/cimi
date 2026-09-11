import { construirePrompt } from "@/lib/prompts";

const TAVILY_URL = "https://api.tavily.com/search";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export async function POST(requete) {
  try {
    const { affirmation } = await requete.json();

    if (!affirmation || affirmation.trim().length < 10) {
      return Response.json(
        { error: "Phrase trop courte pour être vérifiée" },
        { status: 400 }
      );
    }

    // ÉTAPE 1 — Chercher sur le web.
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
      console.error("Tavily a refusé:", rechercheReponse.status, detail);
      throw new Error("Recherche web indisponible");
    }

    const recherche = await rechercheReponse.json();
    const sources = recherche.results || [];

    // Aucune source : on s'arrête. On n'invente pas.
    if (sources.length === 0) {
      return Response.json({
        affirmation,
        verdict: "non vérifiable",
        explication: "Aucune source trouvée sur ce sujet.",
        sources: [],
        confiance: "faible",
      });
    }

    // ÉTAPE 2 — Demander à Gemini de conclure à partir des sources.
    const geminiReponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: construirePrompt(affirmation, sources) }],
            },
          ],
          generationConfig: {
            temperature: 0, // réponse la plus stable possible
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!geminiReponse.ok) {
      const detail = await geminiReponse.text();
      console.error("Gemini a refusé:", geminiReponse.status, detail);
      throw new Error("Analyse indisponible");
    }

    const resultat = await geminiReponse.json();

    // La structure de Gemini est différente de celle d'OpenAI.
    let texte = resultat.candidates[0].content.parts[0].text.trim();

    // Le modèle entoure parfois son JSON de balises de code.
    texte = texte.replace(/```json|```/g, "").trim();

    const verdict = JSON.parse(texte);

    // ÉTAPE 3 — Rattacher les vraies sources aux numéros cités.
    const sourcesUtilisees = (verdict.sources_utilisees || [])
      .map((numero) => sources[numero - 1])
      .filter(Boolean)
      .map((s) => ({ titre: s.title, url: s.url }));

    return Response.json({
      affirmation: verdict.affirmation,
      verdict: verdict.verdict,
      explication: verdict.explication,
      confiance: verdict.confiance,
      sources: sourcesUtilisees,
    });
  } catch (error) {
    console.error("Erreur vérification:", error);
    return Response.json(
      { error: "La vérification n'a pas abouti" },
      { status: 500 }
    );
  }
}