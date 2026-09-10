// Capture du micro et conversion au format attendu par AssemblyAI.
// Ce fichier tourne dans le NAVIGATEUR, pas sur le serveur.

// AssemblyAI attend de l'audio PCM 16 bits, mono, à 16 000 Hz.
const SAMPLE_RATE = 16000;

// Taille des morceaux envoyés : 50 ms d'audio à la fois.
// Plus petit = plus réactif mais plus de messages réseau.
// 50 ms est le compromis recommandé.
const CHUNK_MS = 50;

export class CaptureAudio {
  constructor() {
    this.flux = null;        // le flux du micro
    this.contexte = null;    // le moteur audio du navigateur
    this.source = null;      // le micro branché dans le moteur
    this.processeur = null;  // le morceau de code qui découpe le son
    this.actif = false;
  }

  // Démarre la capture.
  // onMorceau : fonction appelée à chaque morceau d'audio prêt.
  async demarrer(onMorceau) {
    // 1. Demander le micro à l'utilisateur.
    //    Le navigateur affiche une popup. Si l'utilisateur refuse,
    //    cette ligne lève une erreur.
    this.flux = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,        // mono, pas stéréo
        sampleRate: SAMPLE_RATE,
        echoCancellation: true, // évite que le son des haut-parleurs revienne
        noiseSuppression: true, // utile en environnement bruyant
      },
    });

    // 2. Créer le moteur audio, calé sur 16 000 Hz.
    //    Le navigateur rééchantillonne automatiquement si le micro
    //    tourne à une autre fréquence.
    this.contexte = new AudioContext({ sampleRate: SAMPLE_RATE });

    // 3. Brancher le micro dans le moteur.
    this.source = this.contexte.createMediaStreamSource(this.flux);

    // 4. Créer le découpeur.
    //    Il reçoit le son en continu et nous le rend par paquets.
    const tailleBuffer = Math.round((SAMPLE_RATE * CHUNK_MS) / 1000);
    this.processeur = this.contexte.createScriptProcessor(4096, 1, 1);

    let accumulateur = [];

    this.processeur.onaudioprocess = (evenement) => {
      if (!this.actif) return;

      // Les données brutes : des décimaux entre -1 et 1.
      const donnees = evenement.inputBuffer.getChannelData(0);

      // Conversion en entiers 16 bits (de -32768 à 32767).
      for (let i = 0; i < donnees.length; i++) {
        const valeur = Math.max(-1, Math.min(1, donnees[i]));
        accumulateur.push(valeur < 0 ? valeur * 0x8000 : valeur * 0x7fff);
      }

      // Dès qu'on a assez de données, on envoie un morceau.
      while (accumulateur.length >= tailleBuffer) {
        const morceau = accumulateur.splice(0, tailleBuffer);
        onMorceau(new Int16Array(morceau).buffer);
      }
    };

    // 5. Tout relier et lancer.
    this.source.connect(this.processeur);
    this.processeur.connect(this.contexte.destination);
    this.actif = true;
  }

  // Arrête proprement. À appeler systématiquement,
  // sinon le voyant du micro reste allumé.
  arreter() {
    this.actif = false;

    if (this.processeur) {
      this.processeur.disconnect();
      this.processeur = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.contexte) {
      this.contexte.close();
      this.contexte = null;
    }
    if (this.flux) {
      // Éteint physiquement le micro.
      this.flux.getTracks().forEach((piste) => piste.stop());
      this.flux = null;
    }
  }
}