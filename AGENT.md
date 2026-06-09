# Agent Reference Guidelines (AGENT.md)

Welcome, agent! This document serves as a persistent guide for any AI coding assistant modifying this repository. It details the architecture, design aesthetic rules, state dependencies, database schemas, and personalized constraints.

---

## 🎨 1. UI/UX Design System & Aesthetics

* **Aesthetic Theme**: High-end, dark-mode dashboard with neon green (`var(--neon-green)`) and glassmorphism styling (`backdrop-filter: blur(8px)`, semi-transparent cards).
* **Typography**: Clean, tech-oriented, and uppercase for section titles. Do **NOT** use random emojis in section headers (e.g., use "Primary Focus" and "Secondary / Stabilizers" rather than "🎯 Primary Focus"). Keep the vertical green/gray indicator lines next to headers.
* **Responsive Layout**: Do not use rigid tables for tabular data. Use responsive CSS flex lists or card layouts that wrap gracefully on mobile viewports.

---

## 🌐 2. Multi-Language & Internationalization (i18n)

* The app supports English (`en`) and Persian (`fa`).
* Directionality (`ltr` / `rtl`) is set dynamically on `document.documentElement.dir` based on the active language (`lang`).
* **Rule**: When adding text to the UI, always update **both** translation files:
  * [en.json](file:///Users/amp/projects/AI-bb/src/locales/en.json)
  * [fa.json](file:///Users/amp/projects/AI-bb/src/locales/fa.json)
* Access translations inside React components via the `t('key')` helper function.

---

## 💾 3. State Management & Persistence

* App state is managed locally via React hooks (`useState`, `useEffect`) and persisted in `localStorage`.
* **Important Keys**:
  * `appLang`: Active language code ('en' or 'fa').
  * `experienceLevel`: Current training background level ('unselected', 'beginner', 'intermediate', 'experienced').
  * `baselineExercises`: An array representing the current baseline movements. Swapping an exercise deletes any stored known load metrics for that index to avoid stale values.
  * `mesocycle`: Active block data.
  * `chatMessages`: The active chat history with the Platinum Personal Trainer.
* **Resetting / Onboarding**:
  * On a reset or onboarding select, the experience level determines the initial baseline exercises via the `BASELINE_TEMPLATES` object in [App.jsx](file:///Users/amp/projects/AI-bb/src/App.jsx).
  * Beginners initialize with an empty array (`[]`) and are prompted to log exercises manually from the library.

---

## 📊 4. Exercise Database Schema (`exercises_db.json`)

All exercises are stored in [exercises_db.json](file:///Users/amp/projects/AI-bb/src/data/exercises_db.json). If you add or modify exercises, strictly adhere to the following schema:

```json
{
  "id": "barbell-bench-press",
  "name_en": "Barbell Bench Press",
  "name_fa": "پرس سینه هالتر",
  "primary_muscle": "chest",
  "secondary_muscles": ["front-deltoids", "triceps"],
  "equipment_type": "Barbell",
  "category": "Chest",
  "hls_manifest_url": null
}
```

### Muscle Slugs Warning
The `primary_muscle` and `secondary_muscles` values must strictly map to the slugs expected by `react-body-highlighter` to render highlights correctly:
* **Chest**: `chest`
* **Shoulders**: `front-deltoids`, `back-deltoids` (Rear Delts)
* **Back**: `trapezius` (Traps), `upper-back`, `lats`, `lower-back`
* **Arms**: `biceps`, `triceps`, `forearms`
* **Legs**: `quads`, `hamstrings`, `glutes`, `calves`
* **Core**: `abs`, `obliques`

---

## 🧮 5. Algorithm & Progression Logic

Key functions are imported from [algorithms.js](file:///Users/amp/projects/AI-bb/src/utils/algorithms.js):
* `calculateE1RM(weight, reps, rpe)`: Calculates estimated 1-Rep Max.
* `mapExertionToRIR(rpe)`: Translates selected RPE option into Reps in Reserve.
* `determineVolumeAdjustment(rir, targetRIR, currentSets)`: Autoregulates weekly training volume increments based on feedback and proximity to failure.

---

## 🍳 6. Amir's Personal Exclusions & Preferences

If generating meal plans or responding via the AI personal trainer chat, respect these hard-coded guardrails:
* **Exclusions**: Under no circumstances suggest **oatmeal** or **kashk**.
* **Preferred Breakfast**: Sangak or Barbari flatbread with Tabriz cheese and honey, or a low-oil tomato omelet.
* **Snacks**: Velvety skim-milk espresso lattes, or sweet mangoes eaten slowly with a small fork.
