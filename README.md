# RP Hypertrophy.ai (AI-BB)

A premium, hyper-personalized, and scientifically-grounded Progressive Overload & Autoregulation Mesocycle Tracker. Built with **React 19, Vite, and PWA integration**, this application simulates advanced hypertrophy coaching principles inspired by Renaissance Periodization (RP) and JuggernautAI.

Tailored for **Amir**, the application features custom nutrition constraints, an interactive muscle highlighter library, multi-language support (English & Persian/RTL), and an auto-regulating training progression engine.

---

## 🚀 Key Features

### 1. Dynamic Experience-Level Onboarding
* **Absolute Beginner**: Loads an empty baseline track. Prompts the user to log exercises from an interactive machine-based library to calibrate initial metrics without overcomplicating things.
* **Intermediate Lifter**: Prefills a balanced barbell/dumbbell-centric baseline.
* **Experienced Lifter**: Prepopulates an advanced hypertrophy template containing five core movements:
  * Incline Dumbbell Press
  * Lat Pulldown
  * Hack Squat
  * Romanian Deadlift
  * Cable Lateral Raise

### 2. Sleek Interactive Swap Modal
* Allows users to swap baseline exercises with ease.
* Features a gorgeous, blurred glassmorphism overlay (`backdrop-filter: blur(8px)`) with a responsive search/filter bar to query 70+ science-based hypertrophy movements instantly.

### 3. Categorized Exercise Library & Heatmap
* Built around an interactive muscle group highlighter (`react-body-highlighter` wrapper).
* Automatically splits exercises when a muscle is selected:
  * **Primary Focus**: Green neon-accented indicator for direct target movements.
  * **Secondary / Stabilizers**: Muted gray-accented indicator for stabilizers (e.g., Deadlifts when filtering for Abs).
* Polished typography (uppercase, tracked, sleek, clean, and emoji-free headers).

### 4. Personal Trainer Chat & Parser Console
* Mock and real AI personal trainer console implementing RP & JuggernautAI auto-regulation logic.
* **JSON Parser**: Paste complex generated workout plans or log sheets directly to update the local DB schema instantly.

### 5. Personalized Nutrition & Macros
* Automatically tracks macro goals based on bodyweight and training objectives.
* Respects Amir's custom preferences:
  * **Exclusions**: Strictly *NO oatmeal* and *NO kashk*.
  * **Breakfast Options**: Sangak or Barbari flatbread with Tabriz cheese and honey, or a low-oil tomato omelet.
  * **Beverages / Snacks**: Velvety skim-milk espresso lattes, and sliced mangoes enjoyed slowly with a small fork.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 19 (Hooks, Context, LocalStorage state syncing)
* **Build System**: Vite 8 + Progressive Web App (PWA) configuration
* **Styling**: Premium custom CSS (featuring glassmorphism, vibrant dark-neon accents, smooth hover transitions, and full RTL layout compatibility)
* **Icons**: `lucide-react`
* **Interactive Map**: `react-body-highlighter`

---

## 📦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* `npm` or `yarn`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Amahdip/AI-BB-Hypertrophy-.git
   cd AI-BB-Hypertrophy-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the hot-reloading development server:
```bash
npm run dev
```

To build the optimized production assets:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```
