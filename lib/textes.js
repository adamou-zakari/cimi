// Tous les textes visibles de l'interface, dans les quatre langues.
// Codes : en, fr, ha, zr — identiques au selecteur, aux endpoints et aux prompts.
//
// L'interface suit l'onglet choisi : English -> anglais, Francais -> francais,
// Hausa -> haoussa, Zarma -> zarma.
//
// ha et zr : BROUILLONS a valider par un locuteur natif, ligne par ligne,
// avant le tournage. Pour corriger, ne modifier que le texte entre guillemets.

export const TEXTES = {
  en: {
    titre: "Say what you heard.",
    sousTitre:
      "Cimi finds the sources, tells you what they say, and lets you read them yourself.",
    pied: "Cimi means truth in Zarma. English, French, Hausa and Zarma.",
    groupeLangue: "Language",
    notes: {
      en: "real-time",
      fr: "real-time",
      ha: "text and voice",
      zr: "text and voice",
    },
    parler: "Speak",
    terminer: "Done",
    enTranscription: "Transcribing",
    enVerification: "Checking",
    couperSon: "Mute",
    activerSon: "Unmute",
    consigneFichier: "Speak, then press Done.",
    attente: "",
    recherche: "Searching for sources.",
    confirmation: "This is what Cimi heard. Correct it before checking.",
    incertain: "Passages marked [?] were not understood with certainty.",
    verifier: "Check",
    recommencer: "Start over",
    erreurMicro: "The microphone is not available. Allow it in your browser.",
    erreurTranscription: "Transcription failed.",
    erreurVerification: "The check failed.",
    erreurConnexion: "The connection was interrupted.",
    erreurVoix: "Voice is not available right now.",
    ecouter: "Listen",
    generationVoix: "Generating voice",
    sourcesTitre: "Read the sources yourself",
    confiance: "Confidence",
  },

  fr: {
    titre: "Dites ce que vous avez entendu.",
    sousTitre:
      "Cimi cherche les sources, vous dit ce qu'elles racontent, et vous laisse les lire vous-même.",
    pied: "Cimi veut dire vérité en zarma. Anglais, français, haoussa et zarma.",
    groupeLangue: "Langue",
    notes: {
      en: "temps réel",
      fr: "temps réel",
      ha: "texte et voix",
      zr: "texte et voix",
    },
    parler: "Parler",
    terminer: "Terminer",
    enTranscription: "Transcription",
    enVerification: "Vérification",
    couperSon: "Couper le son",
    activerSon: "Activer le son",
    consigneFichier: "Parlez, puis appuyez sur Terminer.",
    attente: "",
    recherche: "Recherche des sources.",
    confirmation: "Voici ce que Cimi a entendu. Corrigez avant de vérifier.",
    incertain: "Les passages marqués [?] n'ont pas été compris avec certitude.",
    verifier: "Vérifier",
    recommencer: "Recommencer",
    erreurMicro: "Le micro n'est pas accessible. Autorisez-le dans votre navigateur.",
    erreurTranscription: "La transcription n'a pas abouti.",
    erreurVerification: "La vérification n'a pas abouti.",
    erreurConnexion: "La connexion a été interrompue.",
    erreurVoix: "La voix n'est pas disponible pour le moment.",
    ecouter: "Écouter",
    generationVoix: "Génération de la voix",
    sourcesTitre: "Lisez les sources vous-même",
    confiance: "Confiance",
  },

  // BROUILLON — a valider
  ha: {
    titre: "Faɗi abin da ka ji.",
    sousTitre:
      "Cimi yana nemo majiyoyi, ya faɗa maka abin da suke cewa, sannan ya bar ka ka karanta su da kanka.",
    pied: "Cimi na nufin gaskiya a Zarma. Turanci, Faransanci, Hausa da Zarma.",
    groupeLangue: "Harshe",
    notes: {
      en: "nan take",
      fr: "nan take",
      ha: "rubutu da murya",
      zr: "rubutu da murya",
    },
    parler: "Yi magana",
    terminer: "Gama",
    enTranscription: "Ana rubutawa",
    enVerification: "Ana tantancewa",
    couperSon: "Kashe sauti",
    activerSon: "Kunna sauti",
    consigneFichier: "Yi magana, sannan ka danna Gama.",
    attente: "Ana rubuta Hausa. Wannan yana ɗaukar 'yan daƙiƙoƙi.",
    recherche: "Ana neman majiyoyi.",
    confirmation: "Ga abin da Cimi ya ji. Gyara kafin a tantance.",
    incertain: "Ba a fahimci wuraren da ke da alamar [?] sosai ba.",
    verifier: "Tantance",
    recommencer: "Sake farawa",
    erreurMicro: "Ba a iya amfani da makirufo ba. Ba shi izini a cikin burauzarka.",
    erreurTranscription: "Ba a iya rubuta maganar ba.",
    erreurVerification: "Ba a iya tantancewa ba.",
    erreurConnexion: "An katse haɗin.",
    erreurVoix: "Babu murya a yanzu.",
    ecouter: "Saurara",
    generationVoix: "Ana shirya murya",
    sourcesTitre: "Karanta majiyoyin da kanka",
    confiance: "Tabbaci",
  },

  // BROUILLON — a valider, confiance faible
  zr: {
    titre: "Ci hay kaŋ ni maa.",
    sousTitre:
      "Cimi ga baaru sursey ceeci, ka ci ni se i ga ci ifo, ka naŋ ni ma i caw ni boŋ se.",
    pied: "Cimi, Zarma ciine ra, cimi no. Anglisi, Faransi, Hawsa nda Zarma.",
    groupeLangue: "Ciine",
    notes: {
      en: "sohõ-sohõ",
      fr: "sohõ-sohõ",
      ha: "hantum nda jinde",
      zr: "hantum nda jinde",
    },
    parler: "Salaŋ",
    terminer: "A ban",
    enTranscription: "Hantum go",
    enVerification: "Guna go",
    couperSon: "Jinde kayandi",
    activerSon: "Jinde tunandi",
    consigneFichier: "Salaŋ, gaa ma A ban naagu.",
    attente: "Cimi go ga Zarma hantum. Guna a, ni ma a boorandi.",
    recherche: "Cimi go ga sursey ceeci.",
    confirmation: "Woone ti hay kaŋ Cimi maa. Boorandi a jina.",
    incertain: "Nangey kaŋ gonda [?], Cimi mana i maa taray.",
    verifier: "Guna",
    recommencer: "Ye ka sintin",
    erreurMicro: "Mikoro si goy. Naŋ a ma goy navigateur ra.",
    erreurTranscription: "Hantum mana te.",
    erreurVerification: "Guna mana te.",
    erreurConnexion: "Connexion dumbu.",
    erreurVoix: "Jinde si no sohõ.",
    ecouter: "Hangan",
    generationVoix: "Jinde go ga soolu",
    sourcesTitre: "Sursey caw ni boŋ se",
    confiance: "Naanay",
  },
};

// Nom de chaque langue ecrit dans sa propre langue : il ne change pas
// quand l'interface change, pour qu'un utilisateur retrouve toujours la sienne.
export const NOMS_LANGUES = [
  { code: "en", nom: "English" },
  { code: "fr", nom: "Français" },
  { code: "ha", nom: "Hausa" },
  { code: "zr", nom: "Zarma" },
];

// Attribut lang de la page, pour les lecteurs d'ecran.
// "dje" est le code ISO 639-3 du zarma ; "zr" reste notre code interne.
export const LANG_HTML = { en: "en", fr: "fr", ha: "ha", zr: "dje" };

// Langue de depart : anglais, sauf navigateur francophone.
export function langueDuNavigateur() {
  if (typeof navigator === "undefined") return "en";
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}
