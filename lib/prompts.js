// Les consignes envoyees au modele de verification.
// Fichier separe : ce texte evolue beaucoup pendant le projet.

const LANGUES = {
  // L'anglais n'est pas une langue d'usage au Niger. Il est la pour que
  // les juges du hackathon puissent essayer le produit eux-memes.
  en: {
    nom: "anglais",
    consigne: "Answer in plain, clear English.",
    verdicts: ['"true"', '"false"', '"partly true"', '"not verifiable"'],
    confiances: ['"high"', '"medium"', '"low"'],
  },
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
    verdicts: [
      '"gaskiya"',
      '"karya"',
      '"gaskiya a wani bangare"',
      '"ba a tabbatar ba"',
    ],
    confiances: ['"mai karfi"', '"matsakaici"', '"mai rauni"'],
  },
  zr: {
    nom: "zarma",
    consigne:
      "Reponds en zarma simple et clair, celui parle a Niamey. " +
      "Si un terme technique n'a pas d'equivalent courant en zarma, " +
      "garde le mot francais plutot que d'inventer une traduction. " +
      "Le zarma n'a pas d'orthographe standardisee : ecris simplement, " +
      "comme on le parle.",
    verdicts: ['"cimi"', '"tangari"', '"cimi kayna"', '"mana bay"'],
    confiances: ['"gaabi"', '"game"', '"kayna"'],
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

// Le verdict revient dans la langue de l'utilisateur, mais l'interface
// a besoin d'une cle stable pour choisir la couleur d'affichage.
export const VERDICTS_NORMALISES = {
  // anglais
  true: "vrai",
  false: "faux",
  "partly true": "partiellement vrai",
  "not verifiable": "non verifiable",
  // francais
  vrai: "vrai",
  faux: "faux",
  "partiellement vrai": "partiellement vrai",
  "non verifiable": "non verifiable",
  "non vérifiable": "non verifiable",
  // hausa
  gaskiya: "vrai",
  karya: "faux",
  "gaskiya a wani bangare": "partiellement vrai",
  "ba a tabbatar ba": "non verifiable",
  // zarma
  cimi: "vrai",
  tangari: "faux",
  "cimi kayna": "partiellement vrai",
  "mana bay": "non verifiable",
};

// Reponses de repli quand aucune source n'est trouvee.
// On ne fait jamais appel au modele dans ce cas : sans sources,
// il comblerait le vide avec ce qu'il croit savoir.
export const SANS_SOURCE = {
  en: {
    verdict: "not verifiable",
    explication: "No source found on this subject.",
    confiance: "low",
  },
  fr: {
    verdict: "non verifiable",
    explication: "Aucune source trouvee sur ce sujet.",
    confiance: "faible",
  },
  ha: {
    verdict: "ba a tabbatar ba",
    explication: "Ba a samu wata majiya kan wannan batu ba.",
    confiance: "mai rauni",
  },
  zr: {
    verdict: "mana bay",
    explication: "Iri mana du baaru kulu wo boro se.",
    confiance: "kayna",
  },
};
