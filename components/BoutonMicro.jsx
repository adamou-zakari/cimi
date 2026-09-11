"use client";

import { useState, useRef, useEffect } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";
import { EnregistreurFichier } from "@/lib/enregistreur";
import { parler, taireLaVoix, phraseAPrononcer } from "@/lib/voix";
import CarteVerdict from "@/components/CarteVerdict";
import SelecteurLangue from "@/components/SelecteurLangue";

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

  function reinitialiser() {
    setErreur("");
    setPartiel("");
    setResultat(null);
    setAConfirmer(null);
  }

  // ---------- MODE FRANCAIS : streaming temps reel ----------

  async function demarrerFrancais() {
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

  // ---------- MODE HAOUSSA : fichier complet ----------

  async function demarrerHaoussa() {
    enregistreur.current = new EnregistreurFichier();
    await enregistreur.current.demarrer();
  }

  async function terminerHaoussa() {
    if (!enregistreur.current) return;

    setEnEcoute(false);
    setEnTranscription(true);

    try {
      const { base64, mimeType, tailleKo } =
        await enregistreur.current.arreterEtRecuperer();
      enregistreur.current = null;

      console.log(`Audio envoye : ${tailleKo} Ko, ${mimeType}`);

      const reponse = await fetch("/api/haoussa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType }),
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
      if (langue === "fr") {
        await demarrerFrancais();
      } else {
        await demarrerHaoussa();
      }
      setEnEcoute(true);
    } catch {
      setErreur("Impossible d'acceder au micro. Verifiez l'autorisation.");
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
    if (langue === "ha" && enEcoute) {
      terminerHaoussa();
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

      // Pas de voix en hausa : aucun navigateur n'embarque de voix hausa.
      // La synthese lirait le texte avec une phonetique francaise,
      // incomprehensible pour un locuteur. Le texte reste affiche.
      if (voixActive && langue === "fr") {
        parler(phraseAPrononcer(donnees));
      }
    } catch {
      setErreur("La verification n'a pas abouti");
    } finally {
      setEnVerification(false);
    }
  }

  function basculerVoix() {
    const nouvelEtat = !voixActive;
    setVoixActive(nouvelEtat);
    if (!nouvelEtat) taireLaVoix();
  }

  const occupe = enTranscription || enVerification;

  let texteBouton = "Parler";
  if (enTranscription) texteBouton = "Transcription...";
  else if (enVerification) texteBouton = "Je verifie...";
  else if (enEcoute) texteBouton = "Arreter";

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
      <SelecteurLangue
        langue={langue}
        onChanger={(l) => {
          setLangue(l);
          taireLaVoix();
          reinitialiser();
        }}
        desactive={enEcoute || occupe}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={enEcoute ? arreter : demarrer}
          disabled={occupe}
          className={`px-8 py-4 rounded-full text-white font-medium transition ${
            occupe
              ? "bg-gray-600 cursor-not-allowed"
              : enEcoute
              ? "bg-red-600 animate-pulse"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {texteBouton}
        </button>

        {langue === "fr" && (
          <button
            onClick={basculerVoix}
            className="px-4 py-3 rounded-full border border-gray-600 text-gray-300 hover:border-gray-400 transition text-sm"
          >
            {voixActive ? "Son active" : "Son coupe"}
          </button>
        )}
      </div>

      {langue === "ha" && (
        <p className="text-gray-500 text-xs text-center max-w-md">
          Reponse en texte uniquement : aucune voix de synthese hausa
          n&apos;existe dans les navigateurs.
        </p>
      )}

      {langue === "ha" && enEcoute && (
        <p className="text-gray-500 text-sm">
          Parlez, puis appuyez sur Arreter quand vous avez fini.
        </p>
      )}

      {partiel && <p className="text-gray-400 italic">{partiel}</p>}

      {enTranscription && (
        <p className="text-gray-500 text-sm text-center">
          Transcription en cours. Le hausa prend plus de temps : les modeles
          sont moins optimises pour cette langue.
        </p>
      )}

      {enVerification && (
        <p className="text-gray-500 text-sm">Recherche des sources en cours...</p>
      )}

      {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

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

// Etape de confirmation : l'utilisateur relit et corrige
// avant que la verification ne parte.
function EcranConfirmation({ initial, incertain, onValider, onAnnuler }) {
  const [texte, setTexte] = useState(initial);

  return (
    <div className="w-full rounded-lg border border-gray-700 p-4">
      <p className="text-xs text-gray-500 mb-2">
        Cimi a entendu ceci. Corrigez si besoin avant de verifier.
      </p>

      {incertain && (
        <p className="text-xs text-yellow-500 mb-2">
          Certains passages sont marques [?] : Cimi n&apos;est pas sur de les
          avoir bien entendus.
        </p>
      )}

      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        className="w-full bg-black border border-gray-700 rounded p-3 text-white text-sm focus:border-blue-500 outline-none"
      />

      <div className="flex gap-3 mt-3">
        <button
          onClick={() => onValider(texte)}
          disabled={texte.trim().length < 10}
          className="px-5 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          Verifier
        </button>
        <button
          onClick={onAnnuler}
          className="px-5 py-2 rounded border border-gray-700 text-gray-400 text-sm hover:border-gray-500"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
