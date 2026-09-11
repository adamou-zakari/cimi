// Les consignes envoyees au modele de verification.
// Fichier separe : ce texte evolue beaucoup pendant le projet.

const LANGUES = {
  fr: {
    nom: "francais",
    consigne: "Reponds en francais simple et clair.",
    verdicts: ['"vrai"', '"faux"', '"partiellement vrai"', '"non verifiable"'],
    confiances: ['"elevee"', '"moyenne"', '"faible"'],
  },
  ha: {
    nom: "hausa",
    consigne:
      "Reponds en hausa simple et clair, celui parle au Niger. " +
      "Si un terme technique n'a pas d'equivalent courant en hausa, " +
      "garde le mot francais plutot que d'inventer une traduction.",
    verdicts: ['"gaskiya"', '"karya"', '"gaskiya a wani bangare"', '"ba a tabbatar ba"'],
    confiances: ['"mai karfi"', '"matsakaici"', '"mai rauni"'],
  },
};

export function construirePrompt(affirmation, sources, langue = "fr") {
  const L = LANGUES[langue] || LANGUES.fr;

  const sourcesTexte = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.content}`)
    .join("\n\n");

  return `Tu es un verificateur de faits rigoureux qui travaille pour un public ouest-africain.

AFFIRMATION A VERIFIER :
"${affirmation}"

SOURCES TROUVEES SUR LE WEB :
${sourcesTexte}

REGLES ABSOLUES :
- Tu ne peux affirmer QUE ce que les sources permettent d'affirmer.
- Si les sources ne traitent pas du sujet, le verdict est "non verifiable". Ce n'est pas un echec, c'est la bonne reponse.
- Si les sources se contredisent, dis-le et donne le verdict "partiellement vrai".
- Ne complete JAMAIS avec tes connaissances generales. Les sources, rien qu'elles.
- Cite le numero des sources qui appuient ton verdict.

LANGUE DE REPONSE :
${L.consigne}
Les sources peuvent etre dans une autre langue que ta reponse. Lis-les dans leur langue, reponds dans la langue demandee.

Reponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni apres, sans balises de code :

{
  "affirmation": "l'affirmation reformulee clairement en une phrase, en ${L.nom}",
  "verdict": ${L.verdicts.join(" | ")},
  "explication": "deux phrases maximum, en ${L.nom}",
  "sources_utilisees": [1, 2],
  "confiance": ${L.confiances.join(" | ")}
}`;
}

// Table de correspondance pour l'affichage : quelle que soit la langue
// de reponse, l'interface doit savoir quelle couleur appliquer.
export const VERDICTS_NORMALISES = {
  vrai: "vrai",
  gaskiya: "vrai",
  faux: "faux",
  karya: "faux",
  "partiellement vrai": "partiellement vrai",
  "gaskiya a wani bangare": "partiellement vrai",
  "non verifiable": "non verifiable",
  "non vérifiable": "non verifiable",
  "ba a tabbatar ba": "non verifiable",
};
