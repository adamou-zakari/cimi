# Cimi

**Voice fact-checking in French, Hausa and Zarma.**

Speak a claim you heard. Cimi transcribes it, searches the web, and answers with the sources on screen.

Built on AssemblyAI for the Voice Agent Hackathon, September 2026.

**Live: https://cimi-psi.vercel.app**

---

## Why

Most people in the Sahel get their information by voice — radio, WhatsApp voice notes, word of mouth. Fact-checking tools assume you can type, and they assume you speak a language the models were trained on.

Niamey speaks French, Hausa and Zarma. Only one of the three is served by real-time speech technology.

Cimi works in all three anyway, and shows honestly where the technology stops.

---

## How it works

You press a button and speak. Cimi transcribes, shows you what it heard, and waits for you to confirm. Then it searches the web, reads the sources, and returns a verdict in the language you spoke — with every source listed and clickable.

```
Speech  →  Transcription  →  You confirm  →  Web search  →  Verdict + sources
```

Two transcription paths, because AssemblyAI covers French but neither Hausa nor Zarma.

| Language | Transcription | Latency | Voice reply |
|---|---|---|---|
| French | AssemblyAI real-time streaming | immediate | browser TTS |
| Hausa | Gemini, file-based | 5–8 s | Gemini TTS, on demand |
| Zarma | Gemini, file-based | 3–4 s | none available |

---

## The design decisions that matter

### Cimi never verifies what it thinks it heard

Every transcription is shown for correction before anything is searched.

This is not a precaution. It is the response to two errors measured in testing:

| Spoken | Transcribed | Effect |
|---|---|---|
| *ta rufe* — closed | *ta bude* — opened | meaning reversed |
| *dala dari* — 500 CFA | *da lada* — with reward | amount erased |

A fact-checker that mishears does not simply fail. It verifies a claim nobody made, and returns a confident, sourced verdict about it. That is worse than returning nothing.

The same guard catches French: *2025* was transcribed *2005* in testing.

### "Not verifiable" is a correct answer

When the web search returns nothing relevant, Cimi says so and stops. The language model is never called without sources — without them it would fill the gap with what it believes it knows.

### Sources are shown, numbered, and linked

Cimi does not ask to be believed. Every verdict lists the articles it was built from, and the user reads them directly.

### Key terms change everything on low-resource languages

Same audio file, same model. The only difference is a twenty-six term vocabulary list in the prompt:

| Without | With |
|---|---|
| **Cher** gomme na tu na fondé dabo, fondé da **bener** gamara | **Nijer** gomnati na fondé dabo, fondé da **Bénin** gamara |
| 15.0 s | 4.1 s |

Proper nouns go from wrong to right, and processing is three times faster.

Above roughly a hundred terms, the AssemblyAI connection fails silently.

---

## What does not work, and why

**Zarma speech synthesis.** Gemini TTS produces audible Zarma, but a native speaker of Niamey identifies a foreign accent immediately. Zarma is tonal — four tones, and tone carries meaning. No prompt tested so far reproduces that. The app shows Zarma text without offering playback.

**Hausa on AssemblyAI.** Not among its 32 languages. Tested: *sannu* and *yaya* came back as "Some", "Bonsoir", "You are me". The model forces unfamiliar sounds into languages it knows.

**Zarma anywhere else.** It exists in Meta's Omnilingual ASR at seven billion parameters, unusable without a GPU. Hausa has a 244-million-parameter model funded by Nigeria's government. The difference is not linguistic. It is who invested.

---

## Stack

| Role | Service |
|---|---|
| French transcription | AssemblyAI Universal Streaming |
| Hausa and Zarma transcription | Gemini 3.1 Flash Lite |
| Web search | Tavily |
| Reasoning | Gemini 3.1 Flash Lite |
| French voice | Web Speech API |
| Hausa voice | Gemini 3.1 Flash TTS |
| Framework | Next.js 16, App Router |
| Hosting | Vercel |

---

## Running locally

```bash
git clone https://github.com/adamou-zakari/cimi
cd cimi
npm install
```

Create `.env.local`:

```
ASSEMBLYAI_API_KEY=...
TAVILY_API_KEY=...
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
```

```bash
npm run dev
```

The AssemblyAI key never reaches the browser. The server issues a ten-minute temporary token instead, from `/api/token`.

On the model name: the newest Gemini models carry a twenty-request-per-day free quota. The stable Flash Lite allows around fifteen hundred. `GEMINI_MODEL` is configurable so that a change requires no code edit.

---

## Structure

```
app/
  api/token/       temporary AssemblyAI token — the key stays server-side
  api/transcrire/  Hausa and Zarma transcription
  api/verifier/    web search + reasoning, answers in the user's language
  api/voix/        Hausa speech synthesis
components/
  BoutonMicro      the two recording paths and the confirmation step
  CarteVerdict     verdict, sources, playback
  SelecteurLangue  language tabs
lib/
  audio.js         microphone capture, chunked for streaming
  enregistreur.js  full-file recording, Opus compressed
  assemblyai.js    WebSocket, key terms list
  prompts.js       verification instructions, three languages
  voix.js          browser speech synthesis
```

---

## Documentation

`DOCUMENTATION_CIMI.md` covers every measurement behind these decisions — the five transcription paths tested and what each returned, the quota traps, the errors that shaped the product.

---

## License

MIT
