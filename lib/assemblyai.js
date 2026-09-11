// Connexion WebSocket vers AssemblyAI pour la transcription temps reel.
// Ce fichier tourne dans le NAVIGATEUR.

const URL_BASE = "wss://streaming.assemblyai.com/v3/ws";
const SAMPLE_RATE = 16000;

// Mots que les modeles francais ne connaissent pas ou transcrivent mal.
// Les modeles sont entraines sur du francais hexagonal : les noms
// ouest-africains ne sont pas dans leur vocabulaire courant.
// LIMITE : environ 100 termes. Au-dela, l'API refuse.
// Une liste ciblee est plus efficace qu'une liste exhaustive.
const MOTS_PRIORITAIRES = [
  "Cimi",
  "Niger",
  "Niamey",
  "Zinder",
  "Maradi",
  "Agadez",
  "Tahoua",
  "haoussa",
  "zarma",
  "peul",
  "touareg",
  "Sahel",
  "CEDEAO",
  "AES",
  "UEMOA",
  "franc CFA",
  "Burkina Faso",
  "Mali",
  "Tchad",
  "Nigeria",
  "Ouagadougou",
  "Bamako",
  "uranium",
  "fleuve Niger",
  "desinformation",
  "WhatsApp",
];

export class ConnexionTranscription {
  constructor() {
    this.socket = null;
    this.pret = false;
  }

  async connecter(callbacks, langue = "fr") {
    this.callbacks = callbacks;

    const reponse = await fetch("/api/token");
    if (!reponse.ok) {
      throw new Error("Impossible d'obtenir l'autorisation");
    }
    const { token } = await reponse.json();

    const parametres = new URLSearchParams({
      sample_rate: SAMPLE_RATE,
      token: token,
      format_turns: "true",
      language: langue,
      keyterms_prompt: JSON.stringify(MOTS_PRIORITAIRES),
    });

    this.socket = new WebSocket(`${URL_BASE}?${parametres}`);
    this.socket.binaryType = "arraybuffer";

    this.socket.onopen = () => {
      this.pret = true;
      callbacks.onPret?.();
    };

    this.socket.onmessage = (evenement) => {
      const message = JSON.parse(evenement.data);

      if (message.type === "Turn") {
        const texte = message.transcript;
        if (!texte) return;

        if (message.end_of_turn) {
          callbacks.onFinal?.(texte);
        } else {
          callbacks.onPartiel?.(texte);
        }
      }
    };

    this.socket.onerror = () => {
      callbacks.onErreur?.("La connexion a ete interrompue");
    };

    this.socket.onclose = () => {
      this.pret = false;
    };
  }

  envoyerAudio(morceau) {
    if (!this.pret || this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(morceau);
  }

  fermer() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "Terminate" }));
    }
    this.socket?.close();
    this.socket = null;
    this.pret = false;
  }
}