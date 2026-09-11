// Synthese vocale hausa via Gemini TTS.
// Le navigateur n'a aucune voix hausa ; ce modele en fournit une.
// Modele en preversion : il peut changer ou devenir indisponible.
const MODELE = process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`;

// Gemini renvoie du PCM brut 24 kHz. Le navigateur ne sait pas le lire
// tel quel : il faut lui ajouter un en-tete WAV de 44 octets.
function ajouterEnteteWav(pcm, tauxEchantillonnage = 24000) {
  const canaux = 1;
  const bits = 16;
  const octetsParSeconde = (tauxEchantillonnage * canaux * bits) / 8;
  const alignementBloc = (canaux * bits) / 8;

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
  entete.writeUInt16LE(bits, 34);
  entete.write("data", 36);
  entete.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([entete, pcm]);
}

export async function POST(requete) {
  try {
    const { texte } = await requete.json();

    if (!texte || texte.trim().length < 5) {
      return Response.json({ error: "Texte trop court" }, { status: 400 });
    }

    // Garde-fou : un texte trop long coute du temps et du quota.
    if (texte.length > 800) {
      return Response.json({ error: "Texte trop long" }, { status: 400 });
    }

    const reponse = await fetch(
      `${GEMINI_URL}?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texte }] }],
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

    if (!reponse.ok) {
      const detail = await reponse.text();
      console.error(`Gemini TTS (${MODELE}) a refuse:`, reponse.status, detail);

      if (reponse.status === 429) {
        return Response.json(
          { error: "Limite quotidienne atteinte pour la voix." },
          { status: 429 }
        );
      }

      throw new Error("Synthese vocale indisponible");
    }

    const donnees = await reponse.json();
    const partie = donnees.candidates?.[0]?.content?.parts?.[0];
    const audioBase64 = partie?.inlineData?.data || partie?.inline_data?.data;

    if (!audioBase64) {
      console.error("TTS : aucune donnee audio dans la reponse");
      return Response.json(
        { error: "Aucun audio genere" },
        { status: 422 }
      );
    }

    const pcm = Buffer.from(audioBase64, "base64");
    const wav = ajouterEnteteWav(pcm);

    // On renvoie du WAV directement, pas du JSON :
    // le navigateur peut le jouer sans conversion supplementaire.
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
