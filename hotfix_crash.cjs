const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Fix BASELINE_TEMPLATES keys
const templatesRegex = /const BASELINE_TEMPLATES = {[\s\S]*?};/;
const newTemplates = `const BASELINE_TEMPLATES = {
  "Beginner": [
    { name: 'Barbell Squat', category: 'Legs', rpe: 'COMFORTABLE_3_4_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Barbell Bench Press', category: 'Chest', rpe: 'COMFORTABLE_3_4_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Deadlift', category: 'Back', rpe: 'COMFORTABLE_3_4_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Overhead Press', category: 'Shoulders', rpe: 'COMFORTABLE_3_4_LEFT', weight: '', reps: '', e1rm: 0 }
  ],
  "Expert": [
    { name: 'Hack Squat', category: 'Legs', rpe: 'MAX_OUT_0_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Incline Dumbbell Press', category: 'Chest', rpe: 'MAX_OUT_0_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Romanian Deadlift', category: 'Legs', rpe: 'MAX_OUT_0_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Lat Pulldown', category: 'Back', rpe: 'MAX_OUT_0_LEFT', weight: '', reps: '', e1rm: 0 },
    { name: 'Cable Lateral Raise', category: 'Shoulders', rpe: 'MAX_OUT_0_LEFT', weight: '', reps: '', e1rm: 0 }
  ]
};`;
content = content.replace(templatesRegex, newTemplates);

// 2. Fix the baselineExercises useState block to fall back safely
const useStateRegex = /const \[baselineExercises, setBaselineExercises\] = useState\(\(\) => \{[\s\S]*?\}\);/;
const newUseState = `const [baselineExercises, setBaselineExercises] = useState(() => {
    try {
      const saved = localStorage.getItem('baselineExercises');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse baselineExercises', e);
    }
    const level = localStorage.getItem('experienceLevel');
    if (level && BASELINE_TEMPLATES[level]) {
      return BASELINE_TEMPLATES[level];
    }
    return [];
  });`;
content = content.replace(useStateRegex, newUseState);

// 3. Fix the useEffect that listens to experienceLevel
const useEffectRegex = /useEffect\(\(\) => \{\s*if \(experienceLevel === 'unselected'\) return;[\s\S]*?\}, \[experienceLevel\]\);/;
const newUseEffect = `useEffect(() => {
    const template = BASELINE_TEMPLATES[experienceLevel];
    if (template) {
      setBaselineExercises(template);
      localStorage.setItem('baselineExercises', JSON.stringify(template));
    }
  }, [experienceLevel]);`;
content = content.replace(useEffectRegex, newUseEffect);

// 4. Update the onClick handlers in Level Selection if they are passing lowercase
// Let's grep and replace 'beginner' and 'experienced' to 'Beginner' and 'Expert' in handleSelectExperience calls
content = content.replace(/handleSelectExperience\('beginner'\)/g, "handleSelectExperience('Beginner')");
content = content.replace(/handleSelectExperience\('experienced'\)/g, "handleSelectExperience('Expert')");

// 5. Fix the .map crash in the Workout Tracker AND Configure Baseline mapping
// We need to change baselineExercises.map to (baselineExercises || []).map
content = content.replace(/baselineExercises\.map/g, "(baselineExercises || []).map");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Hotfix Applied");
