// Enregistrement d'un fichier audio complet et compresse.
// Utilise pour le mode haoussa, ou l'on envoie un fichier entier
// plutot que de streamer des morceaux.
// Ce fichier tourne dans le NAVIGATEUR.

// Formats essayes dans l'ordre. Opus compresse environ 10x mieux
// que le WAV non compresse, ce qui divise d'autant le temps d'envoi.
const FORMATS = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function choisirFormat() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const format of FORMATS) {
    if (MediaRecorder.isTypeSupported(format)) return format;
  }
  return null;
}

export class EnregistreurFichier {
  constructor() {
    this.flux = null;
    this.recorder = null;
    this.morceaux = [];
    this.format = null;
  }

  async demarrer() {
    this.format = choisirFormat();
    if (!this.format) {
      throw new Error("Enregistrement non supporte par ce navigateur");
    }

    this.flux = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.morceaux = [];
    this.recorder = new MediaRecorder(this.flux, {
      mimeType: this.format,
      audioBitsPerSecond: 32000, // suffisant pour la voix, tres leger
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.morceaux.push(e.data);
    };

    this.recorder.start();
  }

  // Arrete et renvoie le fichier complet en base64,
  // avec son type MIME pour que le serveur sache quoi en faire.
  async arreterEtRecuperer() {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error("Aucun enregistrement en cours"));
        return;
      }

      this.recorder.onstop = async () => {
        try {
          // Le type MIME complet contient le codec ; on ne garde
          // que la partie type pour l'envoi.
          const typeSimple = this.format.split(";")[0];
          const blob = new Blob(this.morceaux, { type: typeSimple });

          const base64 = await blobEnBase64(blob);

          this.nettoyer();
          resolve({
            base64,
            mimeType: typeSimple,
            tailleKo: Math.round(blob.size / 1024),
          });
        } catch (e) {
          this.nettoyer();
          reject(e);
        }
      };

      this.recorder.stop();
    });
  }

  annuler() {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop();
    }
    this.nettoyer();
  }

  nettoyer() {
    if (this.flux) {
      // Eteint physiquement le micro.
      this.flux.getTracks().forEach((piste) => piste.stop());
      this.flux = null;
    }
    this.recorder = null;
    this.morceaux = [];
  }
}

function blobEnBase64(blob) {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onloadend = () => {
      // Le resultat est "data:audio/ogg;base64,XXXX".
      // On ne garde que la partie apres la virgule.
      const resultat = lecteur.result;
      resolve(resultat.split(",")[1]);
    };
    lecteur.onerror = () => reject(new Error("Lecture du fichier echouee"));
    lecteur.readAsDataURL(blob);
  });
}
