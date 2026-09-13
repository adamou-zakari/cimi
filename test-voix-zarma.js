// Teste quatre facons de faire prononcer du zarma par Gemini TTS.
// Usage : node test-voix-zarma.js
// Produit zarma-1.wav a zarma-4.wav. Ecoute-les et compare.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const MODELE = "gemini-3.1-flash-tts-preview";

const PHRASE = "Nijer gomnati na fondo dabu, fondo da Benin game.";

// Quatre variantes. La difference porte sur la consigne de style
// et la voix utilisee, pas sur le texte.
const VARIANTES = [
  {
    nom: "zarma-1",
    description: "Texte brut, voix Kore (reference, ce qu'on a deja teste)",
    voix: "Kore",
    texte: PHRASE,
  },
  {
    nom: "zarma-2",
    description: "Consigne de langue explicite",
    voix: "Kore",
    texte:
      "Lis le texte suivant en zarma, une langue songhai du Niger. " +
      "Prononce chaque lettre comme en zarma, pas comme en francais " +
      "ni comme en anglais. Debit pose et clair :\n\n" + PHRASE,
  },
  {
    nom: "zarma-3",
    description: "Phonetique hausa comme relais",
    voix: "Kore",
    texte:
      "Lis le texte suivant avec la prononciation du hausa d'Afrique de l'Ouest. " +
      "Les voyelles a, e, i, o, u sont pures comme en hausa. " +
      "Le r est roule. Debit pose :\n\n" + PHRASE,
  },
  {
    nom: "zarma-4",
    description: "Phonetique hausa, voix Charon",
    voix: "Charon",
    texte:
      "Lis le texte suivant avec la prononciation du hausa d'Afrique de l'Ouest. " +
      "Les voyelles a, e, i, o, u sont pures comme en hausa. " +
      "Le r est roule. Debit pose :\n\n" + PHRASE,
  },
];

if (!CLE) {
  console.error("GOOGLE_API_KEY absente. Fais d'abord :");
  console.error("  set GOOGLE_API_KEY=ta_cle");
  process.exit(1);
}

function ajouterEnteteWav(pcm, taux = 24000) {
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
  entete.writeUInt32LE(taux, 24);
  entete.writeUInt32LE((taux * canaux * bits) / 8, 28);
  entete.writeUInt16LE((canaux * bits) / 8, 32);
  entete.writeUInt16LE(bits, 34);
  entete.write("data", 36);
  entete.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([entete, pcm]);
}

async function genererUne(variante) {
  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${CLE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: variante.texte }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: variante.voix },
            },
          },
        },
      }),
    }
  );

  if (!reponse.ok) {
    const detail = await reponse.text();
    return { ok: false, detail: `${reponse.status} ${detail.slice(0, 200)}` };
  }

  const donnees = await reponse.json();
  const partie = donnees.candidates?.[0]?.content?.parts?.[0];
  const audio = partie?.inlineData?.data || partie?.inline_data?.data;

  if (!audio) return { ok: false, detail: "aucun audio renvoye" };

  const pcm = Buffer.from(audio, "base64");
  const fichier = `${variante.nom}.wav`;
  fs.writeFileSync(fichier, ajouterEnteteWav(pcm));

  return { ok: true, fichier, taille: Math.round(pcm.length / 1024) };
}

async function principal() {
  console.log(`Phrase testee : ${PHRASE}\n`);

  for (const variante of VARIANTES) {
    process.stdout.write(`${variante.nom} - ${variante.description}\n`);
    const debut = Date.now();

    try {
      const resultat = await genererUne(variante);
      const duree = ((Date.now() - debut) / 1000).toFixed(1);

      if (resultat.ok) {
        console.log(`  ${resultat.fichier} (${resultat.taille} Ko, ${duree}s)\n`);
      } else {
        console.log(`  echec : ${resultat.detail}\n`);
      }
    } catch (e) {
      console.log(`  echec : ${e.message}\n`);
    }

    // Une pause entre les appels evite de saturer le quota.
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("Ecoute les quatre fichiers dans l'ordre.");
  console.log("Question unique : lequel serait compris par un locuteur zarma ?");
  console.log("Si aucun ne l'est, la voix zarma n'est pas faisable aujourd'hui.");
}

principal().catch((e) => console.error("Echec :", e.message));
