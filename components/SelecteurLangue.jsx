"use client";

// Quatre langues, trois niveaux de service reels.
// L'anglais n'est pas une langue d'usage au Niger : il est la pour
// que les juges du hackathon puissent essayer le produit eux-memes.
const LANGUES = [
  { code: "en", nom: "English", note: "instant" },
  { code: "fr", nom: "Francais", note: "reponse immediate" },
  { code: "ha", nom: "Hausa", note: "texte et voix" },
  { code: "zr", nom: "Zarma", note: "texte et voix" },
];

export default function SelecteurLangue({ langue, onChanger, desactive }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="group"
      aria-label="Langue"
    >
      {LANGUES.map((l) => (
        <button
          key={l.code}
          onClick={() => onChanger(l.code)}
          disabled={desactive}
          data-actif={langue === l.code}
          aria-pressed={langue === l.code}
          className="onglet"
        >
          <span className="block text-sm font-medium">{l.nom}</span>
          <span className="block text-xs opacity-65">{l.note}</span>
        </button>
      ))}
    </div>
  );
}
