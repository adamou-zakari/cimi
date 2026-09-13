// Transcription des langues non couvertes par AssemblyAI.
// Le francais passe par le streaming temps reel d'AssemblyAI ;
// cet endpoint sert le hausa et le zarma, en mode fichier.

const MODELE = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

// Partie commune aux deux langues.
const REGLES_COMMUNES = `
MELANGE DE LANGUES
Le locuteur peut passer a une autre langue au milieu d'une phrase. C'est normal et frequent. Transcris chaque mot dans la langue ou il a ete prononce. N'essaie pas de tout ramener a une seule langue.

FORMAT DE REPONSE
Reponds UNIQUEMENT avec la transcription. Pas de traduction, pas de commentaire, pas de balises.
Pour tout passage inaudible ou incertain, ecris [?] a cet endroit. Un trou signale vaut mieux qu'une invention plausible.
Si tu ne reconnais pas la langue, ecris exactement : LANGUE NON RECONNUE.`;

// Le vocabulaire prioritaire est la piece la plus efficace de ce fichier.
// Mesure en test sur le zarma, meme audio, seule la liste changeant :
//   sans liste : "Cher gomme na tu ... da bener gamara"  (15,0 s)
//   avec liste : "Nijer gomnati na ... da Benin gamara"  (4,1 s)
const CONSIGNES = {
  ha: `Transcris cet audio mot pour mot. La langue principale est le hausa d'Afrique de l'Ouest.

CONTEXTE REGIONAL
Le locuteur est au Niger. Son hausa peut differer du hausa standard du Nigeria : vocabulaire local, emprunts au francais, prononciation de Niamey, Maradi, Zinder ou Agadez. Le debit peut etre rapide et certaines syllabes avalees.

VOCABULAIRE ATTENDU
Lieux : Nijar, Niamey, Zinder, Maradi, Agadez, Tahoua, Dosso, Diffa.
Region : CEDEAO, ECOWAS, AES, Sahel, Burkina Faso, Mali, Chadi, Najeriya.
Institutions : gwamnati, shugaban kasa, majalisa, ma'aikata, iyaka.
Argent : kudi, dala, naira, faranki, CFA.
Autres : kasuwa, shekara, watan, makaranta, asibiti, siminti, jika.

MOTS OPPOSES A NE PAS CONFONDRE - POINT CRITIQUE
Ces paires inversent completement le sens d'une phrase :
- "rufe" (fermer) et "bude" (ouvrir). Erreur mesuree en test.
- "dala" (unite monetaire) et "lada" (recompense). Erreur mesuree en test.
- "hana" (interdire) et "bari" (laisser).
Si tu hesites entre deux mots opposes, ecris [?] plutot que de choisir.

CHIFFRES ET MONTANTS
"dala dari" = 500 FCFA. "jika" = sac. Les annees se disent en toutes lettres :
"dubu biyu da ashirin da biyar" = 2025.
Si tu hesites sur un chiffre, ecris [?].` + REGLES_COMMUNES,

  zar: `Transcris cet audio mot pour mot. La langue principale est le zarma, aussi appele djerma ou zarmaciine. C'est une langue songhai parlee a Niamey et dans l'ouest du Niger. Ce n'est ni du hausa ni du francais.

CONTEXTE REGIONAL
Le locuteur est au Niger. Le zarma n'a pas d'orthographe standardisee : ecris ce que tu entends, sans chercher une forme canonique.

VOCABULAIRE ATTENDU
Lieux : Nijer, Niamey, Zinder, Maradi, Benin, Burkina, Mali, Naajeriya, CEDEAO.
Courants : koyra, gomnati, laabu, nooru, jiiri, fondo, zanka, kasuwa.
Pronoms et particules : ingay, iri, war, ngey, nda, wala, manti, si, go, ga, na, ka.
Les noms de pays et de villes doivent etre transcrits correctement.

CHIFFRES ET MONTANTS
Si tu hesites sur un chiffre, un montant ou une date, ecris [?] plutot que de deviner.` + REGLES_COMMUNES,
};

export async function POST(requete) {
  try {
    const { audio, mimeType, langue } = await requete.json();

    if (!audio) {
      return Response.json({ error: "Aucun audio recu" }, { status: 400 });
    }

    const consigne = CONSIGNES[langue];
    if (!consigne) {
      return Response.json({ error: "Langue non prise en charge" }, { status: 400 });
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
                { text: consigne },
                { inline_data: { mime_type: mimeType || "audio/ogg", data: audio } },
              ],
            },
          ],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error(`Gemini audio (${MODELE}, ${langue}) a refuse:`, reponse.status, detail);

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
      return Response.json({ error: "Rien n'a pu etre transcrit" }, { status: 422 });
    }

    if (texte.includes("LANGUE NON RECONNUE")) {
      return Response.json(
        { error: "La langue n'a pas ete reconnue. Reessayez en parlant plus distinctement." },
        { status: 422 }
      );
    }

    // On signale a l'interface les passages incertains,
    // pour qu'elle insiste sur la relecture.
    return Response.json({ transcription: texte, incertain: texte.includes("[?]") });
  } catch (error) {
    console.error("Erreur transcription:", error);
    return Response.json(
      { error: "La transcription n'a pas abouti" },
      { status: 500 }
    );
  }
}
