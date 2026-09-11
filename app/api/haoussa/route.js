// Le modele est configurable via .env.local (GEMINI_MODEL).
// Sans cette variable, on retombe sur gemini-2.5-flash,
// qui a un quota gratuit large (~1500 requetes/jour) contrairement
// aux modeles en preversion limites a 20/jour.
const MODELE = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

// Consigne de transcription.
// Elle encode trois realites du terrain mesurees en test :
// 1. Les mots opposes sont le danger principal ("rufe" -> "bude", sens inverse)
// 2. Les locuteurs melangent haoussa, francais et zarma dans la meme phrase
// 3. Le haoussa de Niamey differe de celui de Kano ou de Maradi
const CONSIGNE = `Transcris cet audio mot pour mot. La langue principale est le haoussa d'Afrique de l'Ouest.

CONTEXTE REGIONAL
Le locuteur est au Niger. Son haoussa peut differer du haoussa standard du Nigeria : vocabulaire local, emprunts au francais, prononciation de Niamey, Maradi, Zinder ou Agadez. Le debit peut etre rapide et certaines syllabes avalees.

MELANGE DE LANGUES
Le locuteur peut passer du haoussa au francais ou au zarma au milieu d'une phrase. C'est normal et frequent. Transcris chaque mot dans la langue ou il a ete prononce. N'essaie pas de tout ramener au haoussa.

VOCABULAIRE ATTENDU
Lieux : Nijar, Niamey, Zinder, Maradi, Agadez, Tahoua, Dosso, Diffa.
Region : CEDEAO, ECOWAS, AES, Sahel, Burkina Faso, Mali, Chadi, Najeriya.
Institutions : gwamnati, shugaban kasa, majalisa, ma'aikata, iyaka.
Argent : kudi, dala, naira, faranki, CFA.
Autres : kasuwa, shekara, watan, makaranta, asibiti, siminti, jika.

MOTS OPPOSES A NE PAS CONFONDRE - POINT CRITIQUE
Certaines paires inversent completement le sens d'une phrase :
- "rufe" (fermer) et "bude" (ouvrir). Erreur mesuree en test, sens inverse.
- "dala" (unite monetaire) et "lada" (recompense). Erreur mesuree en test.
- "hana" (interdire) et "bari" (laisser).
Si tu hesites entre deux mots opposes, ecris [?] plutot que de choisir.

CHIFFRES ET MONTANTS
Les montants sont souvent mal transcrits et ne doivent pas etre rates.
- "dala dari" = 500 FCFA.
- "jika" = sac (unite de vente du ciment, du mil).
- Les annees se disent en toutes lettres : "dubu biyu da ashirin da biyar" = 2025.
Si tu hesites sur un chiffre ou un montant, ecris [?].

FORMAT DE REPONSE
Reponds UNIQUEMENT avec la transcription. Pas de traduction, pas de commentaire, pas d'explication, pas de balises.
Pour tout passage inaudible ou incertain, ecris [?] a cet endroit. Un trou signale vaut mieux qu'une invention plausible.`;

export async function POST(requete) {
  try {
    const { audio, mimeType } = await requete.json();

    if (!audio) {
      return Response.json({ error: "Aucun audio recu" }, { status: 400 });
    }

    const reponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: CONSIGNE },
                {
                  inline_data: {
                    mime_type: mimeType || "audio/ogg",
                    data: audio,
                  },
                },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error(`Gemini audio (${MODELE}) a refuse:`, reponse.status, detail);

      if (reponse.status === 503) {
        return Response.json(
          { error: "Le service est momentanement surcharge. Reessayez." },
          { status: 503 }
        );
      }

      if (reponse.status === 429) {
        return Response.json(
          { error: "Limite quotidienne atteinte. Reessayez plus tard." },
          { status: 429 }
        );
      }

      throw new Error("Transcription indisponible");
    }

    const donnees = await reponse.json();
    const texte = donnees.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!texte) {
      return Response.json(
        { error: "Rien n'a pu etre transcrit" },
        { status: 422 }
      );
    }

    // On signale a l'interface si le modele a marque des passages
    // incertains, pour qu'elle insiste sur la relecture.
    const incertain = texte.includes("[?]");

    return Response.json({ transcription: texte, incertain });
  } catch (error) {
    console.error("Erreur transcription haoussa:", error);
    return Response.json(
      { error: "La transcription n'a pas abouti" },
      { status: 500 }
    );
  }
}
