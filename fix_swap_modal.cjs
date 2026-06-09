const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update renderExerciseCard to accept onClickHandler
const renderRegex = /const renderExerciseCard = \(ex, isSecondary = false\) => \(/;
content = content.replace(renderRegex, "const renderExerciseCard = (ex, isSecondary = false, customOnClick = null) => (");

const onClickRegex = /onClick=\{\(\) => setBeginnerLogModal\(\{ exercise: ex \}\)\}/;
content = content.replace(onClickRegex, "onClick={() => customOnClick ? customOnClick(ex) : setBeginnerLogModal({ exercise: ex })}");

// 2. Remove the Interactive Exercise Library from main UI and move it to SwapModal
const mainLibraryRegex = /\{\/\* 2\. Interactive Body Map \*\/\}\s*<div className="card" style=\{\{ marginBottom: '32px' \}\}>[\s\S]*?\{\/\* 3\. Dumb Logging Modal \*\/\}/;
content = content.replace(mainLibraryRegex, "{/* 3. Dumb Logging Modal */}");

// 3. Update the executeSwap function to clear selectedMuscle
const executeSwapRegex = /const executeSwap = \(newExDetails\) => \{/;
const newExecuteSwap = `const executeSwap = (newExDetails) => {
    setSelectedMuscle(null);`;
content = content.replace(executeSwapRegex, newExecuteSwap);

// 4. Re-write the SwapModal UI
const swapModalRegex = /\{swapModalState && \([\s\S]*?\}\)/;
const newSwapModal = `{swapModalState && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(12px)'
                }}>
                  <div className="card" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Swap Exercise</h3>
                      <button onClick={() => { setSwapModalState(null); setSelectedMuscle(null); setSwapSearchQuery(''); }} className="btn btn-secondary" style={{ padding: '6px 12px' }}>Close</button>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                      Select a muscle group on the body map, or use the search bar to find an alternative movement.
                    </p>

                    <ExerciseFilterMap 
                      selectedMuscle={selectedMuscle} 
                      onSelectMuscle={setSelectedMuscle} 
                    />

                    <div style={{ margin: '24px 0' }}>
                      <input 
                        type="search" 
                        value={swapSearchQuery}
                        onChange={(e) => setSwapSearchQuery(e.target.value)}
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

                    {/* Primary & Secondary Grid inside Swap Modal */}
                    {selectedMuscle && (
                      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }}></div>
                        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', fontWeight: '700' }}>Primary Focus</h3>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                      {primaryExercises.map(ex => renderExerciseCard(ex, false, executeSwap))}
                    </div>

                    {selectedMuscle && secondaryExercises.length > 0 && (
                      <>
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                          <div style={{ width: '8px', height: '24px', background: 'var(--text-muted)', borderRadius: '4px' }}></div>
                          <h3 style={{ margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '14px', fontWeight: '700' }}>Secondary / Stabilizers</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                          {secondaryExercises.map(ex => renderExerciseCard(ex, true, executeSwap))}
                        </div>
                      </>
                    )}

                    {/* Fallback search results if no muscle is selected */}
                    {!selectedMuscle && swapSearchQuery.trim() && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exercisesDb
                          .filter(ex => (ex.name_en || '').toLowerCase().includes(swapSearchQuery.toLowerCase()) || (ex.name_fa || '').includes(swapSearchQuery))
                          .map((alt, altIdx) => (
                            <div 
                              key={altIdx} 
                              style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '12px', background: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid var(--border-color)', borderRadius: '8px' 
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: '600' }}>{alt.name_en}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alt.category} • {alt.equipment_type}</div>
                              </div>
                              <button 
                                className="btn btn-primary" 
                                onClick={() => executeSwap(alt)}
                                style={{ padding: '6px 16px', fontSize: '12px' }}
                              >
                                Swap
                              </button>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}`;

content = content.replace(swapModalRegex, newSwapModal);

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log("Swap Modal Fixed");
