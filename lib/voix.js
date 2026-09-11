// Synthèse vocale via l'API intégrée au navigateur.
// Aucune clé, aucun coût, aucune latence réseau.

export function parler(texte, langue = "fr-FR") {
  // Tous les navigateurs ne l'ont pas.
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  // On coupe ce qui est en cours avant de parler.
  window.speechSynthesis.cancel();

  const message = new SpeechSynthesisUtterance(texte);
  message.lang = langue;
  message.rate = 0.95;  // un peu plus lent que la normale
  message.pitch = 1;
  message.volume = 1;

  window.speechSynthesis.speak(message);
  return true;
}

export function taireLaVoix() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Construit la phrase que Cimi va prononcer.
// On ne lit PAS les URL à voix haute — elles sont à l'écran.
export function phraseAPrononcer(resultat) {
  const intros = {
    vrai: "C'est vrai.",
    faux: "C'est faux.",
    "partiellement vrai": "C'est partiellement vrai.",
    "non verifiable": "Je ne peux pas vérifier cela.",
  };

  const intro = intros[resultat.verdict] || intros["non verifiable"];
  const nb = resultat.sources?.length || 0;

  const mention =
    nb > 0
      ? ` J'ai trouvé ${nb} source${nb > 1 ? "s" : ""}, elles sont à l'écran.`
      : "";

  return `${intro} ${resultat.explication}${mention}`;
}