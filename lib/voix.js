// Synthese vocale via l'API integree au navigateur.
// Aucune cle, aucun cout, aucune latence reseau.
// Ne couvre que l'anglais et le francais : le navigateur n'a
// ni voix hausa ni voix zarma. Ces deux langues passent par
// Gemini TTS, a la demande, depuis la carte verdict.

export function parler(texte, langue = "fr-FR") {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  // On coupe ce qui est en cours avant de parler : sinon deux
  // reponses se superposent quand l'utilisateur enchaine.
  window.speechSynthesis.cancel();

  const message = new SpeechSynthesisUtterance(texte);
  message.lang = langue;
  message.rate = 0.95; // un peu plus lent : meilleur sur les dates et les noms
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

// Construit la phrase que Cimi prononce.
// On ne lit pas les URL : elles sont a l'ecran, les epeler
// n'aiderait personne. La voix donne le verdict, l'ecran la preuve.
const INTROS = {
  // anglais
  true: "That's true.",
  false: "That's false.",
  "partly true": "That's partly true.",
  "not verifiable": "I can't verify that.",
  // francais
  vrai: "C'est vrai.",
  faux: "C'est faux.",
  "partiellement vrai": "C'est partiellement vrai.",
  "non verifiable": "Je ne peux pas verifier cela.",
};

export function phraseAPrononcer(resultat) {
  const cle = (resultat.verdict || "").toLowerCase().trim();
  const anglais = cle === "true" || cle === "false" ||
                  cle === "partly true" || cle === "not verifiable";

  const intro = INTROS[cle] || (anglais ? INTROS["not verifiable"] : INTROS["non verifiable"]);
  const nb = resultat.sources?.length || 0;

  let mention = "";
  if (nb > 0) {
    mention = anglais
      ? ` I found ${nb} source${nb > 1 ? "s" : ""}, they're on screen.`
      : ` J'ai trouve ${nb} source${nb > 1 ? "s" : ""}, elles sont a l'ecran.`;
  }

  return `${intro} ${resultat.explication}${mention}`;
}
