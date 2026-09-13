// Troisieme approche, apres recherche sur la phonologie du zarma.
// Usage : node test-accent-zarma.js
//
// Ce que la recherche a corrige :
// 1. Le zarma est TONAL (bas, haut, descendant, montant). Jamais mentionne
//    dans les consignes precedentes. Une langue tonale lue sans tons
//    sonne etrangere quoi qu'on fasse par ailleurs.
// 2. Le zarma A des voyelles nasales phonemiques. La consigne precedente
//    disait "jamais de nasale" : c'etait faux et sans doute nuisible.
// 3. Le parler de Niamey s'appelle zarma-tarhay.

const fs = require("fs");

const CLE = process.env.GOOGLE_API_KEY;
const MODELE = "gemini-3.1-flash-tts-preview";

const PHRASE = "Nijer gomnati na fondo daabu, ingay da Benin gamara.";

const TONS =
  "Le zarma est une langue a tons. Il y a quatre tons : bas, haut, " +
  "descendant et montant. Le ton porte le sens : un meme mot dit sur " +
  "un ton different devient un autre mot. Ne lis pas sur une melodie " +
  "plate ni sur une intonation francaise montante en fin de phrase.\n";

const SONS =
  "Sons du zarma :\n" +
  "- Cinq voyelles : a, e, i, o, u. Elles existent aussi en version longue " +
  "(doublees a l'ecrit : aa, ee, ii, oo, uu) et la longueur change le sens.\n" +
  "- Le zarma possede des voyelles nasales. Ne les evite pas, elles sont " +
  "normales dans cette langue.\n" +
  "- Le r est bref et roule du bout de la langue.\n" +
  "- Chaque syllabe dure a peu pres le meme temps.\n" +
  "- Aucune liaison entre les mots, et les finales sont prononcees.\n";

const VARIANTES = [
  {
    nom: "tons-1",
    note: "Tons seuls",
    voix: "Kore",
    texte: TONS + "\nLis ce texte en zarma :\n\n" + PHRASE,
  },
  {
    nom: "tons-2",
    note: "Tons + sons corriges",
    voix: "Kore",
    texte: TONS + "\n" + SONS + "\nLis ce texte en zarma :\n\n" + PHRASE,
  },
  {
    nom: "tons-3",
    note: "Dialecte nomme + tons + sons",
    voix: "Kore",
    texte:
      "Tu parles le zarma-tarhay, le parler de Niamey et de Dosso. " +
      "C'est ta langue maternelle.\n\n" + TONS + "\n" + SONS +
      "\nLis cette breve de radio :\n\n" + PHRASE,
  },
  {
    nom: "tons-4",
    note: "Tout, voix Aoede",
    voix: "Aoede",
    texte:
      "Tu parles le zarma-tarhay, le parler de Niamey et de Dosso. " +
      "C'est ta langue maternelle.\n\n" + TONS + "\n" + SONS +
      "\nLis cette breve de radio :\n\n" + PHRASE,
  },
  {
    nom: "tons-5",
    note: "Tout, voix Charon",
    voix: "Charon",
    texte:
      "Tu parles le zarma-tarhay, le parler de Niamey et de Dosso. " +
      "C'est ta langue maternelle.\n\n" + TONS + "\n" + SONS +
      "\nLis cette breve de radio :\n\n" + PHRASE,
  },
];

if (!CLE) {
  console.error("GOOGLE_API_KEY absente. Fais d'abord :");
  console.error("  set GOOGLE_API_KEY=ta_cle");
  process.exit(1);
}

function ajouterEnteteWav(pcm, taux = 24000) {
  const e = Buffer.alloc(44);
  e.write("RIFF", 0);
  e.writeUInt32LE(36 + pcm.length, 4);
  e.write("WAVE", 8);
  e.write("fmt ", 12);
  e.writeUInt32LE(16, 16);
  e.writeUInt16LE(1, 20);
  e.writeUInt16LE(1, 22);
  e.writeUInt32LE(taux, 24);
  e.writeUInt32LE(taux * 2, 28);
  e.writeUInt16LE(2, 32);
  e.writeUInt16LE(16, 34);
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
    return { ok: false, detail: `${reponse.status} ${d.slice(0, 140)}` };
  }

  const donnees = await reponse.json();
  const partie = donnees.candidates?.[0]?.content?.parts?.[0];
  const audio = partie?.inlineData?.data || partie?.inline_data?.data;
  if (!audio) return { ok: false, detail: "aucun audio" };

  const pcm = Buffer.from(audio, "base64");
  fs.writeFileSync(`${v.nom}.wav`, ajouterEnteteWav(pcm));
  return { ok: true, taille: Math.round(pcm.length / 1024) };
}

async function principal() {
  console.log(`Phrase : ${PHRASE}\n`);
  console.log("Nouveaute : les tons. Le zarma en a quatre, ils portent le sens.\n");

  for (const v of VARIANTES) {
    console.log(`${v.nom} - ${v.note} (${v.voix})`);
    try {
      const r = await genererUne(v);
      console.log(r.ok ? `  ecrit (${r.taille} Ko)\n` : `  echec : ${r.detail}\n`);
    } catch (e) {
      console.log(`  echec : ${e.message}\n`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("Ecoute les cinq. Deux questions :");
  console.log("1. Y a-t-il enfin une melodie tonale, ou est-ce toujours plat ?");
  console.log("2. Benin est-il prononce correctement, sans finale francaise ?");
}

principal().catch((e) => console.error("Echec :", e.message));
