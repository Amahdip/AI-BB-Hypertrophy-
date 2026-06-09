const fs = require('fs');
const content = fs.readFileSync('src/App.jsx', 'utf8');

const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes("experienceLevel === 'beginner' ? ("));
const endIndex = lines.findIndex(l => l.includes("              {swapModalState && ("));

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end index", startIndex, endIndex);
  process.exit(1);
}

const newContent = `              ) : (
                <div style={{ gridColumn: '1 / -1', maxWidth: '1000px', margin: '0 auto' }}>
                  
                  {showSuccessToast && (
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--primary)', 
                      padding: '16px', borderRadius: '8px', marginBottom: '24px', 
                      display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)'
                    }}>
                      <CheckCircle size={20} />
                      <span style={{ fontWeight: '600' }}>{t('successToast')}</span>
                    </div>
                  )}

                  {/* 1. Configure Your Baseline Cards */}
                  <div className="card" style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <button onClick={() => setExperienceLevel('unselected')} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
                        <ChevronRight style={{ transform: lang === 'fa' ? 'rotate(0deg)' : 'rotate(180deg)' }} />
                      </button>
                      <h2 className="card-title" style={{ margin: 0 }}>
                        <Activity style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Configure Your Baseline
                      </h2>
                    </div>

                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                      We've pre-selected a dynamic template for your experience level. Check the box if you know your heavy weight for the movement. If unchecked, you can click "Swap" to pick an alternative, or leave it unchecked to mark it for a "Calibration Week". You can also browse the Interactive Body Map below to add more movements!
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {baselineExercises.map((ex, idx) => {
                        const isKnown = !!knownMovements[ex.name];
                        return (
                          <div key={idx} style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            transition: 'border-color 0.2s',
                          }}>
                            {/* Header: Name, Category, and Swap */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{ex.name}</h4>
                                <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>{ex.category}</span>
                              </div>
                              {ex.category && (
                                <button 
                                  onClick={() => handleSwapClick(idx, ex.category)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', border: 'none' }}
                                >
                                  <RefreshCw size={14} /> Swap
                                </button>
                              )}
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.5 }}></div>

                            {/* Action Row: Toggle and Inputs */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div 
                                  onClick={() => handleToggleKnown(ex.name)}
                                  style={{
                                    width: '40px', height: '22px', borderRadius: '11px',
                                    background: isKnown ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute', top: '3px', left: isKnown ? '21px' : '3px',
                                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                  }} />
                                </div>
                                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                  I know my 1RM
                                </span>
                              </div>

                              <div style={{ minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                                {isKnown ? (
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', animation: 'fadeIn 0.3s ease-out' }}>
                                    <input 
                                      type="number" 
                                      placeholder="Weight" 
                                      value={ex.weight} 
                                      onChange={(e) => handleUpdateBaselineEx(idx, 'weight', parseFloat(e.target.value) || 0)}
                                      style={{ width: '80px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none' }}
                                    />
                                    <span style={{ color: 'var(--text-muted)' }}>kg ×</span>
                                    <input 
                                      type="number" 
                                      placeholder="Reps" 
                                      value={ex.reps} 
                                      onChange={(e) => handleUpdateBaselineEx(idx, 'reps', parseInt(e.target.value) || 0)}
                                      style={{ width: '70px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none' }}
                                    />
                                  </div>
                                ) : (
                                  <div style={{
                                    padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontSize: '11px', 
                                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600',
                                    animation: 'fadeIn 0.3s ease-out'
                                  }}>
                                    Marked for Calibration
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        {t('loggedMovements1')}{baselineExercises.length}{t('loggedMovements2')}{baselineExercises.length === 1 ? t('loggedMovementSingular') : t('loggedMovementPlural')}
                      </p>
                      <button onClick={handleInitializeMesocycle} className="btn btn-primary" style={{ minWidth: '300px' }}>
                        <Play size={16} /> {t('initializePlan')}
                      </button>
                    </div>
                  </div>

                  {/* 2. Interactive Body Map */}
                  <div className="card" style={{ marginBottom: '32px' }}>
                    <h2 style={{ marginBottom: '16px' }}>Interactive Exercise Library</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                      Click on any muscle group to filter our database. Select an exercise to log your baseline and append it to your program.
                    </p>
                    <ExerciseFilterMap 
                      selectedMuscle={selectedMuscle} 
                      onSelectMuscle={setSelectedMuscle} 
                    />

                    <div style={{ margin: '32px 0' }}>
                      <input 
                        type="search" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search exercises (e.g. Cable, Curl)..."
                        style={{
                          width: '100%', padding: '16px', borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                          color: 'var(--text-light)', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                      />
                    </div>

                    {selectedMuscle && (
                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', fontWeight: '700' }}>Primary Focus</h3>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                      {primaryExercises.map(ex => renderExerciseCard(ex, false))}
                    </div>

                    {selectedMuscle && secondaryExercises.length > 0 && (
                      <>
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                          <div style={{ width: '8px', height: '24px', background: 'var(--text-muted)', borderRadius: '4px' }}></div>
                          <h3 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', fontWeight: '700' }}>Secondary / Stabilizers</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                          {secondaryExercises.map(ex => renderExerciseCard(ex, true))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 3. Dumb Logging Modal */}
                  {beginnerLogModal && (
                    <div 
                      onClick={() => setBeginnerLogModal(null)}
                      style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                        padding: '16px'
                      }}
                    >
                      <div 
                        className="card" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          width: '100%', maxWidth: '500px', 
                          animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                      >
                        <style>{\`
                          @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        \`}</style>
                        <h3 style={{ marginBottom: '8px', fontSize: '22px' }}>{beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name}</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>What did you lift today?</p>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Weight (kg)</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              placeholder="e.g. 40"
                              value={beginnerLogWeight}
                              onChange={(e) => setBeginnerLogWeight(e.target.value)}
                              style={{ fontSize: '24px', padding: '16px', textAlign: 'center' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="form-label">Reps Completed</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              placeholder="e.g. 10"
                              value={beginnerLogReps}
                              onChange={(e) => setBeginnerLogReps(e.target.value)}
                              style={{ fontSize: '24px', padding: '16px', textAlign: 'center' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                          <button onClick={() => setBeginnerLogModal(null)} className="btn btn-secondary" style={{ flex: 1, padding: '16px' }}>
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveBeginnerLog} 
                            className="btn btn-primary" 
                            style={{ flex: 2, padding: '16px', fontSize: '16px' }}
                            disabled={!beginnerLogWeight || !beginnerLogReps}
                          >
                            Save Log
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
`;

const finalContent = lines.slice(0, startIndex).join('\n') + '\n' + newContent + '\n' + lines.slice(endIndex).join('\n');

fs.writeFileSync('src/App.jsx', finalContent, 'utf8');
console.log("Successfully replaced the UI block.");
