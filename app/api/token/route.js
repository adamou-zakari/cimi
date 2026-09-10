import { AssemblyAI } from "assemblyai";

// Ce fichier tourne UNIQUEMENT sur le serveur.
// Le navigateur ne voit jamais ce code, donc jamais la clé API.
export async function GET() {
  try {
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
      timeout: 60000, // 60s au lieu de 10s par défaut — connexion irrégulière
    });

    // On demande à AssemblyAI un jeton temporaire.
    // expires_in_seconds : durée de vie du jeton, en secondes.
    // 600 = 10 minutes, largement assez pour une session de test.
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 600,
    });

    return Response.json({ token });
  } catch (error) {
    // On journalise le détail côté serveur, pour toi.
    console.error("Erreur création du jeton:", error);

    // Mais le navigateur ne reçoit qu'un message neutre.
    // Jamais de détail technique, jamais de nom de service.
    return Response.json(
      { error: "Impossible de démarrer la session" },
      { status: 500 }
    );
  }
}