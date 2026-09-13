"use client";

import { useState, useRef, useEffect } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";
import { EnregistreurFichier } from "@/lib/enregistreur";
import { parler, taireLaVoix, phraseAPrononcer } from "@/lib/voix";
import CarteVerdict from "@/components/CarteVerdict";
import SelecteurLangue from "@/components/SelecteurLangue";

// Le francais passe par le streaming AssemblyAI.
// Le hausa et le zarma passent par un fichier envoye a Gemini :
// AssemblyAI ne couvre aucune des deux.
const EN_STREAMING = ["fr"];

const MESSAGES_ATTENTE = {
  ha: "Transcription du hausa. Les modeles sont moins entraines sur cette langue, cela prend quelques secondes de plus.",
  zar: "Transcription du zarma. Aucun service commercial ne transcrit cette langue : Cimi utilise un modele generaliste, le resultat demande souvent une correction.",
};

export default function BoutonMicro() {
  const [langue, setLangue] = useState("fr");
  const [enEcoute, setEnEcoute] = useState(false);
  const [partiel, setPartiel] = useState("");
  const [enTranscription, setEnTranscription] = useState(false);
  const [aConfirmer, setAConfirmer] = useState(null);
  const [enVerification, setEnVerification] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [voixActive, setVoixActive] = useState(true);

  const capture = useRef(null);
  const connexion = useRef(null);
  const enregistreur = useRef(null);

  useEffect(() => {
    return () => {
      taireLaVoix();
      capture.current?.arreter();
      connexion.current?.fermer();
      enregistreur.current?.annuler();
    };
  }, []);

  const streaming = EN_STREAMING.includes(langue);

  function reinitialiser() {
    setErreur("");
    setPartiel("");
    setResultat(null);
    setAConfirmer(null);
  }

  // ---------- STREAMING : francais ----------

  async function demarrerStreaming() {
    connexion.current = new ConnexionTranscription();
    await connexion.current.connecter({
      onPartiel: (texte) => setPartiel(texte),
      onFinal: (texte) => {
        setPartiel("");
        arreterEcoute();
        setAConfirmer({ texte, incertain: false });
      },
      onErreur: (message) => {
        setErreur(message);
        arreterEcoute();
      },
    });

    capture.current = new CaptureAudio();
    await capture.current.demarrer((morceau) => {
      connexion.current?.envoyerAudio(morceau);
    });
  }

  // ---------- FICHIER : hausa et zarma ----------

  async function demarrerFichier() {
    enregistreur.current = new EnregistreurFichier();
    await enregistreur.current.demarrer();
  }

  async function terminerFichier() {
    if (!enregistreur.current) return;

    setEnEcoute(false);
    setEnTranscription(true);

    try {
      const { base64, mimeType, tailleKo } =
        await enregistreur.current.arreterEtRecuperer();
      enregistreur.current = null;

      console.log(`Audio envoye : ${tailleKo} Ko, ${mimeType}, langue ${langue}`);

      const reponse = await fetch("/api/transcrire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType, langue }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(donnees.error || "La transcription n'a pas abouti");
        return;
      }

      setAConfirmer({
        texte: donnees.transcription,
        incertain: donnees.incertain,
      });
    } catch {
      setErreur("La transcription n'a pas abouti");
    } finally {
      setEnTranscription(false);
    }
  }

  // ---------- COMMUN ----------

  async function demarrer() {
    taireLaVoix();
    reinitialiser();

    try {
      if (streaming) {
        await demarrerStreaming();
      } else {
        await demarrerFichier();
      }
      setEnEcoute(true);
    } catch {
      setErreur("Le micro n'est pas accessible. Autorisez-le dans votre navigateur.");
      arreterEcoute();
    }
  }

  function arreterEcoute() {
    capture.current?.arreter();
    capture.current = null;
    connexion.current?.fermer();
    connexion.current = null;
    setEnEcoute(false);
    setPartiel("");
  }

  function arreter() {
    if (!streaming && enEcoute) {
      terminerFichier();
    } else {
      arreterEcoute();
    }
  }

  async function verifier(phrase) {
    setAConfirmer(null);
    setEnVerification(true);
    setResultat(null);
    setErreur("");

    try {
      const reponse = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affirmation: phrase, langue }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(donnees.error || "La verification n'a pas abouti");
        return;
      }

      setResultat(donnees);

      // Voix automatique en francais seulement : le navigateur la fournit
      // gratuitement et instantanement. Le hausa passe par un bouton
      // dans la carte, car sa generation prend jusqu'a 17 secondes.
      if (voixActive && langue === "fr") {
        parler(phraseAPrononcer(donnees));
      }
    } catch {
      setErreur("La verification n'a pas abouti");
    } finally {
      setEnVerification(false);
    }
  }

  const occupe = enTranscription || enVerification;

  let texteBouton = "Parler";
  if (enTranscription) texteBouton = "Transcription";
  else if (enVerification) texteBouton = "Verification";
  else if (enEcoute) texteBouton = "Terminer";

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-xl">
      <SelecteurLangue
        langue={langue}
        onChanger={(l) => {
          setLangue(l);
          taireLaVoix();
          reinitialiser();
        }}
        desactive={enEcoute || occupe}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={enEcoute ? arreter : demarrer}
          disabled={occupe}
          data-etat={enEcoute ? "ecoute" : "repos"}
          className={`bouton-parler ${enEcoute ? "battement" : ""}`}
        >
          {texteBouton}
        </button>

        {langue === "fr" && (
          <button
            onClick={() => {
              const suivant = !voixActive;
              setVoixActive(suivant);
              if (!suivant) taireLaVoix();
            }}
            className="bouton-contour"
          >
            {voixActive ? "Couper le son" : "Activer le son"}
          </button>
        )}
      </div>

      {/* Un seul message d'etat a la fois, sous le bouton. */}
      <div className="min-h-6 text-center">
        {enEcoute && !streaming && (
          <p className="text-sm" style={{ color: "var(--coton-doux)" }}>
            Parlez, puis appuyez sur Terminer.
          </p>
        )}

        {enTranscription && (
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--coton-doux)" }}>
            {MESSAGES_ATTENTE[langue]}
          </p>
        )}

        {enVerification && (
          <p className="text-sm" style={{ color: "var(--coton-doux)" }}>
            Recherche des sources.
          </p>
        )}

        {partiel && (
          <p className="italic" style={{ color: "var(--coton-doux)" }}>
            {partiel}
          </p>
        )}

        {erreur && (
          <p className="text-sm" style={{ color: "var(--faux)" }}>
            {erreur}
          </p>
        )}
      </div>

      {aConfirmer && (
        <EcranConfirmation
          initial={aConfirmer.texte}
          incertain={aConfirmer.incertain}
          onValider={verifier}
          onAnnuler={() => setAConfirmer(null)}
        />
      )}

      <CarteVerdict resultat={resultat} langue={langue} />
    </div>
  );
}

