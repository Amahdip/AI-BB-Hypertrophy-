import React, { useMemo } from 'react';
import exercisesDb from '../data/exercises_db.json';
import Model from 'react-body-highlighter';

export default function MuscleHeatmap({ mesocycle }) {
  const data = useMemo(() => {
    if (!mesocycle || !mesocycle.exercises) return [];

    // Tally up total sets per react-body-highlighter muscle slug
    const muscleVolume = {};

    mesocycle.exercises.forEach(ex => {
      // Look up exercise to find its primary muscle
      const dbEx = exercisesDb.find(d => d.name_en === ex.name || d.id === ex.name);
      const sets = ex.target_sets || 0;

      let musclesToHighlight = [];

      if (dbEx && dbEx.primary_muscle) {
        musclesToHighlight = [dbEx.primary_muscle];
      } else {
        // Fallback guess logic for unknown custom exercises based on category text
        const cat = (ex.category || '').toLowerCase();
        if (cat.includes('chest') || cat.includes('push')) musclesToHighlight = ['chest'];
        if (cat.includes('back') || cat.includes('pull')) musclesToHighlight = ['upper-back'];
        if (cat.includes('legs') || cat.includes('quads')) musclesToHighlight = ['quadriceps'];
        if (cat.includes('shoulders')) musclesToHighlight = ['front-deltoids'];
        if (cat.includes('biceps')) musclesToHighlight = ['biceps'];
        if (cat.includes('triceps')) musclesToHighlight = ['triceps'];
      }

      musclesToHighlight.forEach(muscleSlug => {
        if (!muscleVolume[muscleSlug]) muscleVolume[muscleSlug] = 0;
        muscleVolume[muscleSlug] += sets;
      });
    });

    // Map calculated volume counts into the specific format & intensity scale for the package
    const modelData = [];

    for (const [muscle, volume] of Object.entries(muscleVolume)) {
      if (volume <= 0) continue;
      
      let intensity = 1; // 1-6 sets: Light
      if (volume >= 7 && volume <= 15) intensity = 2; // Optimal
      else if (volume >= 16) intensity = 3; // High / Warning

      modelData.push({
        name: `${muscle}-activation`,
        muscles: [muscle],
        frequency: intensity
      });
    }

    return modelData;
  }, [mesocycle]);

  // Our custom cyber-neon colors mapping to Intensity 1, 2, 3
  const colors = ['rgba(0, 255, 136, 0.3)', '#22c55e', '#ff4d4d'];

  return (
    <div className="heatmap-container">
      <div className="heatmap-visuals" style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
        <div className="heatmap-figure" style={{ textAlign: 'center', width: '160px' }}>
          <div style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Model
              data={data}
              style={{ width: '160px', padding: '10px' }}
              highlightedColors={colors}
              bodyColor="rgba(255, 255, 255, 0.05)"
            />
          </div>
          <div className="figure-label" style={{ marginTop: '12px' }}>FRONT</div>
        </div>

        <div className="heatmap-figure" style={{ textAlign: 'center', width: '160px' }}>
          <div style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Model
              type="posterior"
              data={data}
              style={{ width: '160px', padding: '10px' }}
              highlightedColors={colors}
              bodyColor="rgba(255, 255, 255, 0.05)"
            />
          </div>
          <div className="figure-label" style={{ marginTop: '12px' }}>BACK</div>
        </div>
      </div>

      <div className="heatmap-legend" style={{ marginTop: '20px' }}>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(255, 255, 255, 0.05)' }}></div>
          <span>0 Sets (Rest)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'rgba(0, 255, 136, 0.3)' }}></div>
          <span>1-6 Sets (Light)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
          <span>7-15 Sets (Optimal)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: '#ff4d4d', boxShadow: '0 0 10px #ff4d4d' }}></div>
          <span>16+ Sets (High)</span>
        </div>
      </div>
    </div>
  );
}
