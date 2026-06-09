import React from 'react';
import Model from 'react-body-highlighter';

export default function ExerciseFilterMap({ selectedMuscle, onSelectMuscle }) {
  // If a muscle is selected, we highlight it with our neon green
  const data = selectedMuscle ? [
    {
      name: `${selectedMuscle}-selection`,
      muscles: [selectedMuscle],
      frequency: 1
    }
  ] : [];

  const handleClick = (muscleData) => {
    if (muscleData && muscleData.muscle) {
      // Toggle selection: if clicking the already selected muscle, deselect it
      if (selectedMuscle === muscleData.muscle) {
        onSelectMuscle(null);
      } else {
        onSelectMuscle(muscleData.muscle);
      }
    }
  };

  return (
    <div className="card" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Interactive Body Map</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Click on any muscle to filter exercises
          </p>
        </div>
        {selectedMuscle && (
          <button 
            onClick={() => onSelectMuscle(null)} 
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '6px 16px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}
          >
            Clear Filter
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', width: '160px' }}>
          <Model
            type="anterior"
            data={data}
            style={{ width: '160px', padding: '10px', cursor: 'pointer' }}
            highlightedColors={['var(--primary)']}
            bodyColor="rgba(255, 255, 255, 0.05)"
            onClick={handleClick}
          />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', marginTop: '12px' }}>
            FRONT
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '160px' }}>
          <Model
            type="posterior"
            data={data}
            style={{ width: '160px', padding: '10px', cursor: 'pointer' }}
            highlightedColors={['var(--primary)']}
            bodyColor="rgba(255, 255, 255, 0.05)"
            onClick={handleClick}
          />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', letterSpacing: '2px', color: 'var(--text-muted)', marginTop: '12px' }}>
            BACK
          </div>
        </div>
      </div>
    </div>
  );
}
