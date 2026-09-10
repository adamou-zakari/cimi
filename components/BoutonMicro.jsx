"use client";

import { useState, useRef } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";
import CarteVerdict from "@/components/CarteVerdict";

export default function BoutonMicro() {
  const [enEcoute, setEnEcoute] = useState(false);
  const [partiel, setPartiel] = useState("");
  const [enVerification, setEnVerification] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");

  const capture = useRef(null);
  const connexion = useRef(null);

  // Envoie une phrase finale à la vérification.
  async function verifier(phrase) {
    setEnVerification(true);
    setResultat(null);
    setErreur("");

    try {
      const reponse = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affirmation: phrase }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(donnees.error || "La vérification n'a pas abouti");
        return;
      }

      setResultat(donnees);
    } catch {
      setErreur("La vérification n'a pas abouti");
    } finally {
      setEnVerification(false);
    }
  }

  async function demarrer() {
    setErreur("");
    setPartiel("");
    setResultat(null);

    try {
      connexion.current = new ConnexionTranscription();
      await connexion.current.connecter({
        onPartiel: (texte) => setPartiel(texte),
        onFinal: (texte) => {
          setPartiel("");
          // On arrête d'écouter et on vérifie.
          arreter();
          verifier(texte);
        },
        onErreur: (message) => {
          setErreur(message);
          arreter();
        },
      });

      capture.current = new CaptureAudio();
      await capture.current.demarrer((morceau) => {
        connexion.current?.envoyerAudio(morceau);
      });

      setEnEcoute(true);
    } catch {
      setErreur("Impossible d'accéder au micro. Vérifiez l'autorisation.");
      arreter();
    }
  }

  function arreter() {
    capture.current?.arreter();
    capture.current = null;
    connexion.current?.fermer();
    connexion.current = null;
    setEnEcoute(false);
    setPartiel("");
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
      <button
        onClick={enEcoute ? arreter : demarrer}
        disabled={enVerification}
        className={`px-8 py-4 rounded-full text-white font-medium transition ${
          enVerification
            ? "bg-gray-600 cursor-not-allowed"
            : enEcoute
            ? "bg-red-600 animate-pulse"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {enVerification ? "Je vérifie…" : enEcoute ? "Arrêter" : "Parler"}
      </button>

      {partiel && <p className="text-gray-400 italic">{partiel}</p>}

      {enVerification && (
        <p className="text-gray-500 text-sm">
          Recherche des sources en cours…
        </p>
      )}

      {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

      <CarteVerdict resultat={resultat} />
    </div>
  );
}