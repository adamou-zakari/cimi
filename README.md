# Cimi

**Voice fact-checking in English, French, Hausa and Zarma.**

Speak a claim you heard. Cimi transcribes it, shows you what it heard, searches the web, and answers with the sources on screen.

Built on AssemblyAI for the Voice Agent Hackathon, September 2026.

**Live: [cimi-psi.vercel.app](https://cimi-psi.vercel.app)**

---

## Why

Most people in the Sahel get their information by voice — radio, WhatsApp voice notes, word of mouth. Fact-checking tools assume you can type, and they assume you speak a language the models were trained on.

Niamey speaks French, Hausa and Zarma. Speech technology serves the three very unequally.

Cimi works in all of them anyway, and shows honestly where the technology stops. English is there so that anyone can try it.

---

## How it works

You press a button and speak. Cimi transcribes, shows you what it heard, and waits for you to confirm. Then it searches the web, reads the sources, and returns a verdict in the language you spoke — with every source listed and clickable.

```text
Speech  →  Transcription  →  You confirm  →  Web search  →  Verdict + sources
```

Two transcription paths. AssemblyAI Universal-3.5 Pro Realtime streams English and French. Hausa and Zarma go through Gemini as recorded files — see *What does not work* for why.

| Language | Transcription | Latency | Voice reply |
| --- | --- | --- | --- |
| English | AssemblyAI real-time streaming | immediate | browser TTS |
| French | AssemblyAI real-time streaming | immediate | browser TTS |
| Hausa | Gemini, file-based | 5–8 s | Gemini TTS, on demand |
| Zarma | Gemini, file-based | 3–4 s | Gemini TTS, on demand |

The interface opens in English, or in French when the browser is set to French.

---

## The design decisions that matter

### Cimi never verifies what it thinks it heard

Every transcription is shown for correction before anything is searched.

This is not a precaution. It is the response to errors measured in testing:

| Spoken | Transcribed | Effect |
| --- | --- | --- |
| *ta rufe* — closed | *ta bude* — opened | meaning reversed |
| *dala dari* — 500 CFA | *da lada* — with reward | amount erased |
| *mouton* — French word inside a Hausa sentence | *mutum* — "person" in Hausa | code-switching broken |
| *2025* | *2005* | date wrong |

A fact-checker that mishears does not simply fail. It verifies a claim nobody made, and returns a confident, sourced verdict about it. That is worse than returning nothing.

### "Not verifiable" is a correct answer

When the web search returns nothing relevant, Cimi says so and stops. The language model is never called without sources — without them it would fill the gap with what it believes it knows.

### Sources are shown, numbered, and linked

Cimi does not ask to be believed. Every verdict lists the articles it was built from, and the user reads them directly.

### Key terms change everything on low-resource languages

Same Zarma audio file, same Gemini model. The only difference is a twenty-six term vocabulary list in the prompt:

| Without key terms | With key terms |
| --- | --- |
| **Cher** gomme na tu na fondé dabo, fondé da **bener** gamara | **Nijer** gomnati na fondé dabo, fondé da **Bénin** gamara |
| 15.0 s | 4.1 s |

Proper nouns go from wrong to right, and processing is three times faster.

The AssemblyAI streaming connection receives key terms too. Above roughly a hundred, the connection fails silently.

### Four prompt rules, all at the top

Each rule fixes an error measured in testing:

1. **Key terms** — proper nouns and local vocabulary, as above.
2. **Language mixing** — people in Niamey drop French words into Hausa and Zarma. The rule existed from the start but sat in the middle of the instructions, and *mouton* still became *mutum*. On a small model, a buried instruction is ignored. Moved to the top with thirty common French words, it holds.
3. **Do not restructure** — the model split continuous speech into lists and added punctuation nobody spoke: two invented *i ma* and three commas in one test.
4. **Vowel alternation** — in Zarma, the final vowel changes with grammar: *gomnati* becomes *gomnato*, *fondo* becomes *fonda*. The model must write the vowel it heard, not the dictionary form.

After each rule was added, the previous ones were tested again.

### Zarma speech that a native speaker accepts

The first Zarma voice was understandable but sounded foreign. Four changes fixed it: telling the model that Zarma is tonal, with four tones; not forbidding nasal sounds, which Zarma has; naming the dialect, Zarma-Tarhay; and using the Charon voice. The result was validated by a native speaker from Niamey — the author.

---

## What does not work, and why

**Hausa on AssemblyAI.** On Universal-3.5 Pro Realtime, the model Cimi uses for English and French, *sannu* and *yaya* came back as "Some", "Bonsoir", "You are me". The model forces unfamiliar sounds into languages it knows.

AssemblyAI does list Hausa for two other models: Universal-2, for recorded files, and Whisper streaming. Cimi does not use them, and they were not tested. The reason is the prompt rules above: the fix for *mouton*, the vowel rule and the structure rule are all written into the Gemini instructions. Moving Hausa to another model would mean rebuilding and re-measuring each of them, for a gain no test could guarantee.

**Zarma on AssemblyAI.** Zarma is not in any AssemblyAI language list.

**Zarma anywhere else.** It exists in Meta's Omnilingual ASR at seven billion parameters, unusable without a GPU. Hausa has a 244-million-parameter model funded by Nigeria's government. The difference is not linguistic. It is who invested.

**Hausa and Zarma voice under load.** Both use a preview Gemini TTS model with a tight and variable quota. It can run out after a couple of calls.

---

## Stack

| Role | Service |
| --- | --- |
| English and French transcription | AssemblyAI Universal-3.5 Pro Realtime |
| Hausa and Zarma transcription | Gemini 3.1 Flash Lite |
| Web search | Tavily |
| Reasoning | Gemini 3.1 Flash Lite |
| English and French voice | Web Speech API |
| Hausa voice | Gemini 3.1 Flash TTS, voice Kore |
| Zarma voice | Gemini 3.1 Flash TTS, voice Charon |
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

```text
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

```text
app/
  api/token/       temporary AssemblyAI token — the key stays server-side
  api/transcrire/  Hausa and Zarma transcription
  api/verifier/    web search + reasoning, answers in the user's language
  api/voix/        Hausa and Zarma speech synthesis
components/
  BoutonMicro      the two recording paths and the confirmation step
  CarteVerdict     verdict, sources, playback
  SelecteurLangue  four language tabs
  Logo             seal and sound wave
lib/
  audio.js         microphone capture, chunked for streaming
  enregistreur.js  full-file recording, Opus compressed
  assemblyai.js    WebSocket, key terms list
  prompts.js       verification instructions, per language
  voix.js          browser speech synthesis
```

Language codes are `en`, `fr`, `ha`, `zr` everywhere — selector, endpoints and prompts.

---

## Documentation

`DOCUMENTATION_CIMI.md` covers every measurement behind these decisions — the transcription paths tested and what each returned, the quota traps, the errors that shaped the product.

---

## License

MIT
