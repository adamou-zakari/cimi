"use client";

const STYLES = {
  vrai: "border-green-600 text-green-400",
  faux: "border-red-600 text-red-400",
  "partiellement vrai": "border-yellow-600 text-yellow-400",
  "non verifiable": "border-gray-600 text-gray-400",
};

export default function CarteVerdict({ resultat }) {
  if (!resultat) return null;

  const style = STYLES[resultat.verdict] || STYLES["non verifiable"];

  return (
    <div className={`w-full rounded-lg border-2 p-5 ${style}`}>
      <p className="text-sm text-gray-400 mb-2">{resultat.affirmation}</p>
      <p className="text-2xl font-bold uppercase mb-3">{resultat.verdict}</p>
      <p className="text-gray-200 mb-4">{resultat.explication}</p>

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
