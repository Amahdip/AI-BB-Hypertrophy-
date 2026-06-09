const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Nuke cache in handleSelectExperience
const handleSelectRegex = /const handleSelectExperience = \(level\) => \{[\s\S]*?setKnownMovements\(\{\}\);\n  \};/;
const newHandleSelect = `const handleSelectExperience = (level) => {
    localStorage.removeItem('baselineExercises');
    setExperienceLevel(level);
    setKnownMovements({});
  };`;
content = content.replace(handleSelectRegex, newHandleSelect);

// 2. We already fixed the useState logic to fall back to BASELINE_TEMPLATES in the previous step
// Let's just double check and make sure it's solid.
// It looks like:
/*
  const [baselineExercises, setBaselineExercises] = useState(() => {
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
    if (level) {
      const template = BASELINE_TEMPLATES[level.toLowerCase()];
      if (template) return template;
    }
    return [];
  });
*/

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Cache nuke fixed");
