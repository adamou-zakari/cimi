"use client";

import { useEffect, useState } from "react";
import BoutonMicro from "@/components/BoutonMicro";
import Logo from "@/components/Logo";

// Textes de l'accueil. Meme regle que le reste de l'application :
// anglais par defaut, francais si le navigateur est en francais.
const TEXTES = {
  en: {
    titre: "Say what you heard.",
    sousTitre:
      "Cimi finds the sources, tells you what they say, and lets you read them yourself.",
    pied: "Cimi means truth in Zarma. English, French, Hausa and Zarma.",
  },
  fr: {
    titre: "Dites ce que vous avez entendu.",
    sousTitre:
      "Cimi cherche les sources, vous dit ce qu'elles racontent, et vous laisse les lire vous-même.",
    pied: "Cimi veut dire vérité en zarma. Anglais, français, haoussa et zarma.",
  },
};

export default function Home() {
  // Le serveur ne connait pas la langue du navigateur : on rend l'anglais,
  // puis on bascule en francais apres le montage si besoin.
  const [langue, setLangue] = useState("en");

  useEffect(() => {
    if (navigator.language?.toLowerCase().startsWith("fr")) {
      setLangue("fr");
    }
  }, []);

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

        <BoutonMicro />
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
