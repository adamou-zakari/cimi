"use client";

import { useState, useRef, useEffect } from "react";
import { CaptureAudio } from "@/lib/audio";
import { ConnexionTranscription } from "@/lib/assemblyai";
import { EnregistreurFichier } from "@/lib/enregistreur";
import { parler, taireLaVoix, phraseAPrononcer } from "@/lib/voix";
import CarteVerdict from "@/components/CarteVerdict";
import SelecteurLangue from "@/components/SelecteurLangue";
import { TEXTES } from "@/lib/textes";

// L'anglais et le francais passent par le streaming AssemblyAI.
// Le hausa et le zarma passent par un fichier envoye a Gemini :
// le zarma n'est dans aucune liste AssemblyAI, et le modele temps reel
// ne comprend pas le hausa. Les regles de prompt vivent dans la consigne Gemini.
const EN_STREAMING = ["en", "fr"];

// Codes de langue : en, fr, ha, zr. Ils doivent rester identiques
// entre le selecteur, les endpoints, les prompts et lib/textes.js.

// La langue est tenue par la page (app/page.js), pour que le titre
// et le pied de page suivent l'onglet choisi.
export default function BoutonMicro({ langue, onChangerLangue }) {
  const t = TEXTES[langue];
  const [enEcoute, setEnEcoute] = useState(false);
  const [partiel, setPartiel] = useState("");
  const [enTranscription, setEnTranscription] = useState(false);
  const [aConfirmer, setAConfirmer] = useState(null);
  const [enVerification, setEnVerification] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");
  const [voixActive, setVoixActive] = useState(true);

  const capture = useRef(null);
  const connexion = useRef(null);
  const enregistreur = useRef(null);

  useEffect(() => {
    return () => {
      taireLaVoix();
      capture.current?.arreter();
      connexion.current?.fermer();
      enregistreur.current?.annuler();
    };
  }, []);

  const streaming = EN_STREAMING.includes(langue);

  function reinitialiser() {
    setErreur("");
    setPartiel("");
    setResultat(null);
    setAConfirmer(null);
  }

  // ---------- STREAMING : anglais et francais ----------

  async function demarrerStreaming() {
    connexion.current = new ConnexionTranscription();
    await connexion.current.connecter(
      {
        onPartiel: (texte) => setPartiel(texte),
        onFinal: (texte) => {
          setPartiel("");
          arreterEcoute();
          setAConfirmer({ texte, incertain: false });
        },
        // Le message technique de la connexion n'est pas affiche :
        // on montre le texte de l'interface, dans la langue choisie.
        onErreur: () => {
          setErreur(t.erreurConnexion);
          arreterEcoute();
        },
      },
      langue
    );

    capture.current = new CaptureAudio();
    await capture.current.demarrer((morceau) => {
      connexion.current?.envoyerAudio(morceau);
    });
  }

  // ---------- FICHIER : hausa et zarma ----------

  async function demarrerFichier() {
    enregistreur.current = new EnregistreurFichier();
    await enregistreur.current.demarrer();
  }

  async function terminerFichier() {
    if (!enregistreur.current) return;

    setEnEcoute(false);
    setEnTranscription(true);

    try {
      const { base64, mimeType, tailleKo } =
        await enregistreur.current.arreterEtRecuperer();
      enregistreur.current = null;

      console.log(`Audio envoye : ${tailleKo} Ko, ${mimeType}, langue ${langue}`);

      const reponse = await fetch("/api/transcrire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, mimeType, langue }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(t.erreurTranscription);
        return;
      }

      setAConfirmer({
        texte: donnees.transcription,
        incertain: donnees.incertain,
      });
    } catch {
      setErreur(t.erreurTranscription);
    } finally {
      setEnTranscription(false);
    }
  }

  // ---------- COMMUN ----------

  async function demarrer() {
    taireLaVoix();
    reinitialiser();

    try {
      if (streaming) {
        await demarrerStreaming();
      } else {
        await demarrerFichier();
      }
      setEnEcoute(true);
    } catch {
      setErreur(t.erreurMicro);
      arreterEcoute();
    }
  }

  function arreterEcoute() {
    capture.current?.arreter();
    capture.current = null;
    connexion.current?.fermer();
    connexion.current = null;
    setEnEcoute(false);
    setPartiel("");
  }

  function arreter() {
    if (!streaming && enEcoute) {
      terminerFichier();
    } else {
      arreterEcoute();
    }
  }

  async function verifier(phrase) {
    setAConfirmer(null);
    setEnVerification(true);
    setResultat(null);
    setErreur("");

    try {
      const reponse = await fetch("/api/verifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affirmation: phrase, langue }),
      });

      const donnees = await reponse.json();

      if (!reponse.ok) {
        setErreur(t.erreurVerification);
        return;
      }

      setResultat(donnees);

      // Voix automatique en anglais et francais seulement : le navigateur
      // les fournit gratuitement et instantanement. Le hausa et le zarma
      // passent par un bouton dans la carte, car Gemini TTS prend
      // jusqu'a 17 secondes et consomme du quota.
      if (voixActive && EN_STREAMING.includes(langue)) {
        parler(phraseAPrononcer(donnees), langue === "en" ? "en-US" : "fr-FR");
      }
    } catch {
      setErreur(t.erreurVerification);
    } finally {
      setEnVerification(false);
    }
  }

  const occupe = enTranscription || enVerification;

  let texteBouton = t.parler;
  if (enTranscription) texteBouton = t.enTranscription;
  else if (enVerification) texteBouton = t.enVerification;
  else if (enEcoute) texteBouton = t.terminer;

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-xl">
      <SelecteurLangue
        langue={langue}
        onChanger={(l) => {
          onChangerLangue(l);
          taireLaVoix();
          reinitialiser();
        }}
        desactive={enEcoute || occupe}
      />

      <div className="flex items-center gap-3">
        <button
          onClick={enEcoute ? arreter : demarrer}
          disabled={occupe}
          data-etat={enEcoute ? "ecoute" : "repos"}
          className={`bouton-parler ${enEcoute ? "battement" : ""}`}
        >
          {texteBouton}
        </button>

        {streaming && (
          <button
            onClick={() => {
              const suivant = !voixActive;
              setVoixActive(suivant);
              if (!suivant) taireLaVoix();
            }}
            className="bouton-contour"
          >
            {voixActive ? t.couperSon : t.activerSon}
          </button>
        )}
      </div>

      {/* Un seul message d'etat a la fois, sous le bouton. */}
      <div className="min-h-6 text-center">
        {enEcoute && !streaming && (
          <p className="text-sm" style={{ color: "var(--coton-doux)" }}>
            {t.consigneFichier}
          </p>
        )}

        {enTranscription && (
          <p
            className="text-sm max-w-md mx-auto"
            style={{ color: "var(--coton-doux)" }}
          >
            {t.attente}
          </p>
        )}

        {enVerification && (
          <p className="text-sm" style={{ color: "var(--coton-doux)" }}>
            {t.recherche}
          </p>
        )}

        {partiel && (
          <p className="italic" style={{ color: "var(--coton-doux)" }}>
            {partiel}
          </p>
        )}

        {erreur && (
          <p className="text-sm" style={{ color: "var(--faux)" }}>
            {erreur}
          </p>
        )}
      </div>

      {aConfirmer && (
        <EcranConfirmation
          initial={aConfirmer.texte}
          incertain={aConfirmer.incertain}
          t={t}
          onValider={verifier}
          onAnnuler={() => setAConfirmer(null)}
        />
      )}

      <CarteVerdict resultat={resultat} langue={langue} />
    </div>
  );
}

