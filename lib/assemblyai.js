// Connexion WebSocket vers AssemblyAI pour la transcription temps réel.
// Ce fichier tourne dans le NAVIGATEUR.

const URL_BASE = "wss://streaming.assemblyai.com/v3/ws";
const SAMPLE_RATE = 16000;

export class ConnexionTranscription {
  constructor() {
    this.socket = null;
    this.pret = false;
  }

  // Ouvre la connexion.
  // callbacks : { onPartiel, onFinal, onErreur, onPret }
  async connecter(callbacks, langue = "fr") {
    this.callbacks = callbacks;

    // 1. Récupérer un jeton temporaire auprès de NOTRE serveur.
    //    C'est ici que le travail de app/api/token/route.js sert.
    const reponse = await fetch("/api/token");
    if (!reponse.ok) {
      throw new Error("Impossible d'obtenir l'autorisation");
    }
    const { token } = await reponse.json();

    // 2. Construire l'adresse du WebSocket.
    //    Les paramètres passent dans l'URL.
    const parametres = new URLSearchParams({
      sample_rate: SAMPLE_RATE,
      token: token,
      format_turns: "true", // texte ponctué et lisible
      language: langue,
    });

    // 3. Ouvrir la connexion.
    this.socket = new WebSocket(`${URL_BASE}?${parametres}`);
    this.socket.binaryType = "arraybuffer";

    // 4. Réagir aux événements de la connexion.

    this.socket.onopen = () => {
      this.pret = true;
      callbacks.onPret?.();
    };

    this.socket.onmessage = (evenement) => {
      const message = JSON.parse(evenement.data);

      // AssemblyAI envoie différents types de messages.
      // On ne traite que celui qui nous intéresse.
      if (message.type === "Turn") {
        const texte = message.transcript;
        if (!texte) return;

        // end_of_turn indique que la personne a fini de parler.
        if (message.end_of_turn) {
          callbacks.onFinal?.(texte);
        } else {
          callbacks.onPartiel?.(texte);
        }
      }
    };

    this.socket.onerror = () => {
      // On ne remonte jamais l'objet d'erreur brut à l'interface.
      callbacks.onErreur?.("La connexion a été interrompue");
    };

    this.socket.onclose = () => {
      this.pret = false;
    };
  }

  // Envoie un morceau d'audio.
  // Appelée par CaptureAudio à chaque paquet prêt.
  envoyerAudio(morceau) {
    if (!this.pret || this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(morceau);
  }

  // Ferme proprement la connexion.
  fermer() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // On prévient AssemblyAI avant de raccrocher,
      // sinon on perd la dernière phrase en cours.
      this.socket.send(JSON.stringify({ type: "Terminate" }));
    }
    this.socket?.close();
    this.socket = null;
    this.pret = false;
  }
}