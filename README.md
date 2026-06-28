# FuturePilot AI

**Test a future before you bet years of your life and money on it.**

FuturePilot AI is an AI career flight-simulator. Instead of another "what should I be?" quiz, a student picks a career and takes a 20‑minute *trial*: they do the real work, catch the mistakes an AI coworker makes, run the actual money math, and walk away with an honest verdict and a downloadable report.

Built for the **Youth Code x AI** hackathon — **Track 04: "What Do I Even Do With My Life? AI Can Help"**, with a strong tie to **Track 01: "Money, Jobs & AI."**

---

## The problem

Students pick careers on vibes: *"Does it pay well? What will my family think? Will AI kill it?"* They almost never see the real day‑to‑day, the boring parts, the education debt, or where a human still beats an AI. By the time they find out, they've spent years and a lot of money.

## The solution — an 8‑step trial

For any career, FuturePilot AI runs a guided "deneme sürüşü" (test drive):

1. **Reality Brief** — what the job actually is, the real day, the part nobody tells you, the tools.
2. **Crash Course** — the first things you'd genuinely learn, as a tickable starter syllabus.
3. **Work Simulation** — a real on‑the‑job decision with one right answer and honest feedback.
4. **AI Coworker Mistake** — an AI confidently suggests something subtly wrong; you catch the flaw with human judgment.
5. **AI Impact Check** — what AI automates, where humans still win, and an honest 0–100 exposure score.
6. **Life Math** — real tuition, a real starting wage, debt after aid + part‑time work, and a break‑even chart you can steer.
7. **Path Options** — university, community‑college transfer, bootcamp, certificate — compared on cost, time, and debt risk.
8. **30‑Day Plan + Reality Score** — what to do this month, a five‑dimension score, a Go / Think‑twice / Explore verdict, and a one‑click PDF report.

## What makes it more than a quiz

- **50 deeply researched careers**, each with web‑verified BLS pay/outlook, real universities + current tuition, and a game‑like multi‑beat shift simulation.
- **A living AI coach (Vera)**, a live AI "shadow shift" role‑play, an AI "Teach me" tutor on every skill, a personalized AI roadmap, and multimodal "Find your fit" (photo/voice) — all powered by Gemini.
- **Any profession, on demand.** Type a career that isn't built in (e.g. *Marine Biologist*, *Pilot*) and — with a free Google Gemini key — the app generates a full FuturePilot profile on the fly.
- **The AI‑mistake mechanic** is the thesis: AI is a fast, confident coworker that's sometimes wrong in ways only a human catches. Every simulation makes the student *be* that human.
- **Live, honest scoring** that blends your work‑sim decisions, whether you caught the AI's mistake, your own interest, and your debt‑to‑income.
- **Compare two futures** side by side, **resume** where you left off (localStorage), and **download a PDF** career report.

## Tech

- **React 19 + TypeScript + Vite**, **Tailwind CSS v4**, **Framer Motion**, **lucide-react**.
- **jsPDF** for the downloadable report (lazy‑loaded so first paint stays fast).
- **Vitest** unit + smoke tests for the scoring engine, Life Math, and the app flow.
- Optional **Google Gemini 2.5 Flash** (free tier) for generating long‑tail careers — provider‑agnostic, with a deterministic core that works fully offline.
- No backend. All curated data lives in a typed local dataset.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 — opens straight into a working trial
npm run build      # type-check + production build
npm test           # vitest
```

The app boots directly into the Data Analyst trial — no landing page.

**Optional AI:** click *Connect free AI* in the sidebar and paste a free key from
[Google AI Studio](https://aistudio.google.com/apikey) to unlock generating any career. Everything else works without it.

## Data & sources

Pay and job‑outlook figures come from the **U.S. Bureau of Labor Statistics** Occupational Outlook Handbook (May 2024 where available); each career links to its source page. Tuition figures come from universities' published tuition pages. AI‑generated career profiles are clearly labeled and should be treated as well‑reasoned estimates, not audited data.

---

*FuturePilot AI — because the cheapest way to test a future is before you live it.*
