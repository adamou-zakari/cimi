// Test de transcription zarma via Gemini.
// Usage : node test-zarma.js
// Le fichier audio doit s'appeler test-zarma.m4a et etre a la racine.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const FICHIER = "test-ingay.m4a";
const TYPE_MIME = "audio/mp4";
const MODELE = "gemini-3.1-flash-lite";

// La derniere phrase est la plus importante : elle donne au modele
// une porte de sortie honnete. Sans elle, il inventera du hausa
// approximatif plutot que d'admettre qu'il ne reconnait pas la langue.
const CONSIGNE =
  "Transcris cet audio mot pour mot. La langue parlee est le zarma " +
  "(aussi appele djerma ou zarmaciine), parle a Niamey et dans l'ouest du Niger. " +
  "C'est une langue songhai, pas du hausa et pas du francais. " +
  "Le locuteur peut inserer des mots francais au milieu d'une phrase : " +
  "transcris-les en francais, c'est normal. " +
  "Reponds UNIQUEMENT avec la transcription, sans traduction ni commentaire. " +
  "Si tu ne reconnais pas la langue ou si tu devrais deviner, " +
  "ecris exactement : LANGUE NON RECONNUE. " +
  "Vocabulaire attendu : Nijer, Niamey, Zinder, Maradi, Benin, Burkina, Mali, " +
  "Naajeriya, CEDEAO, koyra, gomnati, laabu, nooru, jiiri, fondo, zanka, " +
  "ingay, iri, war, ngey, nda, wala, manti, si, go, ga, na, ka. " +
  "Les noms de pays et de villes doivent etre transcrits correctement.";

if (!CLE) {
  console.error("GOOGLE_API_KEY absente. Fais d'abord :");
  console.error("  set GOOGLE_API_KEY=ta_cle");
  process.exit(1);
}

if (!fs.existsSync(FICHIER)) {
  console.error(`Fichier introuvable : ${FICHIER}`);
  console.error("Verifie le nom exact avec : dir test-zarma.*");
  process.exit(1);
}

async function principal() {
  const audio = fs.readFileSync(FICHIER).toString("base64");
  console.log(`Modele  : ${MODELE}`);
  console.log(`Fichier : ${FICHIER} (${Math.round(audio.length / 1024)} Ko encodes)`);
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
              { text: CONSIGNE },
              { inline_data: { mime_type: TYPE_MIME, data: audio } },
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
  console.log("\nCompare mot a mot avec ce que tu as dit.");
  console.log("Ce qui compte : les noms propres, les chiffres, les mots de sens oppose.");
}

principal().catch((e) => console.error("Echec :", e.message));
