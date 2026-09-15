"use client";

import { TEXTES, NOMS_LANGUES, LANG_HTML } from "@/lib/textes";

// Quatre langues, deux chemins de transcription.
// L'anglais n'est pas une langue d'usage au Niger : il est la pour
// que les juges du hackathon puissent essayer le produit eux-memes.
// Le nom de chaque langue reste ecrit dans sa propre langue ;
// seule la note en dessous suit la langue de l'interface.
export default function SelecteurLangue({ langue, onChanger, desactive }) {
  const t = TEXTES[langue];

  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="group"
      aria-label={t.groupeLangue}
    >
      {NOMS_LANGUES.map((l) => (
        <button
          key={l.code}
          onClick={() => onChanger(l.code)}
          disabled={desactive}
          data-actif={langue === l.code}
          aria-pressed={langue === l.code}
          className="onglet"
        >
          <span
            className="block text-sm font-medium"
            lang={LANG_HTML[l.code]}
          >
            {l.nom}
          </span>
          <span className="block text-xs opacity-65">{t.notes[l.code]}</span>
        </button>
      ))}
    </div>
  );
}
