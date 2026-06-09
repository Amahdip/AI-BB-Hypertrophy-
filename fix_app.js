const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes("experienceLevel === 'beginner' ? ("));
const endIndex = lines.findIndex((l, idx) => idx > startIndex && l.trim() === ")}") + 1; // Wait, there are multiple ")}".

console.log("Start index:", startIndex);
