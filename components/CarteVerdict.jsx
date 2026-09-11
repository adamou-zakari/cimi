"use client";

import { useState, useRef, useEffect } from "react";

// Les couleurs sont choisies sur le verdict NORMALISE, pas sur le
// texte affiche : "gaskiya" et "vrai" doivent donner le meme vert.
const STYLES = {
  vrai: "border-green-600 text-green-400",
  faux: "border-red-600 text-red-400",
  "partiellement vrai": "border-yellow-600 text-yellow-400",
  "non verifiable": "border-gray-600 text-gray-400",
};

export default function CarteVerdict({ resultat, langue }) {
  const [chargementVoix, setChargementVoix] = useState(false);
  const [erreurVoix, setErreurVoix] = useState("");
  const audioRef = useRef(null);
  const urlRef = useRef(null);

  // On libere l'URL du blob quand le composant disparait
  // ou quand un nouveau verdict arrive : sinon la memoire fuit.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [resultat]);

  if (!resultat) return null;

  const cle = resultat.verdictNormalise || resultat.verdict;
  const style = STYLES[cle] || STYLES["non verifiable"];

  async function ecouter() {
    setErreurVoix("");
    setChargementVoix(true);

    try {
      // On lit le verdict et l'explication, pas les URL :
      // elles sont a l'ecran, les epeler n'aiderait personne.
      const texte = `${resultat.verdict}. ${resultat.explication}`;

      const reponse = await fetch("/api/voix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte }),
      });

      if (!reponse.ok) {
        const donnees = await reponse.json().catch(() => ({}));
        setErreurVoix(donnees.error || "La voix n'est pas disponible");
        return;
      }

      const blob = await reponse.blob();

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = urlRef.current;
        await audioRef.current.play();
      }
    } catch {
      setErreurVoix("La voix n'est pas disponible");
    } finally {
      setChargementVoix(false);
    }
  }

  return (
    <div className={`w-full rounded-lg border-2 p-5 ${style}`}>
      <p className="text-sm text-gray-400 mb-2">{resultat.affirmation}</p>
      <p className="text-2xl font-bold uppercase mb-3">{resultat.verdict}</p>
      <p className="text-gray-200 mb-4">{resultat.explication}</p>

      {langue === "ha" && (
        <div className="mb-4">
          <button
            onClick={ecouter}
            disabled={chargementVoix}
            className="px-4 py-2 rounded border border-gray-600 text-gray-300 text-sm hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chargementVoix ? "Generation de la voix..." : "Ecouter en hausa"}
          </button>

          {erreurVoix && (
            <p className="text-red-500 text-xs mt-2">{erreurVoix}</p>
          )}

          <audio ref={audioRef} className="hidden" />
        </div>
      )}

      {resultat.sources && resultat.sources.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-500 mb-2">
            Sources - verifiez par vous-meme :
          </p>
          <ul className="space-y-1">
            {resultat.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline"
                >
                  {source.titre}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Confiance : {resultat.confiance}
      </p>
    </div>
  );
}
