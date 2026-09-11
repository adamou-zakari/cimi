"use client";

import { useState, useRef, useEffect } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";
import { parler, taireLaVoix, phraseAPrononcer } from "@/lib/voix";
import CarteVerdict from "@/components/CarteVerdict";

export default function BoutonMicro() {
  const [enEcoute, setEnEcoute] = useState(false);
  const [partiel, setPartiel] = useState("");
  const [enVerification, setEnVerification] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [voixActive, setVoixActive] = useState(true);

  const capture = useRef(null);
  const connexion = useRef(null);

  // Si l'utilisateur quitte la page, on coupe tout.
  useEffect(() => {
    return () => {
      taireLaVoix();
      capture.current?.arreter();
      connexion.current?.fermer();
    };
  }, []);

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
        setErreur(donnees.error || "La verification n'a pas abouti");
        return;
      }

      setResultat(donnees);

      // Le verdict est lu a voix haute.
      if (voixActive) {
        parler(phraseAPrononcer(donnees));
      }
    } catch {
      setErreur("La verification n'a pas abouti");
    } finally {
      setEnVerification(false);
    }
  }

  async function demarrer() {
    // On coupe la voix precedente avant d'ecouter,
    // sinon le micro capte ce que l'agent est en train de dire.
    taireLaVoix();

    setErreur("");
    setPartiel("");
    setResultat(null);

    try {
      connexion.current = new ConnexionTranscription();
      await connexion.current.connecter({
        onPartiel: (texte) => setPartiel(texte),
        onFinal: (texte) => {
          setPartiel("");
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
      setErreur("Impossible d'acceder au micro. Verifiez l'autorisation.");
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

  function basculerVoix() {
    const nouvelEtat = !voixActive;
    setVoixActive(nouvelEtat);
    if (!nouvelEtat) taireLaVoix();
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl">
      <div className="flex items-center gap-4">
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
          {enVerification ? "Je verifie..." : enEcoute ? "Arreter" : "Parler"}
        </button>

        <button
          onClick={basculerVoix}
          title={voixActive ? "Couper la voix" : "Activer la voix"}
          className="px-4 py-3 rounded-full border border-gray-600 text-gray-300 hover:border-gray-400 transition"
        >
          {voixActive ? "Son active" : "Son coupe"}
        </button>
      </div>

      {partiel && <p className="text-gray-400 italic">{partiel}</p>}

      {enVerification && (
        <p className="text-gray-500 text-sm">Recherche des sources en cours...</p>
      )}

      {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

      <CarteVerdict resultat={resultat} />
    </div>
  );
}
