"use client";

import { useState, useRef, useEffect } from "react";

// La couleur vient du verdict NORMALISE : "gaskiya", "cimi" et "vrai"
// doivent produire le meme vert, quelle que soit la langue.
const COULEURS = {
  vrai: "var(--vrai)",
  faux: "var(--faux)",
  "partiellement vrai": "var(--partiel)",
  "non verifiable": "var(--inconnu)",
};

// Le navigateur n'a de voix ni en hausa ni en zarma.
// Les deux passent par Gemini TTS, a la demande.
const AVEC_VOIX_DISTANTE = {
  ha: "Ecouter en hausa",
  zr: "Ecouter en zarma",
};

export default function CarteVerdict({ resultat, langue }) {
  const [chargementVoix, setChargementVoix] = useState(false);
  const [erreurVoix, setErreurVoix] = useState("");
  const audioRef = useRef(null);
  const urlRef = useRef(null);

  // On libere l'URL du blob a chaque nouveau verdict :
  // sinon chaque ecoute laisse un fichier audio en memoire.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [resultat]);

  if (!resultat) return null;

  const cle = resultat.verdictNormalise || resultat.verdict;
  const couleur = COULEURS[cle] || COULEURS["non verifiable"];
  const libelleVoix = AVEC_VOIX_DISTANTE[langue];

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
        body: JSON.stringify({ texte, langue }),
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
    <section
      className="verdict w-full"
      style={{ "--couleur-verdict": couleur }}
      aria-live="polite"
    >
      <p
        className="text-sm leading-relaxed mb-4"
        style={{ color: "var(--coton-doux)" }}
      >
        {resultat.affirmation}
      </p>

      <p className="verdict-mot mb-4">{resultat.verdict}</p>

      <p className="leading-relaxed mb-5">{resultat.explication}</p>

      {libelleVoix && (
        <div className="mb-5">
          <button
            onClick={ecouter}
            disabled={chargementVoix}
            className="bouton-contour"
          >
            {chargementVoix ? "Generation de la voix" : libelleVoix}
          </button>

          {erreurVoix && (
            <p className="text-xs mt-2" style={{ color: "var(--faux)" }}>
              {erreurVoix}
            </p>
          )}

          <audio ref={audioRef} className="hidden" />
        </div>
      )}

      {resultat.sources && resultat.sources.length > 0 && (
        <div
          className="pt-4"
          style={{ borderTop: "1px solid var(--encre-trait)" }}
        >
          <p className="text-xs mb-3" style={{ color: "var(--coton-doux)" }}>
            Lisez les sources vous-meme
          </p>
          {/* Numerotees parce que ce sont reellement des pieces
              successives d'un dossier, pas une decoration. */}
          <ol className="space-y-2">
            {resultat.sources.map((source, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="shrink-0 tabular-nums"
                  style={{ color: "var(--mil)" }}
                >
                  {i + 1}
                </span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--coton)" }}
                >
                  {source.titre}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs mt-5" style={{ color: "var(--coton-doux)" }}>
        Confiance : {resultat.confiance}
      </p>
    </section>
  );
}
