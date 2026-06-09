const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add useRef to imports
const reactImportRegex = /import React, \{ useState, useEffect, useRef \} from 'react';/;
if (!content.includes('useRef')) {
    content = content.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
}

// 2. Add useEffect for experienceLevel after baselineExercises useState
const useStateRegex = /const \[baselineExercises, setBaselineExercises\] = useState\(\(\) => \{[\s\S]*?\}\);/;
const useEffectToAdd = `
  const initialMount = useRef(true);
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      // On mount, if they have an experienceLevel but NO baselineExercises in localStorage,
      // or if they want to forcefully reset (we skip reset on mount to preserve user weights if they exist)
      return;
    }
    
    if (experienceLevel === 'unselected') return;
    
    const key = experienceLevel.toLowerCase();
    // Strict match, mapping 'expert' to 'experienced' if needed
    const templateKey = key === 'expert' ? 'experienced' : key;
    const template = BASELINE_TEMPLATES[templateKey] || BASELINE_TEMPLATES['beginner'];
    
    setBaselineExercises(template.map(m => ({
      ...m,
      weight: '',
      reps: '',
      e1rm: 0
    })));
  }, [experienceLevel]);`;

content = content.replace(useStateRegex, match => match + useEffectToAdd);

// 3. Update handleSelectExperience to just setExperienceLevel
const handleSelectRegex = /const handleSelectExperience = \(level\) => \{[\s\S]*?setKnownMovements\(\{\}\);\n  \};/;
const newHandleSelect = `const handleSelectExperience = (level) => {
    setExperienceLevel(level);
    setKnownMovements({});
  };`;
content = content.replace(handleSelectRegex, newHandleSelect);

// 4. Update the fallback logic in useState initialization
const initRegex = /if \(level && BASELINE_TEMPLATES\[level\]\) \{/;
const newInit = `const templateKey = level ? (level.toLowerCase() === 'expert' ? 'experienced' : level.toLowerCase()) : 'beginner';
    if (level && BASELINE_TEMPLATES[templateKey]) {`;
content = content.replace(initRegex, newInit);

content = content.replace(/return BASELINE_TEMPLATES\[level\].map/g, "return BASELINE_TEMPLATES[templateKey].map");

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("State overwrite fixed");
