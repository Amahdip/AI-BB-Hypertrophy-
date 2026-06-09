const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace BASELINE_TEMPLATES
const templatesRegex = /const BASELINE_TEMPLATES = {[\s\S]*?};/;
const newTemplates = `const BASELINE_TEMPLATES = {
  beginner: [
    { name: 'Barbell Squat', category: 'Legs', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Barbell Bench Press', category: 'Chest', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Deadlift', category: 'Back', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Overhead Press', category: 'Shoulders', rpe: 'COMFORTABLE_3_4_LEFT' }
  ],
  intermediate: [
    { name: 'Barbell Bench Press', category: 'Chest', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Row', category: 'Back', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Squat', category: 'Legs', rpe: 'HARD_1_2_LEFT' },
    { name: 'Overhead Press', category: 'Shoulders', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Curl', category: 'Arms', rpe: 'HARD_1_2_LEFT' }
  ],
  experienced: [
    { name: 'Hack Squat', category: 'Legs', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Incline Dumbbell Press', category: 'Chest', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Romanian Deadlift', category: 'Legs', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Lat Pulldown', category: 'Back', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Cable Lateral Raise', category: 'Shoulders', rpe: 'MAX_OUT_0_LEFT' }
  ]
};`;
content = content.replace(templatesRegex, newTemplates);

// Replace useState for baselineExercises
const useStateRegex = /const \[baselineExercises, setBaselineExercises\] = useState\(\(\) => \{[\s\S]*?\}\);/;
const newUseState = `const [baselineExercises, setBaselineExercises] = useState(() => {
    const saved = localStorage.getItem('baselineExercises');
    const level = localStorage.getItem('experienceLevel');
    if (saved && level) {
      return JSON.parse(saved);
    }
    // If no saved state, initialize dynamically based on experienceLevel
    if (level && BASELINE_TEMPLATES[level]) {
      return BASELINE_TEMPLATES[level].map(m => ({ ...m, weight: '', reps: '', e1rm: 0 }));
    }
    return [];
  });`;
content = content.replace(useStateRegex, newUseState);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Templates and State Fixed");
