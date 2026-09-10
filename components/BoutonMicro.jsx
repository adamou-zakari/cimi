"use client";

import { useState, useRef } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";

export default function BoutonMicro() {
  // Les états : quand ils changent, l'écran se met à jour.
  const [enEcoute, setEnEcoute] = useState(false);
  const [partiel, setPartiel] = useState("");
  const [phrases, setPhrases] = useState([]);
  const [erreur, setErreur] = useState("");

  // useRef garde une valeur SANS redessiner l'écran.
  // On l'utilise pour les objets techniques.
  const capture = useRef(null);
  const connexion = useRef(null);

  async function demarrer() {
    setErreur("");
    setPartiel("");

    try {
      // 1. Ouvrir la connexion vers AssemblyAI.
      connexion.current = new ConnexionTranscription();
      await connexion.current.connecter({
        onPartiel: (texte) => setPartiel(texte),
        onFinal: (texte) => {
          setPhrases((liste) => [...liste, texte]);
          setPartiel("");
        },
        onErreur: (message) => {
          setErreur(message);
          arreter();
        },
      });

      // 2. Démarrer le micro et brancher la sortie sur la connexion.
      capture.current = new CaptureAudio();
      await capture.current.demarrer((morceau) => {
        connexion.current?.envoyerAudio(morceau);
      });

      setEnEcoute(true);
    } catch (e) {
      // Message lisible, jamais le détail technique.
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
        className={`px-8 py-4 rounded-full text-white font-medium transition ${
          enEcoute ? "bg-red-600 animate-pulse" : "bg-blue-600"
        }`}
      >
        {enEcoute ? "Arrêter" : "Parler"}
      </button>

      {erreur && <p className="text-red-500 text-sm">{erreur}</p>}

      <div className="w-full space-y-2">
        {phrases.map((phrase, i) => (
          <p key={i} className="text-white">
            {phrase}
          </p>
        ))}
        {partiel && <p className="text-gray-400 italic">{partiel}</p>}
      </div>
    </div>
  );
}