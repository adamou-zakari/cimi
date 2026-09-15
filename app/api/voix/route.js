// Synthese vocale pour les langues sans voix dans le navigateur.
// Le navigateur n'a ni hausa ni zarma ; ce modele fournit les deux.
// Modele en preversion : quota serre, il peut lacher en cours de journee.
const MODELE = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

// Voix retenues apres ecoute par un locuteur natif.
// Charon pour le zarma : les autres voix donnaient un accent
// que les locuteurs de Niamey identifiaient comme etranger.
const VOIX = { ha: "Kore", zr: "Charon" };

// Consigne zarma. Trois elements, tous valides a l'oreille :
// 1. Les tons - le zarma en a quatre, ils portent le sens.
// 2. Les voyelles nasales existent en zarma, il ne faut pas les eviter.
// 3. L'alternance vocalique : la finale d'un mot change selon le
//    contexte syntaxique. gomnati devient gomnato, fondo devient fonda.
//    Sans cette regle, le modele revient a la forme du dictionnaire.
const CONSIGNE_ZARMA = `Tu parles le zarma-tarhay, le parler de Niamey et de Dosso. C'est ta langue maternelle.

Le zarma est une langue a tons. Quatre tons : bas, haut, descendant, montant. Le ton porte le sens. Ne lis pas sur une melodie plate ni avec une intonation francaise montante en fin de phrase.

Sons du zarma :
- Cinq voyelles : a, e, i, o, u, aussi en version longue (aa, ee, ii, oo, uu). La longueur change le sens.
- Le zarma possede des voyelles nasales. Ne les evite pas.
- Le r est bref et roule du bout de la langue.
- Chaque syllabe dure a peu pres le meme temps.
- Aucune liaison entre les mots, les finales sont prononcees.

IMPORTANT - finales des mots :
En zarma, la voyelle finale d'un mot change selon sa place dans la phrase. Le texte ci-dessous est ecrit avec les finales correctes pour ce contexte precis. Prononce chaque finale exactement comme elle est ecrite. Ne la remplace pas par la forme du dictionnaire.

Lis cette breve de radio :

`;

const CONSIGNE_HAOUSSA = `Lis ce texte en hausa d'Afrique de l'Ouest, voix posee, comme a la radio.

`;

const CONSIGNES = { ha: CONSIGNE_HAOUSSA, zr: CONSIGNE_ZARMA };

// Gemini renvoie du PCM brut 24 kHz. Le navigateur ne sait pas le lire
// tel quel : il faut lui ajouter un en-tete WAV de 44 octets.
function ajouterEnteteWav(pcm, tauxEchantillonnage = 24000) {
  const canaux = 1;
  const bits = 16;
  const entete = Buffer.alloc(44);
  entete.write("RIFF", 0);
  entete.writeUInt32LE(36 + pcm.length, 4);
  entete.write("WAVE", 8);
  entete.write("fmt ", 12);
  entete.writeUInt32LE(16, 16);
  entete.writeUInt16LE(1, 20);
  entete.writeUInt16LE(canaux, 22);
  entete.writeUInt32LE(tauxEchantillonnage, 24);
  entete.writeUInt32LE((tauxEchantillonnage * canaux * bits) / 8, 28);
  entete.writeUInt16LE((canaux * bits) / 8, 32);
  entete.writeUInt16LE(bits, 34);
  entete.write("data", 36);
  entete.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([entete, pcm]);
}

export async function POST(requete) {
  try {
    const { texte, langue = "ha" } = await requete.json();

    if (!texte || texte.trim().length < 5) {
      return Response.json({ error: "Texte trop court" }, { status: 400 });
    }

    // Garde-fou : un texte long coute du temps et du quota.
    if (texte.length > 800) {
      return Response.json({ error: "Texte trop long" }, { status: 400 });
    }

    const voix = VOIX[langue];
    const consigne = CONSIGNES[langue];

    if (!voix || !consigne) {
      return Response.json({ error: "Langue non supportee" }, { status: 400 });
    }

    const reponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: consigne + texte }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voix } },
            },
          },
        }),
      }
    );

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error(`Gemini TTS (${MODELE}, ${langue}):`, reponse.status, detail);

      if (reponse.status === 429) {
        return Response.json(
          { error: "Limite quotidienne atteinte pour la voix." },
          { status: 429 }
        );
      }
      if (reponse.status === 503) {
        return Response.json(
          { error: "Le service est momentanement surcharge." },
          { status: 503 }
        );
      }

      throw new Error("Synthese vocale indisponible");
    }

    const donnees = await reponse.json();
    const partie = donnees.candidates?.[0]?.content?.parts?.[0];
    const audioBase64 = partie?.inlineData?.data || partie?.inline_data?.data;

    if (!audioBase64) {
      console.error("TTS : aucune donnee audio dans la reponse");
      return Response.json({ error: "Aucun audio genere" }, { status: 422 });
    }

    const wav = ajouterEnteteWav(Buffer.from(audioBase64, "base64"));

    // On renvoie du WAV directement : le navigateur le joue sans conversion.
    return new Response(wav, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": String(wav.length),
      },
    });
  } catch (error) {
    console.error("Erreur synthese vocale:", error);
    return Response.json(
      { error: "La synthese vocale n'a pas abouti" },
      { status: 500 }
    );
  }
}
