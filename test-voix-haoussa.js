// Test de synthese vocale hausa via Gemini TTS.
// Usage : node test-voix-haoussa.js
// Produit un fichier voix-haoussa.wav a ecouter.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const MODELE = "gemini-3.1-flash-tts-preview";
const SORTIE = "voix-haoussa.wav";

// Une phrase hausa simple, du type de ce que Cimi dirait.
const TEXTE =
  "Karya ne. Gwamnatin Nijar ba ta haramta sayar da siminti ba, " +
  "a maimakon haka ta sanar da rage farashi. Na samu majiyu uku.";

if (!CLE) {
  console.error("GOOGLE_API_KEY absente. Fais d'abord :");
  console.error("  set GOOGLE_API_KEY=ta_cle");
  process.exit(1);
}

// Gemini renvoie du PCM brut. Il faut lui ajouter un en-tete WAV
// pour que le fichier soit lisible par un lecteur audio.
function ajouterEnteteWav(pcm, tauxEchantillonnage = 24000) {
  const canaux = 1;
  const bitsParEchantillon = 16;
  const octetsParSeconde = (tauxEchantillonnage * canaux * bitsParEchantillon) / 8;
  const alignementBloc = (canaux * bitsParEchantillon) / 8;

  const entete = Buffer.alloc(44);
  entete.write("RIFF", 0);
  entete.writeUInt32LE(36 + pcm.length, 4);
  entete.write("WAVE", 8);
  entete.write("fmt ", 12);
  entete.writeUInt32LE(16, 16);
  entete.writeUInt16LE(1, 20);
  entete.writeUInt16LE(canaux, 22);
  entete.writeUInt32LE(tauxEchantillonnage, 24);
  entete.writeUInt32LE(octetsParSeconde, 28);
  entete.writeUInt16LE(alignementBloc, 32);
  entete.writeUInt16LE(bitsParEchantillon, 34);
  entete.write("data", 36);
  entete.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([entete, pcm]);
}

async function principal() {
  console.log(`Modele : ${MODELE}`);
  console.log(`Texte  : ${TEXTE}\n`);
  console.log("Generation en cours...\n");

  const debut = Date.now();

  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${CLE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: TEXTE }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      }),
    }
  );

  const duree = ((Date.now() - debut) / 1000).toFixed(1);

  if (!reponse.ok) {
    console.error("Erreur", reponse.status);
    console.error(await reponse.text());
    return;
  }

  const donnees = await reponse.json();
  const partie = donnees.candidates?.[0]?.content?.parts?.[0];
  const audioBase64 = partie?.inlineData?.data || partie?.inline_data?.data;

  if (!audioBase64) {
    console.error("Aucun audio dans la reponse. Contenu recu :");
    console.error(JSON.stringify(donnees, null, 2).slice(0, 1500));
    return;
  }

  const pcm = Buffer.from(audioBase64, "base64");
  fs.writeFileSync(SORTIE, ajouterEnteteWav(pcm));

  console.log(`Fichier ecrit : ${SORTIE}`);
  console.log(`Taille : ${Math.round(pcm.length / 1024)} Ko`);
  console.log(`Duree de generation : ${duree}s`);
  console.log("\nEcoute le fichier et juge deux choses :");
  console.log("  1. Est-ce comprehensible pour un locuteur hausa ?");
  console.log("  2. Ou est-ce une voix anglaise qui lit du hausa ?");
}

principal().catch((e) => console.error("Echec :", e.message));
