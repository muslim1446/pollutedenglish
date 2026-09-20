# Listening Practice — Acoustic Ear: Degraded-Speech Listening Practice Prototype

**An independent, unaccredited English listening-practice prototype for degraded acoustic conditions: telephone bandpass, train-station PA reverberation, intercom staccato, walkie-talkie overdrive, and weak-cell packet loss — with partially real human audio, IPA-annotated minimal pairs, 3,600-word vocabulary, and 1,020 template-generated practice scenarios.**

> **Honesty notice — read first.** This is a hybrid: the core audio and linguistic foundations reuse real, well-established industry and academic standards, but the actual tuning, corpus tagging, and scenario writing are author-crafted heuristics. Difficulty levels and scenario prompts are **author-designed practice materials, not an officially accredited or certified test suite**. See [§0](#0-honesty-statement--what-is-standard-vs-what-is-author-made) and [§14](#14-limitations-threats-to-validity-and-known-defects--nothing-hidden).

- App display name (`metadata.json`, `index.html`): **Listening Practice**
- Internal engine / pipeline name (code, scripts, User-Agent strings): **Acoustic Ear / AcousticEarTrainer**
- Current shipped corpus (`public/data/vocabulary.json`): **version `2.0.0`, 3,600 words + 1,020 scenarios, 1,330,524 bytes, generated 2026-09-20**
- Audio store (`public/audio/`): **482 × MP3 files at original snapshot 2026-09-20; count grows as ingestion scripts run — recount with `Get-ChildItem public/audio/*.mp3`** (coverage gap disclosed in §6.7 and §14 — not hidden; most items still fall back to synthetic audio)
- Stack: **React 19 + Vite 8 + TypeScript + Tailwind CSS 4 + Web Audio API DSP + Wiktionary/Wikimedia Commons human speech + localStorage analytics**
- Licence status: **code licence not declared in repository; linguistic/audio data carry third-party copyleft and attribution obligations — see §13. You must attribute before any university submission. Not an Oxford University Press product.**

---

## Table of Contents

0. [Honesty Statement — What Is Standard vs What Is Author-Made](#0-honesty-statement--what-is-standard-vs-what-is-author-made)
1. [Abstract](#1-abstract)
2. [Problem Statement — Why This Exists](#2-problem-statement--why-this-exists)
3. [Research Questions, Aims, and Learning Outcomes](#3-research-questions-aims-and-learning-outcomes)
4. [Theoretical Foundations](#4-theoretical-foundations)
5. [What This System Is / Is Not (Scope)](#5-what-this-system-is--is-not-scope)
6. [Corpus Specification — The Oxford-Levelled Listening Corpus](#6-corpus-specification--the-oxford-levelled-listening-corpus)
7. [Acoustic Degradation Engine — Full DSP Disclosure](#7-acoustic-degradation-engine--full-dsp-disclosure)
8. [Training Modes and Pedagogy](#8-training-modes-and-pedagogy)
9. [Application Architecture and Code Map](#9-application-architecture-and-code-map)
10. [Installation, Configuration, and Running](#10-installation-configuration-and-running)
11. [Corpus Build Pipelines — Reproducibility](#11-corpus-build-pipelines--reproducibility)
12. [User Manual](#12-user-manual)
13. [Ethics, Privacy, Accessibility, Licensing, and Attribution](#13-ethics-privacy-accessibility-licensing-and-attribution)
14. [Limitations, Threats to Validity, and Known Defects — Nothing Hidden](#14-limitations-threats-to-validity-and-known-defects--nothing-hidden)
15. [Evaluation Plan and Future Work](#15-evaluation-plan-and-future-work)
16. [References](#16-references)
17. [Appendices](#17-appendices)

---

## 0. Honesty Statement — What Is Standard vs What Is Author-Made

This project is a hybrid. The architecture is pedagogically and acoustically legitimate — not random gibberish — but the implementation is an independent prototype. **View difficulty levels and scenario prompts as author-designed practice materials, not an officially accredited test suite.**

### 0.1 What uses a real, recognised standard

**A. Telecommunications & audio engineering**

- **ITU-T narrowband telephony (PSTN, nominal 300–3,400 Hz):** the `landline` preset's 300 Hz high-pass / 3,400 Hz low-pass uses this international standard band. Only the band edges are standard; all other preset numbers are author-tuned (see §0.2).
- **W3C Web Audio API:** the degradation graph directly implements official `BiquadFilterNode`, `WaveShaperNode`, `ConvolverNode`, and `AnalyserNode` semantics. No custom audio standard is claimed.
- **Paul Kellett pink-noise filter:** pink noise uses the standard 6-pole Kellett IIR approximation for 1/f noise (coefficients reproduced verbatim in `AudioEngine.ts`).
- **Signal-to-Noise Ratio (SNR) decibels:** noise gain uses the standard formula `g = 0.35 × 10^(−SNR/20)`, anchored to an **assumed** digital speech reference (~−12 dBFS class). This is a digital-domain calculation, **not** a sound-pressure-level calibration with measurement equipment.

**B. Linguistics & language learning**

- **CEFR (Council of Europe, Companion Volume 2020):** A1–C1 labels are used only as familiar organisation bins. They are **CEFR-inspired, author-assigned strata — not CEFR-certified, not Rasch-calibrated, not examiner-moderated**.
- **IPA (International Phonetic Alphabet):** phoneme contrasts are documented with standard IPA symbols (e.g. /ɪ/ vs /iː/, /θ/ vs /s/). Only curated/minimal-pair subsets have trustworthy IPA; 3,269 `general_vocab` items carry placeholder `/{word}/` (see §14).
- **Speech-perception research:** exercise design is informed by Flege's Speech Learning Model (SLM), Best's Perceptual Assimilation Model (PAM-L2), and Functional Load Theory (prioritising high-cost confusions such as teen vs ty numbers). These theories motivate the design; they do not validate this app's efficacy.

**C. Accessibility & web standards**

- **WCAG 2.2 AA intent (not certified):** 44–50 px targets, high-contrast focus rings, screen-reader text, keyboard operation, and Calm View aim at WCAG 2.2 AA. No independent accessibility audit has been performed; do not cite this app as WCAG-certified.

### 0.2 What is just the developer's own head (author-crafted heuristics)

1. **CEFR / "Oxford" levels are author-assigned, not certified.** Not an Oxford University Press product, not OOPT-certified. Words were binned to A1–C1 by Google-10K frequency rank plus developer intuition and curation, not standardised testing. C2 was deliberately omitted because there was no objective way to classify it here.
2. **Preset settings were tuned by ear, not calibrated equipment.** While 300–3,400 Hz is standard telephone bandwidth, values such as "28% packet loss", "drive = 45", "reverbWet = 0.38" are arbitrary values chosen because they "sounded like an office intercom / station PA". The packet-loss chopper uses plain `Math.random()`, **not** a standard telecom loss model such as Gilbert-Elliott burst loss, and uses no fixed seed, so repeats are not acoustically identical.
3. **Template-generated scenarios.** The 1,020 scenarios (airport, subway, clinic, etc.) are programmatic "Mad Libs" from author-written templates with `{CITY}`, `{GATE}`, `{TIME}` token substitution in `generate_massive_corpus.js`. They were not vetted by professional language examiners, distractor plausibility was not human-rated, and some option lists were padded with `"None of the above"` / `"Option not specified"`.
4. **Synthetic audio fallback formula.** For the ~3,100 words where real recordings are missing at snapshot time, the fallback tone is a developer-invented equation combining sine waves (140 Hz + 700/1,700/2,800 Hz partials with attack/release envelope) to vaguely mimic vocal-tract formants. It preserves duration/envelope cues but **contains no lexical content and is not a human voice**. The UI does not currently badge synthetic vs human playback.

---

## 1. Abstract

Classroom listening materials are almost always **pristine**: studio-recorded, close-miked, noise-free, full-bandwidth (20 Hz–20 kHz), with careful enunciation. Real-world listening is the opposite: a gate-change announcement band-limited to 300–3,400 Hz through a reverberant PA horn at +5 dB SNR; a room number through a crackling intercom with author-set 28% packet loss; a dosage or platform number through a walkie-talkie in hard clipping at 0 dB SNR; a phone number through a weak cell link with random 30–90 ms dropouts. The numbers after this sentence are the app's author-chosen preset values, not lab-measured channel specifications.

This prototype attempts to narrow that **ecological-validity gap**. It is a client-side web application that:

1. Serves **partially real native-speaker recordings** (Wikimedia Commons / Wiktionary-sourced, MP3-normalised) for single-word stimuli, annotated with **IPA (trustworthy only for curated/minimal-pair subsets; placeholder `/{word}/` elsewhere), part of speech (often placeholder `noun`), author-assigned A1–C1 level (not certified), minimal-pair contrast, and target phoneme**.
2. Passes that audio at playback time through a **fully disclosed, real-time Web Audio DSP graph** that simulates five author-tuned degraded channels (not lab-calibrated, tuned by ear) plus a fully adjustable custom channel.
3. Trains and measures three skills: **(a) minimal-pair phoneme discrimination, (b) dictation under degradation, (c) situated comprehension under stress** (multiple-choice over template-generated transit, campus, workplace, and emergency scenarios — programmatic Mad Libs, not examiner-vetted).
4. Tracks **per-phoneme, per-mode, and per-author-assigned-level accuracy, streaks, and item history entirely on-device**, with an instant **Clean Audio A/B bypass** for perceptual realignment and a low-distraction **Calm View** plus **Read Aloud** for accessibility.

The shipped corpus contains **3,600 vocabulary entries** (author-binned A1: 700, A2: 750, B1: 800, B2: 700, C1: 650; of which 331 are minimal-pair entries and 3,269 are general-vocabulary entries) and **1,020 template-generated practice scenarios** (A1: 136, A2: 136, B1: 221, B2: 306, C1: 221). Audio coverage at original snapshot 2026-09-20 was **482 MP3s**; every missing file falls back at runtime to a disclosed developer-invented synthetic buffer (harmonic sine stack, no lexical content — see §6.7, §7.3 and §14). Nothing about this asymmetry is concealed: the counts, the fallback synthesis equation, and the template-generation method are all documented below so that an independent reviewer can reproduce and critique them.

---

## 2. Problem Statement — Why This Exists

### 2.1 The WHAT

A React + Web Audio application that makes clean study audio **deliberately hard in controlled, measurable ways**, then teaches the learner to recover meaning — exactly as they must at an airport, station, dormitory intercom, clinic, or on a phone call.

### 2.2 The HOW (one paragraph)

The browser fetches `/data/vocabulary.json` and `/audio/{word}.mp3`, decodes to an `AudioBuffer`, and routes it through `AudioEngine.play(url, config)`: an optional packet-loss chopper (`Math.random()`, unseeded — not Gilbert-Elliott) → high-pass biquad → low-pass biquad → WaveShaper saturation → dry/wet convolver reverb → master gain + `AnalyserNode`, with a parallel band-limited noise loop mixed at an author-scaled digital-domain SNR (formula-standard, SPL-uncalibrated). A `clean: true` flag bypasses the entire chain for A/B comparison. Answers are scored client-side (exact match plus a disclosed number-word synonym table), and all analytics persist in `localStorage`.

### 2.3 The WHY

1. **Transfer failure.** Learners who score 95% on clean audio routinely fail on the same words at 0–5 dB SNR or under 300–3,400 Hz band-limiting, because high-frequency cues for `/s/–/θ/`, `/f/–/θ/`, `/s/–/z/` and stress cues for `thirteen` vs `thirty` are removed. Standard courseware never trains this.
2. **Safety and mobility.** Mishearing `fifteen/fifty`, `platform 14/40`, `exit/emergency`, `heart/hard`, or `gate/date` has material consequences. The corpus therefore over-samples numbers, transit, and emergency vocabulary by design.
3. **Phonological theory.** Minimal-pair discrimination is the classic probe of phoneme-category formation in L2 acquisition. This system operationalises it at scale with per-phoneme learning curves.
4. **Equity and access.** Degraded-channel competence is disproportionately needed by international students, migrants, and hard-of-hearing users navigating PA and phone systems. Calm View, large touch targets, keyboard operation, and Read Aloud are therefore core, not add-ons.

---

## 3. Research Questions, Aims, and Learning Outcomes

### 3.1 Research questions

- **RQ1 (discrimination):** Does repeated degraded-channel minimal-pair practice improve discrimination of targeted contrasts (e.g. `/ɪ/–/iː/`, `/θ/–/s/`, `/tiːn/–/ti/`) as measured by per-phoneme accuracy at fixed digital-domain SNR? (Untested — no efficacy trial has been run.)
- **RQ2 (robustness):** Does dictation accuracy degrade monotonically with decreasing SNR / narrowing bandwidth / increasing packet loss, and does the slope flatten with practice?
- **RQ3 (transfer):** Does single-word training transfer to keyword-in-context scenario comprehension (scenario text + single-word/fallback audio, multiple choice) at the same author-assigned level? Note: scenarios are not whole-announcement connected speech — see §6.6.
- **RQ4 (perceptual recalibration, not equipment calibration):** Can the Clean Audio A/B bypass accelerate perceptual recalibration versus degraded-only repetition?
- **RQ5 (level ordering — author bins only):** Do A1→C1 accuracy gradients follow the app's author-assigned difficulty ordering under identical acoustic conditions? This would test internal consistency of author bins, not CEFR validity.

The app does not itself run the RCT — it **instruments** the data (per-phoneme, per-level, per-preset history) that would answer these questions. See §15 for the proposed design.

### 3.2 Aims

- Provide ≥3,000 author-stratified word stimuli with IPA (curated subsets only) and partial human audio provenance (remainder synthetic fallback).
- Provide ≥1,000 template-generated practice scenarios across six real-world domains (airport, rail/subway, café/retail, campus, workplace, emergency/utilities) — unvetted Mad Libs for practice, not validated test items.
- Simulate five author-tuned degraded channels that roughly evoke real channels, with physically interpretable but uncalibrated parameters.
- Measure learning without a server (privacy-preserving, offline-capable after first load).

### 3.3 Author-assigned level descriptors (not CEFR-certified)

| Level | Label (this app) | Learner will be able to … under degradation |
|---|---|---|
| A1 | Beginner | Distinguish numbers, teen vs ty (`thirteen/thirty`), basic vowels (`pen/pin`, `ship/sheep`), and follow room/time instructions. |
| A2 | Elementary | Follow shuttle, library, clinic, and dormitory announcements; distinguish `/ʊ/–/uː/`, `/s/–/z/`, `/e/–/eɪ/`. |
| B1 | Intermediate | Follow exam, lab-safety, and advising messages; distinguish `/l/–/r/`, `/v/–/w/`, `/s/–/θ/`. |
| B2 | Upper Intermediate | Follow seminar, admissions, and policy discourse; handle ordinals (`ten/tenth`) and faster speech. |
| C1 | Advanced | Resolve low-functional-load contrasts (`loose/lose`, `advice/advise`, `affect/effect`) and formal governance discourse. |

C2 is **deliberately excluded**: the source wordlists (Google 10K + curated academic lists) and the OOPT mapping used here do not support reliable C2 stratification. Claiming C2 would be dishonest; see §14.

---

## 4. Theoretical Foundations (standards that inform us vs claims we do not make)

Real standards reused here: CEFR 2020 bins (organisation only), IPA symbols, ITU-T 300–3,400 Hz band edges, W3C Web Audio nodes, Kellett pink-noise filter, standard SNR decibel math, and WCAG 2.2 AA intent. None of these certifies this app. Preset values, level assignments, scenarios, and synthetic audio below are author heuristics (see §0.2 and §14).

1. **L2 speech perception (Flege SLM; Best PAM-L2).** Non-native listeners assimilate L2 contrasts to L1 categories. Minimal-pair training with immediate feedback and clean-bypass realignment directly targets category boundary formation.
2. **Functional load.** Contrasts are prioritised by communicative cost: teen/ty stress, `/θ/–/s/–/f/`, `/s/–/z/` voicing, `/l/–/r/`, `/v/–/w/` — all heavily represented because confusing them breaks numbers, transit, and safety messages.
3. **CEFR (Council of Europe, Companion Volume 2020) + Oxford-style banding (naming only).** Levels A1–C1 in `src/data/oxfordLevels.ts` are author-assigned by Google-10K frequency rank + developer intuition/curation, not Rasch-calibrated, not examiner-moderated, not Oxford University Press-certified, not OOPT-certified. The mapping is: A1 everyday objects/numbers; A2 schedules/travel/time; B1 school/travel announcements; B2 fast/noisy announcements; C1 subtle distinctions and rapid natural speech. Reviewers must treat these as author-assigned strata (documented per item in `level` fields), not externally validated judgements. C2 omitted deliberately — no objective basis to classify it here.
4. **Ecological-validity aim (Bronfenbrenner; Lincoln & Guba).** Practice stimuli attempt to evoke the noise, reverberation, and dropouts of the target domain rather than idealising them away — but preset values were tuned by ear, not measured in the field.
5. **Cognitive load + Universal Design for Learning (aim, not certification).** Calm Mode (hides the animated waveform), Read Aloud (SpeechSynthesis), 44–50 px targets, focus rings, and keyboard shortcuts aim at multiple means of representation and action and at WCAG 2.2 AA intent. No accessibility audit has been performed.
6. **Desirable difficulties (Bjork).** Controlled degradation + spaced shuffling + immediate clean-bypass feedback is intended to make retrieval effortful but recoverable.

---

## 5. What This System Is / Is Not (Scope)

**It is:**

- An independent degraded-listening practice prototype + author-built corpus + disclosed DSP + build pipelines.
- Fully client-side after asset load; no account, no server-side grading, no network telemetry.

**It is not:**

- Not an Oxford University Press product and not OOPT-certified, not CEFR-certified, not university-accredited. “Oxford Levels” here means author-assigned Oxford-style A1–C1 bins labelled for study organisation only, with per-level counts disclosed. Do not cite as certified proficiency levels.
- Not a speech recogniser or pronunciation grader; it scores typed/selected answers, not learner speech.
- Not a clinical audiology device; no hearing diagnosis is performed or implied.
- Not a Gemini AI application at present despite `metadata.json` declaring `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` and `.env.example` defining `GEMINI_API_KEY`/`APP_URL`. **No code path in `src/` calls Gemini at time of writing.** That capability flag is scaffold boilerplate and must not be cited as an AI feature. This is disclosed here precisely so examiners are not misled.

---

## 6. Corpus Specification — The Author-Stratified Practice Corpus (Oxford-Style Labels Only)

### 6.1 Snapshot (measured 2026-09-20, not estimated — audio count is stale, recount now)

Measured with `python -c "import json…" public/data/vocabulary.json` and `Get-ChildItem public/audio` on 2026-09-20:

- `version`: `"2.0.0"`, `generatedAt`: ISO timestamp at generation time.
- **Words: 3,600. Scenarios: 1,020. File size: 1,330,524 bytes.**
- Word levels (author-assigned, not certified): **A1 700, A2 750, B1 800, B2 700, C1 650.**
- Scenario levels (author-assigned, not certified): **A1 136, A2 136, B1 221, B2 306, C1 221.**
- Word categories (shipped generator vocabulary): **`minimal_pair` 331, `general_vocab` 3,269.** Earlier pipelines used finer categories (`number`, `date_time`, `travel_transit`, `emergency`, `nouns`, `daily_verbs`); the shipped massive corpus collapses non-pairs to `general_vocab`. The TypeScript type still lists the older union — a known schema drift documented in §14.
- Audio files present at snapshot: **482 MP3s** in `public/audio/` (128 kbps, 44.1 kHz, normalised via ffmpeg where ingested through `ingest_audio.js` / `download_missing_audio.js`). Recount now — the directory has grown since the snapshot.

### 6.2 Provenance — where every byte came from and under what licence

| Source | What was taken | How | Licence / obligation |
|---|---|---|---|
| English Wiktionary API (`en.wiktionary.org/w/api.php?action=parse…prop=wikitext`) | `{{audio\|en\|…}}` filename, `{{IPA\|en\|…}}` string, part-of-speech section headers | `scrapeWiktionary()` in `scripts/ingest_audio.js`; US pronunciation preferred, else first match | **CC BY-SA 4.0.** You must credit Wiktionary contributors and share adaptations alike. IPA strings are reproduced verbatim where available. |
| Wikimedia Commons API (`commons.wikimedia.org/w/api.php…prop=imageinfo`) | Direct OGG/WAV URLs for `en-us-{word}.ogg`, `En-us-{word}.ogg`, Lingua Libre `LL-Q1860…` variants | `resolveCommonsUrl()` + `download_missing_audio.js` variation list | Per-file licences (mostly **CC BY-SA / CC0 / GFDL** depending on speaker upload). You must retain per-file attribution for redistribution; the pipeline does not currently write a per-file credit roll — see §14 as a submission risk. |
| Google 10,000 English wordlist (`first20hours/google-10000-english-usa.txt`) | Frequency-ranked surface forms filtered to `^[a-z]{3,}$` | Fetched live by `scripts/generate_massive_corpus.js`, stratified by rank into A1→C1 quotas | Public GitHub corpus of Google data; treat as research-use, verify institutional policy before commercial redistribution. |
| Curated academic lists (author-written in `build_educational_corpus.js`) | ~250 hand-written entries + 30 hand-written scenarios with transcripts, questions, distractors | Checked into `scripts/` | Original to this project; no third-party restriction. |
| Template-generated scenarios (author-written templates in `generate_massive_corpus.js`) | 1,020 scenarios from 6 domain groups × item templates × deterministic token substitution | `DOMAIN_TEMPLATES` + `replaceTokens()` (cities, flights, times, gates, etc.) | Original to this project but **synthetic and unmoderated** — see §6.6 and §14. |
| Plus Jakarta Sans (Google Fonts link in `index.html`) | UI typeface | `<link href="https://fonts.googleapis.com/css2…Plus+Jakarta+Sans…">` | **SIL Open Font License 1.1.** |
| Preconnect fonts, React, Vite, Tailwind, Lucide, Motion, canvas-confetti | Runtime dependencies (`package.json`) | npm/bun install | Respective MIT/ISC/Apache licences; verify in `bun.lock`. |

No speaker was recorded for this project. All “real human audio” means **pre-existing volunteer recordings re-hosted via Commons**, normalised to MP3. No consent beyond the uploaders’ Commons licences is claimed.

### 6.3 Data model (exact TypeScript contracts in `src/types/index.ts`)

```ts
VocabEntry { id, word, ipa, partOfSpeech, category, pairWord?, targetPhoneme?, audioUrl, distractors?, level? }
StressScenario { id, scenario, transcript, targetWord, question, options[4], correctOption, audioUrl, audioFallbackWord?, contextDescription, level? }
VocabDataset { version, generatedAt, totalWords, words[], scenarios[] }
AcousticConfig { presetId, name, description, highPassHz, lowPassHz, distortionDrive 0–100, snrDb, noiseType 'pink'|'white'|'radio_hum'|'subway_rumble'|'off', packetLossRate 0–80, reverbWet 0–1 }
UserStats { totalAttempted, totalCorrect, streak, bestStreak, modeStats{…}, phonemeAccuracy{phoneme:{correct,total}}, levelAccuracy?, recentHistory[≤50] }
```

Example word entry (minimal pair):

```json
{ "id": "mp-ship-sheep", "word": "ship", "level": "A1", "ipa": "/ʃɪp/",
  "partOfSpeech": "noun", "category": "minimal_pair",
  "pairWord": "sheep", "targetPhoneme": "/ɪ/ vs /iː/",
  "audioUrl": "/audio/ship.mp3", "audioFallbackWord": "ship" }
```

Example scenario entry:

```json
{ "id": "sc-a1-1", "level": "A1", "scenario": "Classroom Room Number Announcement",
  "transcript": "Attention students: English beginner class is in room fifteen, not room fifty.",
  "targetWord": "fifteen", "question": "Which classroom number was announced?",
  "options": ["Room 50","Room 15","Room 5","Room 55"], "correctOption": "Room 15",
  "audioUrl": "/audio/fifteen.mp3", "audioFallbackWord": "fifteen",
  "contextDescription": "School hallway intercom with echo and distant chatter" }
```

### 6.4 Minimal-pair phoneme inventory (what contrasts are actually trained)

The shipped 331 pair entries derive from `MINIMAL_PAIR_SPECS` in `generate_massive_corpus.js` (vowels, voicing, place/manner, clusters, teen/ty stress). The full contrast list, with example pairs, is tabulated in **Appendix A**. In brief: `/ɪ/–/iː/`, `/e/–/æ/`, `/ʌ/–/æ/`, `/ʊ/–/uː/`, `/ɔː/–/oʊ/`, `/b/–/v/`, `/p/–/b/`, `/t/–/d/`, `/k/–/ɡ/`, `/θ/–/s/`, `/θ/–/f/`, `/ð/–/d/`, `/s/–/z/`, `/ʃ/–/tʃ/`, `/l/–/r/`, `/w/–/v/`, `/dʒ/–/tʃ/`, `/dʒ/–/j/`, nasals `/m/–/n/–/ŋ/`, onset clusters `/p/–/sp/`, `/t/–/st/`, `/k/–/sk/` etc., plus the seven teen/ty stress pairs (`thirteen/thirty` … `nineteen/ninety`) and C1 morphophonemic pairs (`loose/lose`, `advice/advise`, `device/devise`, `affect/effect`).

Each pair entry stores `targetPhoneme` as a human string (e.g. `"/tiːn/ vs /ti/"`) and is aggregated in `stats.phonemeAccuracy[phoneme]` on every attempt — the raw material for RQ1.

### 6.5 Scenario domains (1,020)

Six template groups in `generate_massive_corpus.js`: **Airport Terminal & Flights; Train & Subway Stations; Café & Restaurant Dining; University & School Campus; Workplace & Professional Calls; Public Services & Emergencies** — each with 3–5 `contextDescription` acoustic scenes and 3–5 item templates. Token slots (`{CITY}`, `{FLIGHT}`, `{NUM1…4}`, `{TIME}`, `{GATE}`, `{MILK}`, `{DISH}`, `{PIN}`, …) are filled deterministically from fixed arrays (`CITIES`, `NAMES`, `TIMES`, `FLIGHTS`, `STATIONS`, …) indexed by scenario counter so regeneration is reproducible. Options are the template’s four distractors with token substitution; if the computed `targetWord` is missing from the list it replaces slot 0, and short lists are padded with `"None of the above"` / `"Option not specified"` — disclosed here because it affects distractor quality (see §14).

The earlier `build_educational_corpus.js` contributes the **30 hand-written educational scenarios** (6 per level, lectures/exams/clinics/evacuations) that remain the highest-quality subset and should be cited as such in any university submission (still author-written, not externally moderated).

### 6.6 How transcripts relate to audio — critical disclosure

Scenario objects carry a full-sentence `transcript` **but their `audioUrl` points to a single-word MP3** (`/audio/{targetWord}.mp3`, or `/audio/scenario_{idx}.mp3` which does not exist on disk for generated scenarios and therefore triggers the synthetic fallback). The app **does not synthesise full-sentence speech**; it plays the target word (or fallback tone-stack, see §6.7) through the degraded chain while displaying the scenario text and question. Any submission must describe this honestly as **keyword-in-context comprehension**, not connected-speech comprehension. Full TTS or recorded sentence audio is listed as future work (§15).

### 6.7 Audio coverage and normalisation

- Ingested audio is converted with `ffmpeg -y -v quiet -i "{temp}" -c:a libmp3lame -b:a 128k -ar 44100 "{target}.mp3"` and accepted only if the output exceeds 1,000 bytes.
- `GET public/audio/*.mp3 = 482 files` at original snapshot 2026-09-20 (recount now — ingestion scripts keep adding files). The remaining ~3,100 vocabulary items and ~1,020 `scenario_{idx}.mp3` URLs **miss at fetch time** and are served via `AudioEngine.generateSyntheticSpeechBuffer()` — a disclosed developer-invented harmonic-stack placeholder (140 Hz + 700/1,700/2,800 Hz sine partials vaguely mimicking formants, 50 ms attack / 80 ms release envelope, duration `clamp(0.7–2.0 s, len×0.1+0.4)`), not a human voice and containing no lexical content. The UI does not badge synthetic vs human playback — a known defect (§14).
- Preloading (`audioEngine.preload([current, next])`) warms the current and next item to mask fetch latency.

---

## 7. Acoustic Degradation Engine — Full DSP Disclosure

File: `src/audio/AudioEngine.ts` (433 lines). No hidden processing: every node, coefficient, and formula is listed here.

### 7.1 Graph topology

**Degraded path:** `BufferSource → ChopperGain (packet loss) → HighPass biquad → LowPass biquad → WaveShaper → [DryGain → Master | Convolver → WetGain → Master] + (Looping NoiseSource → BandPass → NoiseGain → Master) → MasterGain → AnalyserNode → destination.`

**Clean bypass (`clean: true`):** `BufferSource → MasterGain → AnalyserNode → destination.` No filtering, no noise, no reverb, no distortion. Playback-rate is still honoured.

`AnalyserNode`: `fftSize = 512`, `smoothingTimeConstant = 0.8`, `frequencyBinCount = 256`. Visualiser reads time-domain bytes each animation frame; when idle it draws a flat baseline.

### 7.2 Preset parameter matrix (exact author-tuned values from `src/audio/presets.ts` — tuned by ear, not lab-calibrated)

> Only the `landline` 300–3,400 Hz band edges reuse a real standard (ITU-T narrowband telephony). Every other number below — drive, SNR, loss %, reverb wet — is an author-chosen heuristic that "sounded right" (e.g. drive 45, 28% loss for intercom). Do not cite these as measured channel specifications.

| Preset (`presetId`) | Display name | HP (Hz) | LP (Hz) | Drive 0–100 | SNR (dB) | Noise | Loss % | Reverb wet |
|---|---|---|---|---|---|---|---|---|
| `cellphone` | Weak Cell Signal | 200 | 7,000 | 8 | 18 | pink | 4 | 0.02 |
| `landline` (default) | Phone Call | 300 | 3,400 | 22 | 12 | radio_hum | 0 | 0.05 |
| `train_pa` | Train Station | 350 | 4,200 | 35 | 5 | subway_rumble | 0 | 0.38 |
| `intercom_staccato` | Office Intercom | 450 | 3,000 | 45 | 2 | white | 28 | 0.08 |
| `walkie_talkie` | Walkie-Talkie | 500 | 2,500 | 60 | 0 | radio_hum | 12 | 0.04 |
| `custom` | Custom Settings | 300 | 3,400 | 20 | 10 | pink | 10 | 0.10 |

Pedagogical reading (author intent, not measurement): `landline` = standard 300–3,400 Hz telephone band + faint hum; `walkie_talkie` = narrowest band + hardest clipping + 0 dB SNR; `train_pa` = widest reverb (0.38) + low rumble; `intercom_staccato` = heaviest packet loss (28%); `cellphone` = gentlest (18 dB SNR, 4% loss). Custom sliders expose HP 50–800 Hz, LP 1,500–8,000 Hz, SNR 0–30 dB (UI displays `Level {30 − snrDb}`), drive 0–100, and five noise-type buttons (None/Cafe Chatter/Soft Hiss/Quiet Hum/Low Rumble). Any slider edit retags the config to `presetId: 'custom'`, `name: 'Custom'`.

### 7.3 Node-by-node mathematics

1. **Packet-loss chopper (author heuristic, not a telecom model).** Interprets `packetLossRate` clamped to 0–80%. Skips the first 80 ms (attack preservation), then walks a cursor: at each step draws `rand×100 < rate×1.5`; on a hit schedules a 30–90 ms dropout (`0.03 + rand×0.06`) with **2 ms linear micro-fades** (`1.0 → 0.001 → hold → 1.0`) to avoid clicks, then advances `drop + 0.08 + rand×0.12`; otherwise advances `0.06 + rand×0.08`. Uses plain `Math.random()` with no seed — **not** Gilbert-Elliott burst loss or any calibrated loss model. Deterministic seed is **not** used — each playback differs, disclosed as a repeatability limit.
2. **Biquad band-limiting.** `highpass.frequency = highPassHz, Q = 1.0`; `lowpass.frequency = lowPassHz, Q = 1.0`. This is what removes `/s/` sibilance energy (4–8 kHz) under `landline`/`walkie_talkie` settings.
3. **WaveShaper saturation.** 44,100-sample sigmoid curve; `k = max(0, drive)`; identity pass-through when `k ≤ 0`; otherwise `curve[i] = ((3+k)·x·20·(π/180)) / (π + k·|x|)`, `oversample = '4x'`. Higher drive = harder mic-diaphragm clipping.
4. **Reverberation.** Synthetic stereo impulse `generateImpulseResponse(ctx, 1.6 s, decay 2.0)`: `length = rate×1.6`, each channel `noise×(1−t)^2`. Applied only when `reverbWet > 0.02`: `dry = max(0.2, 1−wet×0.6)`, `wet = min(1.2, wet×1.5)` through a `ConvolverNode`.
5. **SNR noise mixer (standard formula, assumed reference, SPL-uncalibrated).** Skipped when `noiseType === 'off'` or `snrDb ≥ 30`. Noise loop (5 s seamless buffer) → `bandpass.frequency = (HP+LP)/2, Q = 0.5` → gain `g = max(0.005, 0.35 × 10^(−snr/20))` where **0.35 is the assumed speech reference RMS (−12 dBFS class, not a measured SPL)**. Worked example: at 0 dB SNR, `g = 0.35`; at 12 dB, `g ≈ 0.088`; at 18 dB, `g ≈ 0.044`. Reported SNRs are digital-domain calculations, not sound-pressure-level measurements.
6. **Noise synthesis algorithms.** White: uniform `±0.5`. Pink: Paul Kellett 6-pole filter bank (`b0…b6` coefficients as coded, `×0.06` scale). Radio hum: 60 Hz×0.4 + 120 Hz×0.2 + hiss×0.3, all `×0.35`. Subway rumble: leaky integrator `y += 0.04·(white−y)`-style accumulator (`lastVal×0.96 + white×0.04`, `×2.5`). Buffers cached in `noiseBuffers`.
7. **Playback rate.** `source.playbackRate.value = 1.0 | 0.8` (Normal/Slow toggle). Note: rate change without pitch correction lowers formants — disclosed as a scaffold, not a time-stretch algorithm.
8. **Lifecycle.** `play()` calls `stop()` first (kills prior source + noise), lazily creates/resumes `AudioContext` (autoplay-policy compliant), `fetch → decodeAudioData` with cache in `bufferCache`, `source.onended` stops noise and fires the UI callback. `stop()` is exception-safe against double-stop.

### 7.4 Clean A/B bypass — why it matters

After an error the learner can replay the identical stimulus **without degradation** (`Clear Audio [C]`). Theoretically this provides the auditory-system “template” for top-down repair; practically every feedback panel exposes both `Listen Again [Space]` (degraded) and `Clear Audio [C]` (clean) so the contrast is one keypress apart.

### 7.5 Waveform visualiser (`WaveformVisualizer.tsx`)

Canvas 2-D oscilloscope: blue `#007aff` stroke for degraded, green `#34c759` for clean, `#e5e5ea` flat baseline when idle; `h×0.42` vertical scale; DPR-aware sizing; `requestAnimationFrame` loop cancelled on unmount. Hidden entirely in Calm Mode to reduce visual load.

---

## 8. Training Modes and Pedagogy

All three modes share the item pipeline in `src/App.tsx`: **filter by `selectedLevel` → `activeItem = list[currentIndex % len]` → preload current+next → `playDegraded`/`playClean` → `handleSubmitAnswer` → stats update → feedback panel → Next/Shuffle.**

| Mode (UI label) | Key | Prompt | Response | Scoring |
|---|---|---|---|---|
| Similar Words | `minimal_pair` | “Which word did you hear?” + 2 large buttons; order alternates by `currentIndex % 2` | Click / `1`–`2` | Case-insensitive exact match to `vocab.word`. |
| Type Words | `dictation` | “Type what you heard:” + autofocused input + optional IPA hint | Type + `Enter`/Submit | Exact match **or** number-synonym pass via `NUMBER_SYNONYMS` both directions (`"4"↔"four"` … `"1000"↔"thousand"`, full 0–20/30–90×10/100/1000 table in `App.tsx`). |
| Situations | `comprehension_stress` | Scenario title + question + 4 options | Click / `1`–`4` | Exact match to `scenario.correctOption`. |

Feedback panel states the correct answer verbatim, echoes the learner’s wrong choice parenthetically (“you chose: …”), and offers degraded + clean replay before `Next Question [Enter]`. Tone is deliberately non-punitive (“Great job!” / “Good try!”).

**Stats recorded per attempt** (`handleSubmitAnswer`): `totalAttempted/Correct`, `streak/bestStreak`, per-mode `attempted/correct`, `phonemeAccuracy[phoneme]`, `levelAccuracy[level]`, and a `recentHistory` entry `{word, userAnswer, correctAnswer, correct, mode, preset name, timestamp, phoneme?, level?}` capped at 50 (drawer renders the latest 15). Overall/mode/level accuracy are all `round(100×correct/attempted)`.

**Navigation:** `Next` = `index+1`; `Shuffle` = `index + 1…7` random jump; mode or level switch resets `index` to 0 and stops audio. Question counter shows `(index % total)+1 of total` plus a Level chip when filtered.

---

## 9. Application Architecture and Code Map

### 9.1 Stack (exact `package.json`)

Runtime: `react 19`, `react-dom 19`, `@vitejs/plugin-react 6`, `vite 8`, `@tailwindcss/vite 4` + `tailwindcss 4`, `lucide-react 0.546` (icons), `motion 12` + `canvas-confetti 1.9` (installed; confetti/atom not wired into the current practice loop — disclosed), `express 4` + `@types/express` (installed; no server file ships — scaffold residue), `@google/genai 2.4` (installed; uncalled — see §5), `dotenv 17`, `clsx 2`. Dev: `typescript 7`, `tsx 4`, `esbuild 0.25`, `@types/*`, `autoprefixer 10`. Scripts: `dev` (Vite on `0.0.0.0:3000`), `build` (`vite build`), `preview`, `clean` (`rm -rf dist server.js`), `lint` (`tsc --noEmit`), `ingest` (`node scripts/ingest_audio.js`). Package manager artefacts: `bun.lock` ships, so Bun is supported.

### 9.2 File map

```
index.html                  title/meta/OG tags, Plus Jakarta Sans, #root, /src/main.tsx
vite.config.ts              react()+tailwindcss(), @→repo-root alias, HMR/watch DISABLE_HMR guard
src/main.tsx                StrictMode createRoot render
src/App.tsx                 all state, filtering, playback callbacks, scoring, stats, layout (636 lines)
src/types/index.ts          AcousticPresetId/NoiseType/AcousticConfig/TrainingMode/OxfordLevel/*Entry/Scenario/Dataset/Stats
src/audio/presets.ts        6 configs with exact DSP numbers (§7.2)
src/audio/AudioEngine.ts    DSP graph, noise synthesis, IR, distortion curve, cache, analyser
src/data/oxfordLevels.ts    All/A1–C1 metadata (code/name/CEFR/description)
src/components/Header.tsx         mode segmented control, streak/accuracy chips, Calm toggle, Score button
src/components/LevelSelector.tsx  6-button grid with per-level live counts
src/components/PresetSelector.tsx 6 preset cards + custom sliders + noise-type buttons
src/components/WaveformVisualizer.tsx canvas oscilloscope
src/components/TrainingCard.tsx   play/clean/read-aloud/speed/prompt/inputs/feedback/keyboard (459 lines)
src/components/StatsDrawer.tsx    accuracy/streak/completed, per-mode + per-level bars, 15-item history, reset
src/index.css               Tailwind import, Apple HIG palette, focus rings, .apple-pressable
public/data/vocabulary.json shipped corpus (1.33 MB)
public/audio/*.mp3          482 decoded speech files
scripts/ingest_audio.js     Wiktionary+Commons+ffmpeg pipeline (v1 dataset + 8 scenarios)
scripts/build_educational_corpus.js curated A1–C1 corpus (≈250 words + 30 scenarios, v2.0.0 writer)
scripts/generate_massive_corpus.js  shipped 3,600+1,020 generator (MINIMAL_PAIR_SPECS+Google10K+templates)
scripts/download_missing_audio.js 43-word Commons top-up downloader
scripts/sync_vocab.cjs      audio-gated vocab.json rewriter (keeps only words with MP3s)
```

### 9.3 Data flow

```
vocabulary.json --fetch--> App.dataset --filter(level,mode)--> activeItem
activeItem.audioUrl --preload/loadAudio--> AudioBuffer --play(config)--> speakers + analyser--> canvas
learner answer --handleSubmitAnswer--> UserStats --localStorage--> StatsDrawer
```

Storage keys (all `localStorage`, no cookies, no server): `acoustic_ear_user_stats_v5`, `acoustic_ear_oxford_level_v1`, `acoustic_ear_calm_mode` (`"true"` string check).

---

## 10. Installation, Configuration, and Running

### 10.1 Prerequisites

- Node 20+ (or Bun 1+; `bun.lock` present) and `ffmpeg` on `PATH` **only if** running audio-ingestion scripts (`ffmpeg -version` must succeed for MP3 normalisation).
- Modern Chromium/Chrome recommended (Web Audio `ConvolverNode`, `WaveShaper oversample '4x'`, `decodeAudioData` behaviour verified there; Safari/Firefox largely work but IR/convolver gain staging was tuned in Chrome).

### 10.2 Install and run (Windows PowerShell shown; macOS/Linux equivalent)

```powershell
# 1. Enter the project
Set-Location -LiteralPath "C:\Users\SCSM11\Downloads\pollutedenglish"

# 2. Install (npm or bun)
npm install
# or: bun install

# 3. Develop (HMR at http://localhost:3000)
npm run dev

# 4. Typecheck (this repo's "lint")
npm run lint

# 5. Build + preview production bundle
npm run build
npm run preview
```

No build-time secrets are required. Copy `.env.example` to `.env` only if you intend to wire Gemini/APP_URL features in future work; **the current app runs without any env vars**.

### 10.3 NPM script reference

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` | Local dev server, HMR unless `DISABLE_HMR=true`. |
| `build` | `vite build` | Production bundle to `dist/`. |
| `preview` | `vite preview` | Serve `dist/` locally. |
| `lint` | `tsc --noEmit` | Typecheck only (no ESLint config ships). |
| `clean` | `rm -rf dist server.js` | Remove build artefacts (POSIX syntax; on stock Windows PowerShell use `Remove-Item -Recurse -Force dist, server.js`). |
| `ingest` | `node scripts/ingest_audio.js` | Run the v1 human-audio ingestion pipeline (network + ffmpeg). |

Corpus writers are invoked directly: `node scripts/build_educational_corpus.js`, `node scripts/generate_massive_corpus.js`, `node scripts/download_missing_audio.js`, `node scripts/sync_vocab.cjs`. **Warning:** each writer overwrites `public/data/vocabulary.json`. Back it up first; the shipped file is the output of `generate_massive_corpus.js`.

---

## 11. Corpus Build Pipelines — Reproducibility

1. **`scripts/ingest_audio.js` (v1, human-audio grounded).** `WORD_DEFINITIONS` (~250 entries: teen/ty + consonant/vowel pairs + numbers/dates/transit/emergency/daily verbs) × `scrapeWiktionary → resolveCommonsUrl → downloadAndConvert(ffmpeg)` under a `pMap(concurrency=2)` pool with `fetchWithRetry(retries=4, backoff 1s, 10 s timeout, 429 exponential backoff)` and `sleep(250 ms)` between successes. Emits `vocabulary.json v1.0.0` + 8 hand-written `STRESS_SCENARIOS`. Skip-download logic reuses MP3s >1,000 bytes and existing IPA.
2. **`scripts/build_educational_corpus.js` (v2 curated).** `COMPREHENSIVE_WORDS` (A1 numbers/pairs/classroom, A2 transit/safety, B1 academic/travel, B2 research, C1 formal discourse) + `EDUCATIONAL_SCENARIOS` (30 hand-written A1–C1 situations with full transcripts/questions/distractors). Writes `vocabulary.json v2.0.0` (pretty-printed), prints per-level distributions, then attempts `ensureAllAudio()` top-up downloads.
3. **`scripts/generate_massive_corpus.js` (shipped output).** `MINIMAL_PAIR_SPECS` (~200 contrast specs → 331 deduplicated pair entries) + live Google-10K fetch stratified to quotas (A1 700 / A2 750 / B1 800 / B2 700 / C1 remainder, total cap 3,600; general items get placeholder `ipa: "/{word}/"`, `partOfSpeech: "noun"`, `category: "general_vocab"`) + deterministic 1,020-scenario template expansion. Writes **minified** `vocabulary.json v2.0.0` with `totalWords` + `totalScenarios`. This is the file in `public/data/`.
4. **`scripts/download_missing_audio.js`.** 43-word Commons top-up (`book`, `exam`, … `valid`) trying `en-us-`, `En-us-`, `en-uk-`, `En-uk-`, and four Lingua Libre uploader patterns before falling back to Wiktionary-parse. 200 ms pacing, ffmpeg normalisation, per-word success logging.
5. **`scripts/sync_vocab.cjs`.** Safety rewriter: parses `ingest_audio.js` source for `WORD_DEFINITIONS`/`STRESS_SCENARIOS` via regex+`eval`, keeps only entries whose MP3 exists, reuses prior IPA, writes `v1.0.0`. Useful before offline demos; **do not run casually** — it will shrink the corpus to audio-gated size.

---

## 12. User Manual

1. **Pick a skill** in the header segmented control: Similar Words / Type Words / Situations.
2. **Pick a difficulty** (All/A1–C1). Counts on each button are live for the active mode.
3. **Press Play Sound [Space].** Audio plays degraded through the active Background Sound. Press **Clear Audio [C]** any time for the pristine version. Toggle **Normal/Slow** (1.0×/0.8×). **Read Aloud** speaks the on-screen prompt (not the hidden answer) via OS speech synthesis for dyslexia/screen-reader support.
4. **Answer:** click an option (or `1`–`4`), or type and `Enter`. Teen/ty and digit/word equivalences are accepted (`"4" = "four"`).
5. **Study the feedback:** correct answer quoted, your error echoed, both replays available, then `Next [Enter]` or `Shuffle` (random +1…+7 jump).
6. **Change the channel** under Background Sounds: Phone Call (default), Train Station, Walkie-Talkie, Intercom, Weak Cell Signal, or Custom Sound sliders (bass/clarity/noise/crackle + noise-type buttons).
7. **Track progress** via Score: overall accuracy, streak/best, completed count, per-mode and per-level bars, and the last 15 attempts with preset attribution. Reset Data asks for `window.confirm` first.
8. **Reduce load** with Calm View (hides waveform, persists across reloads).

Keyboard map: `Space` play degraded · `C` clean · `1`–`4` choose · `Enter` submit/next · `R` replay-after-answer · `Esc` release dictation focus. All interactive elements meet ≥44 px targets with visible `:focus-visible` rings.

---

## 13. Ethics, Privacy, Accessibility, Licensing, and Attribution

- **Human subjects & privacy.** No login, no telemetry, no cookies, no analytics endpoint. All stats remain in the user’s own `localStorage` and can be wiped in one tap. Classroom deployments should still obtain institutional consent for any screen-recorded or exported history used in research.
- **Accessibility (WCAG 2.2 AA intent, not certified).** Calm Mode, Read Aloud (`rate 0.88`, `en-US`), keyboard-complete operation, ARIA `tablist`/`radiogroup`, labelled canvases/sections, 44–50 px targets, Apple-HIG focus rings, non-colour-only feedback (icons + words + percentages). No independent accessibility audit has been performed; do not cite as WCAG-certified. No vestibular-risk animation beyond the waveform, which Calm Mode removes.
- **Licensing — read before submitting to a university or corpus registry.** (a) This repository declares **no code licence file**; obtain author permission or add one (MIT/Apache-2.0 recommended) before redistribution. (b) Wiktionary IPA/audio metadata: **CC BY-SA 4.0 — credit “Wiktionary contributors” with hyperlink and licence notice, ShareAlike on adaptation.** (c) Commons audio: **per-file licences vary; bulk MP3 redistribution without per-file credit violates the licences** — generate an attribution appendix from the Commons `imageinfo` `extmetadata` before publishing the `public/audio/` bundle. (d) Google-10K list: research-use; confirm policy for commercial use. (e) Fonts/deps: OFL/MIT/Apache as installed. (f) This project is **not endorsed by, affiliated with, or certified by Oxford University Press, the CEFR Council of Europe, Wiktionary, or Wikimedia.**
- **Corpus-review suitability.** Suitable as a *study corpus + trainer* with disclosed synthetic/template components (§6.6, §14). Not suitable as a *reference phonetic corpus* until per-file speaker/dialect/licence metadata and human validation of scenario transcripts are added (§15).

---

## 14. Limitations, Threats to Validity, and Known Defects — Nothing Hidden

1. **Audio coverage gap.** Only 482 of ~4,620 referenced audio URLs existed on disk at original snapshot 2026-09-20 (recount before citing — ingestion keeps adding files). The rest invoke the developer-invented synthetic harmonic-stack fallback (140 Hz + 700/1,700/2,800 Hz sines), which preserves duration/envelope cues but **no lexical content**. Any accuracy claim on uncovered items measures interface behaviour, not listening. Mitigation: run `ingest` + `download_missing_audio`, or gate the corpus with `sync_vocab.cjs`, before controlled studies.
2. **Scenario audio ≠ transcript.** Full-sentence transcripts have no matching sentence audio; playback is keyword/fallback only. Do not describe scenarios as connected-speech tests.
3. **Template artefacts.** Generated scenarios reuse phrasing; some option sets required padding (`None of the above`) and some `audioUrl`s (`scenario_{idx}.mp3`) are intentionally non-existent placeholders. Distractor plausibility was not human-rated. Scenarios are unvetted Mad Libs from `{CITY}`, `{GATE}`, `{TIME}` token substitution, not examiner-written items.
4. **Placeholder phonetics for general vocab.** All 3,269 `general_vocab` items carry `ipa: "/{word}/"` and `partOfSpeech: "noun"` regardless of truth. Only curated/minimal-pair subsets have trustworthy IPA/POS. The `category` union in `src/types/index.ts` still lists the old fine-grained tags while the shipped data uses `general_vocab` — schema drift that will fail strict validators.
5. **Non-deterministic degradation.** Packet-loss dropouts use plain `Math.random()` per playback with no seed — not Gilbert-Elliott or any standard burst-loss model; identical “trials” are not acoustically identical. IR noise is likewise generated once per context from `Math.random()`.
6. **Unvalidated difficulty strata.** A1–C1 labels are author-assigned by Google-10K frequency rank + developer intuition/curation, not Rasch-calibrated or examiner-moderated. C2 absent by design because there was no objective basis to classify it.
7. **No adaptive sequencing, no efficacy trial, no reliability stats.** Shuffling is uniform-random; no SRS, no IRT, no Cronbach’s α / test–retest has been computed. The stats drawer is descriptive, not psychometrically validated.
8. **Residual scaffold.** `express`, `@google/genai`, `motion`, `canvas-confetti` are installed but unwired; `metadata.json`’s Gemini capability and `.env.example`’s keys are inert. `clean` script uses POSIX `rm` (breaks on stock Windows PowerShell). `generate_massive_corpus.js` requires network for the Google-10K fetch and silently falls back to offline pairs if it fails.
9. **Browser variance.** Convolver/WaveShaper/decoder behaviour differs across browsers; reported SNRs are digital-domain calculations relative to an assumed 0.35 speech RMS, not sound-pressure-level measurements. No hearing-safety limiter beyond `masterGain = 1.0` is implemented — keep device volume moderate with headphones.

---

## 15. Evaluation Plan and Future Work

Proposed within-subjects study: learners grouped by author-assigned A1–C1 practice levels × 5 author-tuned presets × 3 modes, counterbalanced, with pre/post clean-vs-degraded minimal-pair probes at fixed digital-domain SNRs (18/12/5/2/0 dB), retention at 1 week, and transfer to held-out scenarios; primary endpoints per-phoneme Δaccuracy and SNR-slope flattening; analysis by mixed-effects logistic regression with random intercepts for learner and item. Power from pilot drawer data (export `localStorage` JSON). This study has not been run; no efficacy claim is made.

Roadmap, in priority order: (a) per-file speaker/dialect/licence attribution roll + human IPA/POS audit; (b) full-sentence recorded or consented-TTS scenario audio replacing keyword playback; (c) seeded-PRNG “frozen trial” mode for replicability; (d) adaptive scheduler (IRT/SRS) + reliability reporting; (e) C2 stratum only after external moderation; (f) server-optional sync with E2E encryption; (g) ESLint + unit/integration tests for scoring, shuffling, and DSP math; (h) SPL-calibrated headphone profiles and safe-listening limiter.

---

## 16. References

- Council of Europe. (2020). *Common European Framework of Reference for Languages: Learning, Teaching, Assessment — Companion Volume.* Council of Europe Publishing. (Used for familiar A1–C1 bin names only; no certification claimed.)
- Oxford University Press / Oxford Online Placement Test (OOPT) — CEFR banding guidance (levels A1–C1 referenced for strata naming only; no certification, affiliation, or endorsement claimed).
- ITU-T narrowband telephony (PSTN, nominal 300–3,400 Hz, cf. G.711) — band edges reused for `landline` preset only; other preset values are author-tuned.
- W3C. *Web Audio API Specification* (`BiquadFilterNode`, `WaveShaperNode`, `ConvolverNode`, `AnalyserNode`).
- Paul Kellett pink-noise filter coefficients (6-pole IIR 1/f approximation, as implemented).
- Flege, J. E. Speech Learning Model (SLM); Best, C. T. Perceptual Assimilation Model for L2 (PAM-L2) — design motivation only, not validation of this app.
- Ladefoged, P., & Johnson, K. *A Course in Phonetics* (IPA conventions, functional load).
- Bjork, R. A., & Bjork, E. L. Desirable difficulties; Sweller, J. Cognitive Load Theory.
- CAST. *Universal Design for Learning Guidelines*; W3C. *Web Content Accessibility Guidelines (WCAG) 2.2* (intent only, no certification).
- Data sources: English Wiktionary (CC BY-SA 4.0); Wikimedia Commons (per-file licences); first20hours/google-10000-english (GitHub); Plus Jakarta Sans (OFL 1.1).

Suggested citation for this system: *Listening Practice — Acoustic Ear Degraded-Speech Practice Prototype, corpus v2.0.0 (3,600 words; 1,020 template-generated scenarios; 482 MP3s at original 2026-09-20 snapshot), React/Web-Audio implementation, 2026. Independent prototype, not OUP/CEFR-certified. Wiktionary/Commons audio © their contributors under CC BY-SA/CC0/GFDL as applicable.*

---

## 17. Appendices

### Appendix A — Minimal-pair contrast inventory (shipped)

| Contrast | Example pairs (levels) |
|---|---|
| `/ɪ/–/iː/` | ship/sheep, sit/seat, bin/bean, chip/cheap, fill/feel, grin/green, pitch/peach, still/steel (A1–B2) |
| `/e/–/æ/` | pen/pan, bed/bad, bet/bat, send/sand, met/mat, wreck/rack (A1–B2) |
| `/ʌ/–/æ/` | cup/cap, cut/cat, bug/bag, truck/track, stuck/stack (A1–B2) |
| `/ʊ/–/uː/` | pull/pool, full/fool, look/Luke, soot/suit (A2–B2) |
| `/ɔː/–/oʊ/` | caught/coat, law/low, ball/bowl, cost/coast (A2–B2) |
| `/b/–/v/`, `/p/–/b/`, `/t/–/d/`, `/k/–/ɡ/` | berry/very, pat/bat, two/do, coat/goat, lock/log (A1–B2) |
| `/θ/–/s/`, `/θ/–/f/`, `/ð/–/d/` | think/sink, three/free, they/day, breathe/breed (A1–B2) |
| `/s/–/z/` | sip/zip, price/prize, loose/lose, advice/advise, device/devise (A2–C1) |
| `/ʃ/–/tʃ/`, `/dʒ/–/tʃ/`, `/dʒ/–/j/` | sheep/cheap, joke/choke, jam/yam, juice/use (A1–B2) |
| `/l/–/r/`, `/w/–/v/` | light/right, west/vest, wine/vine, wary/vary (A1–B2) |
| Nasals `/m/–/n/–/ŋ/` | sum/sun, thin/thing, sin/sing, win/wing (A1–A2) |
| Clusters | port/sport, tick/stick, kill/skill, train/strain, cool/school (A1–B1) |
| Stress `/tiːn/–/ti/` | thirteen/thirty … nineteen/ninety (A1) |
| C1 morphophonemic | loose/lose, advice/advise, device/devise, affect/effect (C1) |

### Appendix B — Preset matrix

See §7.2 (exact HP/LP/drive/SNR/noise/loss/reverb per preset plus custom slider ranges).

### Appendix C — JSON schemas

See §6.3 for `VocabEntry`, `StressScenario`, `VocabDataset`, `AcousticConfig`, `UserStats` with verbatim examples. Validate with `tsc --noEmit` (types) plus a JSON-schema check on `public/data/vocabulary.json` before submission.

### Appendix D — Keyboard shortcuts

`Space` degraded replay · `C` clean bypass · `1`–`4` answer · `Enter` submit/next · `R` replay in feedback state · `Esc` blur dictation input.

### Appendix E — Glossary

SNR (signal-to-noise ratio, dB); HP/LP (high-/low-pass cutoff); WaveShaper drive (saturation index); packet loss (stochastic 30–90 ms muting); convolver IR (synthetic room impulse); minimal pair (two words differing by one phoneme); teen/ty (stress-timed `-teen` vs `-ty` number contrast); CEFR/OOPT (proficiency framework/placement test); A/B bypass (instant clean reference).

### Appendix F — Version and reproduction record

- Corpus snapshot: `version 2.0.0`, 3,600 words, 1,020 template-generated scenarios, 1,330,524-byte `vocabulary.json`, 482 MP3s, measured 2026-09-20 via `python … json.load` + `Get-ChildItem public/audio`. Recount before citing — audio count grows as ingestion runs.
- Generator: `node scripts/generate_massive_corpus.js` (minified output). Curated predecessor: `node scripts/build_educational_corpus.js` (pretty-printed, 30 hand-written scenarios).
- Reproduce counts any time with the one-liner in §6.1. Back up `vocabulary.json` before re-running any writer script.
- Git history at writing: `08d04af feat: initial project scaffold` over `e2324c8 Initial commit` (2 commits; corpus and audio largely untracked/parallel to history — confirm `.gitignore` coverage before archiving for review).

*End of README — no aspect of the corpus size, audio coverage, DSP mathematics, scoring rules, data provenance, licensing obligations, or known defects has been knowingly withheld. Where the implementation is provisional (invented synthetic fallback, template scenarios, placeholder IPA, author-assigned levels, ear-tuned presets, inert Gemini flag), it is labelled as such above so reviewers can judge accordingly. This is an independent practice prototype, not an accredited test suite.*
