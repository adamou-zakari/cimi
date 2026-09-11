"use client";

export default function SelecteurLangue({ langue, onChanger, desactive }) {
  const LANGUES = [
    { code: "fr", nom: "Francais", note: "temps reel" },
    { code: "ha", nom: "Hausa", note: "plus lent" },
  ];

  return (
    <div className="flex gap-2">
      {LANGUES.map((l) => {
        const actif = langue === l.code;
        return (
          <button
            key={l.code}
            onClick={() => onChanger(l.code)}
            disabled={desactive}
            className={`px-4 py-2 rounded-lg border text-sm transition ${
              actif
                ? "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            } ${desactive ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="block font-medium">{l.nom}</span>
            <span className="block text-xs opacity-70">{l.note}</span>
          </button>
        );
      })}
    </div>
  );
}
