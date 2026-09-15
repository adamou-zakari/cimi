"use client";

import { useEffect, useState } from "react";
import BoutonMicro from "@/components/BoutonMicro";
import Logo from "@/components/Logo";
import { TEXTES, LANG_HTML, langueDuNavigateur } from "@/lib/textes";

export default function Home() {
  // La langue vit ici pour que le titre et le pied de page suivent
  // l'onglet choisi dans BoutonMicro.
  // Le serveur ne connait pas la langue du navigateur : on rend l'anglais,
  // puis on bascule apres le montage si besoin.
  const [langue, setLangue] = useState("en");

  useEffect(() => {
    setLangue(langueDuNavigateur());
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANG_HTML[langue];
  }, [langue]);

  const t = TEXTES[langue];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-5 flex items-center gap-3">
        <Logo />
        <span className="display text-xl">Cimi</span>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-16">
        <div className="w-full max-w-xl text-center mb-10">
          <h1 className="display text-3xl sm:text-4xl leading-tight mb-3">
            {t.titre}
          </h1>
          <p
            className="text-base leading-relaxed mx-auto"
            style={{ color: "var(--coton-doux)", maxWidth: "34rem" }}
          >
            {t.sousTitre}
          </p>
        </div>

        <BoutonMicro langue={langue} onChangerLangue={setLangue} />
      </main>

      <footer
        className="px-6 py-5 text-xs text-center"
        style={{ color: "var(--coton-doux)" }}
      >
        {t.pied}
      </footer>
    </div>
  );
}
