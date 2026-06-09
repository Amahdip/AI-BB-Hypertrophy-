const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Change BASELINE_TEMPLATES keys to lowercase
content = content.replace(/"Beginner": \[/g, '"beginner": [');
content = content.replace(/"Expert": \[/g, '"expert": [');

// 2. Update useState initialization logic
const useStateRegex = /const level = localStorage\.getItem\('experienceLevel'\);\n    if \(level && BASELINE_TEMPLATES\[level\]\) \{\n      return BASELINE_TEMPLATES\[level\];\n    \}/;
const newUseState = `const level = localStorage.getItem('experienceLevel');
    if (level) {
      const template = BASELINE_TEMPLATES[level.toLowerCase()];
      if (template) return template;
    }`;
content = content.replace(useStateRegex, newUseState);

// 3. Update useEffect logic
const useEffectRegex = /useEffect\(\(\) => \{\n    const template = BASELINE_TEMPLATES\[experienceLevel\];\n    if \(template\) \{\n      setBaselineExercises\(template\);\n      localStorage\.setItem\('baselineExercises', JSON\.stringify\(template\)\);\n    \}\n  \}, \[experienceLevel\]\);/;
const newUseEffect = `useEffect(() => {
    if (!experienceLevel || experienceLevel === 'unselected') return;
    const template = BASELINE_TEMPLATES[experienceLevel.toLowerCase()];
    if (template) {
      setBaselineExercises(template);
      localStorage.setItem('baselineExercises', JSON.stringify(template));
    }
  }, [experienceLevel]);`;
content = content.replace(useEffectRegex, newUseEffect);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Case sensitivity fixed");