// Etape de confirmation : l'utilisateur relit et corrige avant
// que la verification ne parte.
// Justification mesuree : en hausa, "ta rufe" (a ferme) a ete transcrit
// "ta bude" (a ouvert) - sens inverse. Le mot francais "mouton" est
// devenu "mutum" (personne). En zarma, "Niger" est devenu "Cher".
// Sans cette etape, Cimi verifierait une affirmation que personne
// n'a formulee, et rendrait un verdict source sur elle.
function EcranConfirmation({ initial, incertain, t, onValider, onAnnuler }) {
  const [texte, setTexte] = useState(initial);

  return (
    <div
      className="w-full rounded-lg p-5"
      style={{ border: "1px solid var(--encre-trait)" }}
    >
      <label
        htmlFor="transcription"
        className="block text-sm mb-3"
        style={{ color: "var(--coton-doux)" }}
      >
        {t.confirmation}
      </label>

      {incertain && (
        <p className="text-xs mb-3" style={{ color: "var(--partiel)" }}>
          {t.incertain}
        </p>
      )}

      <textarea
        id="transcription"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={3}
        className="champ"
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onValider(texte)}
          disabled={texte.trim().length < 10}
          className="bouton-parler"
          style={{ padding: "0.7rem 1.75rem", fontSize: "0.95rem" }}
        >
          {t.verifier}
        </button>
        <button onClick={onAnnuler} className="bouton-contour">
          {t.recommencer}
        </button>
      </div>
    </div>
  );
}
