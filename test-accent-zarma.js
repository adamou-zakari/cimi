// Objectif : que la voix sonne nigerienne, pas etrangere.
// On ne cherche plus la comprehension mais l'accent.
// Usage : node test-accent-zarma.js
// Produit accent-1.wav a accent-5.wav.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const MODELE = "gemini-3.1-flash-tts-preview";

const PHRASE = "Nijer gomnati na fondo daabu, fondo da Benin game.";

// Reecriture phonetique : on separe les syllabes et on marque
// les voyelles longues, pour empecher le modele d'appliquer
// ses reflexes francais (nasalisation, R uvulaire, liaison).
const PHRASE_PHONETIQUE =
  "Ni-jèr go-mna-ti na fon-do daa-bou, fon-do da Bé-nin ga-mé.";

const PHONOLOGIE =
  "Regles de prononciation du zarma (langue songhai du Niger) :\n" +
  "- Les voyelles sont pures : a, e, i, o, u. Jamais de voyelle nasale francaise (an, on, in).\n" +
  "- Le n final se prononce, il ne nasalise pas la voyelle qui precede.\n" +
  "- Le r est bref et roule du bout de la langue, jamais le r guttural francais.\n" +
  "- Les voyelles doubles (aa, ee, oo) sont tenues plus longtemps.\n" +
  "- Chaque syllabe dure a peu pres le meme temps. Pas d'accent tonique francais en fin de mot.\n" +
  "- Aucune liaison entre les mots. Chaque mot reste detache.\n" +
  "- Les finales ne sont pas avalees : la derniere voyelle de chaque mot est prononcee.\n";

const VARIANTES = [
  {
    nom: "accent-1",
    description: "Phonologie songhai detaillee",
    voix: "Kore",
    texte: PHONOLOGIE + "\nLis maintenant ce texte :\n\n" + PHRASE,
  },
  {
    nom: "accent-2",
    description: "Texte reecrit phonetiquement",
    voix: "Kore",
    texte:
      "Lis ce texte syllabe par syllabe, voyelles pures, r roule, " +
      "sans nasalisation :\n\n" + PHRASE_PHONETIQUE,
  },
  {
    nom: "accent-3",
    description: "Identite du locuteur plutot que consigne technique",
    voix: "Kore",
    texte:
      "Tu es une presentatrice de radio a Niamey, au Niger. Le zarma est ta " +
      "langue maternelle, tu l'as parlee toute ta vie. Tu lis une breve " +
      "d'information a l'antenne, d'une voix posee et naturelle. " +
      "Ton accent est celui de Niamey, pas celui d'un etranger qui apprend " +
      "la langue :\n\n" + PHRASE,
  },
  {
    nom: "accent-4",
    description: "Identite + phonologie + texte phonetique",
    voix: "Kore",
    texte:
      "Tu es une presentatrice de radio a Niamey. Le zarma est ta langue " +
      "maternelle.\n\n" + PHONOLOGIE +
      "\nLis cette breve a l'antenne, voix posee :\n\n" + PHRASE_PHONETIQUE,
  },
  {
    nom: "accent-5",
    description: "Meme consigne complete, voix Aoede",
    voix: "Aoede",
    texte:
      "Tu es une presentatrice de radio a Niamey. Le zarma est ta langue " +
      "maternelle.\n\n" + PHONOLOGIE +
      "\nLis cette breve a l'antenne, voix posee :\n\n" + PHRASE_PHONETIQUE,
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
  const e = Buffer.alloc(44);
  e.write("RIFF", 0);
  e.writeUInt32LE(36 + pcm.length, 4);
  e.write("WAVE", 8);
  e.write("fmt ", 12);
  e.writeUInt32LE(16, 16);
  e.writeUInt16LE(1, 20);
  e.writeUInt16LE(canaux, 22);
  e.writeUInt32LE(taux, 24);
  e.writeUInt32LE((taux * canaux * bits) / 8, 28);
  e.writeUInt16LE((canaux * bits) / 8, 32);
  e.writeUInt16LE(bits, 34);
  e.write("data", 36);
  e.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([e, pcm]);
}

async function genererUne(v) {
  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${CLE}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: v.texte }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: v.voix } },
          },
        },
      }),
    }
  );

  if (!reponse.ok) {
    const d = await reponse.text();
    return { ok: false, detail: `${reponse.status} ${d.slice(0, 160)}` };
  }

  const donnees = await reponse.json();
  const partie = donnees.candidates?.[0]?.content?.parts?.[0];
  const audio = partie?.inlineData?.data || partie?.inline_data?.data;
  if (!audio) return { ok: false, detail: "aucun audio renvoye" };

  const pcm = Buffer.from(audio, "base64");
  fs.writeFileSync(`${v.nom}.wav`, ajouterEnteteWav(pcm));
  return { ok: true, taille: Math.round(pcm.length / 1024) };
}

async function principal() {
  console.log(`Phrase     : ${PHRASE}`);
  console.log(`Phonetique : ${PHRASE_PHONETIQUE}\n`);

  for (const v of VARIANTES) {
    console.log(`${v.nom} - ${v.description} (voix ${v.voix})`);
    const debut = Date.now();
    try {
      const r = await genererUne(v);
      const duree = ((Date.now() - debut) / 1000).toFixed(1);
      console.log(
        r.ok ? `  ecrit (${r.taille} Ko, ${duree}s)\n` : `  echec : ${r.detail}\n`
      );
    } catch (e) {
      console.log(`  echec : ${e.message}\n`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("Ecoute les cinq. Une seule question :");
  console.log("lequel sonne comme quelqu'un de Niamey, et non comme un etranger ?");
}

principal().catch((e) => console.error("Echec :", e.message));
