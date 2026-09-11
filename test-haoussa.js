// Test de transcription haoussa via Gemini.
// Usage : node test-haoussa.js
// Le fichier audio doit s'appeler test-haoussa.wav et etre a la racine.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const FICHIER = "test-haoussa.wav";
const MODELE = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!CLE) {
  console.error("GOOGLE_API_KEY absente. Fais d'abord :");
  console.error("  set GOOGLE_API_KEY=ta_cle");
  process.exit(1);
}

if (!fs.existsSync(FICHIER)) {
  console.error(`Fichier introuvable : ${FICHIER}`);
  process.exit(1);
}

async function principal() {
  const audio = fs.readFileSync(FICHIER).toString("base64");
  console.log(`Audio charge : ${Math.round(audio.length / 1024)} Ko encodes`);
  console.log("Envoi a Gemini...\n");

  const debut = Date.now();

  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${CLE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  "Transcris cet audio mot pour mot. La langue parlee est le haoussa. " +
                  "Reponds UNIQUEMENT avec la transcription en haoussa, " +
                  "sans traduction, sans commentaire, sans explication.",
              },
              {
                inline_data: {
                  mime_type: "audio/wav",
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

  const duree = ((Date.now() - debut) / 1000).toFixed(1);

  if (!reponse.ok) {
    console.error("Erreur", reponse.status);
    console.error(await reponse.text());
    return;
  }

  const donnees = await reponse.json();
  const texte = donnees.candidates?.[0]?.content?.parts?.[0]?.text;

  console.log("--- TRANSCRIPTION ---");
  console.log(texte || "(vide)");
  console.log("---------------------");
  console.log(`Duree : ${duree}s`);
}

principal().catch((e) => console.error("Echec :", e.message));
