// Transcription des langues non couvertes par AssemblyAI.
// Hausa et zarma passent par Gemini en mode fichier :
// AssemblyAI ne les a ni l'un ni l'autre dans ses 32 langues.

const MODELE = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

// Regle placee EN TETE de chaque consigne, pas dans le socle commun.
// Erreur mesuree : "Nijar ta hana a sayda mouton" a ete transcrit
// "Tari ya hana a saida mutum". Le mot francais "mouton" a ete
// converti en "mutum" (personne en hausa). Le sens change entierement.
// Une regle enterree au milieu d'une longue consigne est ignoree.
const MELANGE = `REGLE LA PLUS IMPORTANTE - LE MELANGE DE LANGUES

Au Niger, les gens melangent constamment leur langue avec le francais.
Ce n'est pas une exception, c'est la facon normale de parler.
Une phrase typique contient deux ou trois mots francais au milieu.

Quand tu entends un mot francais, ecris-le EN FRANCAIS, avec son
orthographe francaise. Ne le convertis jamais en un mot de la langue
locale qui lui ressemble.

PIEGE MESURE : le mot francais "mouton" a ete transcrit "mutum",
qui signifie "personne" en hausa. Les deux sonnent proches, le sens
n'a rien a voir. Ce genre de conversion rend la phrase fausse.

Mots francais frequemment inseres, a garder tels quels :
mouton, vache, chevre, moto, voiture, essence, marche, boutique,
frontiere, gouvernement, president, ministre, prix, argent, banque,
ecole, hopital, medicament, telephone, internet, reseau, carburant,
riz, sucre, huile, ciment, transport, taxi, quartier, commune.

Si un mot pourrait etre soit francais soit local, choisis le francais :
un mot francais garde son sens, un mot local mal choisi le detruit.
`;

// Erreur mesuree : "Niger gomnato gangui i ma mouton inganda poulet nera"
// a ete transcrit "Niger gomnato ga gandi, i ma mouton, i ma vande poulet,
// i ma neri." Le modele a decoupe une phrase continue en enumeration et
// repete "i ma" pour la rendre plus reguliere. Il cherche a produire une
// phrase plausible au lieu de transcrire ce qu'il entend.
const FIDELITE = `
NE RESTRUCTURE PAS - REGLE ABSOLUE
Transcris le flux de parole tel quel, dans l'ordre exact.
N'ajoute aucune ponctuation que tu n'entends pas : si le locuteur parle
sans pause, ecris sans virgule.
Ne decoupe pas une phrase continue en segments ou en enumeration.
Ne repete jamais un groupe de mots pour rendre la phrase plus reguliere
ou plus grammaticale.
Ton travail est de transcrire, pas de corriger ni de reformuler.
Une phrase bancale fidele vaut mieux qu'une phrase propre inventee.
`;

const SOCLE = `
CONTEXTE REGIONAL
Le locuteur est au Niger. Le debit peut etre rapide et certaines syllabes avalees.

FORMAT DE REPONSE
Reponds UNIQUEMENT avec la transcription. Pas de traduction, pas de commentaire, pas de balises.
Pour tout passage inaudible ou incertain, ecris [?] a cet endroit.
Un trou signale vaut mieux qu'une invention plausible.`;

const CONSIGNES = {
  ha: `Transcris cet audio mot pour mot. La langue principale est le hausa d'Afrique de l'Ouest,
tel qu'il est parle au Niger : vocabulaire local, emprunts au francais,
prononciation de Niamey, Maradi, Zinder ou Agadez.

${MELANGE}
${FIDELITE}
${SOCLE}

NOMS PROPRES
Le pays se dit "Nijar" en hausa, mais le locuteur peut dire "Niger" a la francaise.
Les deux sont corrects : ecris ce que tu entends.
Autres noms attendus : Niamey, Zinder, Maradi, Agadez, Tahoua, Dosso, Diffa,
CEDEAO, ECOWAS, AES, Sahel, Burkina Faso, Mali, Chadi, Najeriya.

VOCABULAIRE HAUSA ATTENDU
gwamnati, shugaban kasa, majalisa, ma'aikata, iyaka, sayar, saya,
kudi, dala, naira, faranki, CFA, kasuwa, shekara, watan, siminti, jika.

MOTS OPPOSES - POINT CRITIQUE
Ces paires inversent le sens d'une phrase entiere :
- "rufe" (fermer) et "bude" (ouvrir). Erreur mesuree en test.
- "dala" (monnaie) et "lada" (recompense). Erreur mesuree en test.
- "hana" (interdire) et "bari" (laisser).
Si tu hesites entre deux mots opposes, ecris [?] plutot que de choisir.
"dala dari" = 500 FCFA. Les annees se disent en toutes lettres.`,

  zr: `Transcris cet audio mot pour mot. La langue principale est le zarma,
aussi appele djerma ou zarmaciine. C'est une langue songhai parlee a Niamey
et dans l'ouest du Niger. Ce n'est ni du hausa ni du francais.

${MELANGE}
${FIDELITE}
${SOCLE}

NOMS PROPRES
Le pays se dit "Nijer", mais le locuteur peut dire "Niger" a la francaise.
Les deux sont corrects : ecris ce que tu entends.
Autres noms attendus : Niamey, Zinder, Maradi, Benin, Burkina, Mali,
Naajeriya, CEDEAO, Dosso, Tillaberi.

VOCABULAIRE ZARMA ATTENDU
koyra, gomnati, laabu, nooru, jiiri, fondo, zanka, kasuwa, daabu, neera.
Pronoms et particules : ingay, iri, war, ngey, nda, wala, manti, si, go, ga, na, ka.

ALTERNANCE VOCALIQUE - POINT CRITIQUE
En zarma, la voyelle finale d'un mot change selon sa place dans la phrase.
"gomnati" devient "gomnato", "fondo" devient "fonda" selon le contexte.
Ce n'est ni une faute ni une variante d'orthographe : c'est de la grammaire.
Transcris la finale que tu entends reellement. Ne ramene jamais un mot
a sa forme isolee ni a sa forme de dictionnaire.

AUTRES POINTS CRITIQUES
Le zarma n'a pas d'orthographe standardisee : ecris ce que tu entends,
sans chercher une forme canonique.
Si tu hesites sur un nom propre, un chiffre ou une date, ecris [?].`,
};

export async function POST(requete) {
  try {
    const { audio, mimeType, langue } = await requete.json();

    if (!audio) {
      return Response.json({ error: "Aucun audio recu" }, { status: 400 });
    }

    const consigne = CONSIGNES[langue];
    if (!consigne) {
      return Response.json({ error: "Langue non supportee" }, { status: 400 });
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
      console.error(`Gemini audio (${MODELE}, ${langue}):`, reponse.status, detail);

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

    // On signale a l'interface les passages douteux, pour qu'elle
    // insiste sur la relecture.
    return Response.json({ transcription: texte, incertain: texte.includes("[?]") });
  } catch (error) {
    console.error("Erreur transcription:", error);
    return Response.json(
      { error: "La transcription n'a pas abouti" },
      { status: 500 }
    );
  }
}