// Etape de confirmation : l'utilisateur relit et corrige avant
// que la verification ne parte.
// Justification mesuree : en hausa, "ta rufe" (a ferme) a ete transcrit
// "ta bude" (a ouvert) - sens inverse. En zarma, "Niger" est devenu
// "Cher". Sans cette etape, Cimi verifierait une affirmation que
// personne n'a formulee, et rendrait un verdict sourcé sur elle.
function EcranConfirmation({ initial, incertain, onValider, onAnnuler }) {
  const [texte, setTexte] = useState(initial);

  return (
    <div className="w-full rounded-lg p-5" style={{ border: "1px solid var(--encre-trait)" }}>
      <label
        htmlFor="transcription"
        className="block text-sm mb-3"
        style={{ color: "var(--coton-doux)" }}
      >
        Voici ce que Cimi a entendu. Corrigez avant de verifier.
      </label>

      {incertain && (
        <p className="text-xs mb-3" style={{ color: "var(--partiel)" }}>
          Les passages marques [?] n&apos;ont pas ete compris avec certitude.
        </p>
      )}

      <textarea
        id="transcription"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        className="champ"
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onValider(texte)}
          disabled={texte.trim().length < 10}
          className="bouton-parler"
          style={{ padding: "0.7rem 1.75rem", fontSize: "0.95rem" }}
        >
          Verifier
        </button>
        <button onClick={onAnnuler} className="bouton-contour">
          Recommencer
        </button>
      </div>
    </div>
  );
}
