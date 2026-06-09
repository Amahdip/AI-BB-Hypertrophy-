import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  TrendingUp, 
  Apple, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Database, 
  Sparkles, 
  ChevronRight,
  RefreshCw,
  Ban,
  Check,
  User,
  Trash2 as TrashIcon,
  Save
} from 'lucide-react';
import { calculateE1RM, mapExertionToRIR, determineVolumeAdjustment } from './utils/algorithms';
import exercisesDb from './data/exercises_db.json';
import { generateMesocyclePlan, sendChatMessage } from './services/aiService';
import MuscleHeatmap from './components/MuscleHeatmap';
import ExerciseFilterMap from './components/ExerciseFilterMap';


// Dynamic baseline templates for each experience level
const BASELINE_TEMPLATES = {
  beginner: [
    { name: 'Machine Chest Press', category: 'Chest', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Lat Pulldown', category: 'Back', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Leg Press', category: 'Legs', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Dumbbell Lateral Raise', category: 'Shoulders', rpe: 'COMFORTABLE_3_4_LEFT' },
    { name: 'Dumbbell Curl', category: 'Arms', rpe: 'COMFORTABLE_3_4_LEFT' }
  ],
  intermediate: [
    { name: 'Barbell Bench Press', category: 'Chest', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Row', category: 'Back', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Squat', category: 'Legs', rpe: 'HARD_1_2_LEFT' },
    { name: 'Overhead Press', category: 'Shoulders', rpe: 'HARD_1_2_LEFT' },
    { name: 'Barbell Curl', category: 'Arms', rpe: 'HARD_1_2_LEFT' }
  ],
  experienced: [
    { name: 'Incline Dumbbell Press', category: 'Chest', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Lat Pulldown', category: 'Back', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Hack Squat', category: 'Legs', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Romanian Deadlift', category: 'Legs', rpe: 'MAX_OUT_0_LEFT' },
    { name: 'Cable Lateral Raise', category: 'Shoulders', rpe: 'MAX_OUT_0_LEFT' }
  ]
};

import enTranslations from './locales/en.json';
import faTranslations from './locales/fa.json';

const TRANSLATIONS = {
  en: enTranslations,
  fa: faTranslations
};

// Dynamic label/image helper functions
const checkIsDumbbell = (exerciseName) => {
  if (!exerciseName) return false;
  const nameLower = exerciseName.toLowerCase();
  if (nameLower.includes('dumbbell') || nameLower.includes('lateral raise')) return true;
  const dbMatch = exercisesDb.find(d => d.name_en === exerciseName);
  if (dbMatch && (dbMatch.equipment_type || '').toLowerCase().includes('dumbbell')) return true;
  return false;
};

const checkIsAssisted = (exerciseName) => {
  if (!exerciseName) return false;
  const nameLower = exerciseName.toLowerCase();
  if (nameLower.includes('assisted')) return true;
  const dbMatch = exercisesDb.find(d => d.name_en === exerciseName);
  if (dbMatch && (dbMatch.name_en || '').toLowerCase().includes('assisted')) return true;
  return false;
};

const checkIsUnilateral = (exerciseName) => {
  if (!exerciseName) return false;
  const nameLower = exerciseName.toLowerCase();
  return nameLower.includes('single') || nameLower.includes('one arm') || nameLower.includes('alternating') || nameLower.includes('lunges') || nameLower.includes('lunge');
};

const checkIsBodyweight = (exerciseName, equipmentType) => {
  const nameLower = (exerciseName || '').toLowerCase();
  const eqLower = (equipmentType || '').toLowerCase();

  // Explicitly check for bodyweight equipment types or lack of equipment
  if (
    eqLower === 'bodyweight' || 
    eqLower === 'body weight' || 
    eqLower === 'none' || 
    equipmentType === null || 
    equipmentType === undefined ||
    equipmentType === ''
  ) {
    return true;
  }

  // Check name indicators for bodyweight movements (ensuring it's not a cable or assisted machine)
  if (!nameLower.includes('cable') && !nameLower.includes('assisted')) {
    if (
      nameLower.includes('crunch') ||
      nameLower.includes('sit-up') ||
      nameLower.includes('situp') ||
      nameLower.includes('pull-up') ||
      nameLower.includes('pullup') ||
      nameLower.includes('push-up') ||
      nameLower.includes('pushup') ||
      nameLower.includes('plank') ||
      nameLower.includes('dip') ||
      nameLower.includes('chin-up') ||
      nameLower.includes('chinup') ||
      nameLower.includes('leg raise') ||
      nameLower.includes('hanging leg') ||
      nameLower.includes('hyperextension')
    ) {
      return true;
    }
  }

  // Also check database if only name is available or for secondary matches
  const dbMatch = exercisesDb.find(d => d.name_en === exerciseName);
  if (dbMatch) {
    const dbEqLower = (dbMatch.equipment_type || '').toLowerCase();
    const dbNameLower = (dbMatch.name_en || '').toLowerCase();
    
    if (
      dbEqLower === 'bodyweight' || 
      dbEqLower === 'body weight' || 
      dbEqLower === 'none' || 
      dbMatch.equipment_type === null || 
      dbMatch.equipment_type === undefined ||
      dbMatch.equipment_type === ''
    ) {
      return true;
    }

    if (!dbNameLower.includes('cable') && !dbNameLower.includes('assisted')) {
      if (
        dbNameLower.includes('crunch') ||
        dbNameLower.includes('sit-up') ||
        dbNameLower.includes('situp') ||
        dbNameLower.includes('pull-up') ||
        dbNameLower.includes('pullup') ||
        dbNameLower.includes('push-up') ||
        dbNameLower.includes('pushup') ||
        dbNameLower.includes('plank') ||
        dbNameLower.includes('dip') ||
        dbNameLower.includes('chin-up') ||
        dbNameLower.includes('chinup') ||
        dbNameLower.includes('leg raise') ||
        dbNameLower.includes('hanging leg') ||
        dbNameLower.includes('hyperextension')
      ) {
        return true;
      }
    }
  }

  return false;
};

function ExerciseImage({ thumbnail_url, gif_url, name, equipment_type, isHovered }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);

  const getInitials = (str) => {
    if (!str) return 'EX';
    const cleanStr = str.replace(/[^a-zA-Z0-9\s]/g, '');
    const parts = cleanStr.trim().split(/\s+/);
    if (parts.length === 0) return 'EX';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const showFallback = !thumbnail_url || thumbFailed;

  if (showFallback) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: 'rgba(18, 18, 24, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        color: 'var(--text-muted)',
        position: 'absolute', top: 0, left: 0
      }}>
        <Dumbbell size={20} style={{ color: 'var(--primary)', opacity: 0.6 }} />
        <div style={{ 
          fontSize: '20px', 
          fontWeight: '900', 
          fontFamily: 'var(--font-display)',
          color: 'var(--text-main)',
          opacity: 0.95 
        }}>
          {getInitials(name)}
        </div>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '700', opacity: 0.5 }}>
          {equipment_type || 'Exercise'}
        </span>
      </div>
    );
  }

  return (
    <>
      <img
        src={thumbnail_url}
        alt={name}
        onError={() => setThumbFailed(true)}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          zIndex: 1
        }}
      />
      {gif_url && !gifFailed && (
        <img
          src={gif_url}
          alt={`${name} animation`}
          onError={() => setGifFailed(true)}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            zIndex: 2,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out'
          }}
        />
      )}
    </>
  );
}

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');
  const t = (key) => TRANSLATIONS[lang][key] || key;

  useEffect(() => {
    localStorage.setItem('appLang', lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';

    setChatMessages(prev => {
      if (prev.length === 1 && (prev[0].text === enTranslations.chatInitialMessage || prev[0].text === faTranslations.chatInitialMessage)) {
        const newChat = [...prev];
        newChat[0] = { ...newChat[0], text: TRANSLATIONS[lang].chatInitialMessage };
        localStorage.setItem('chatMessages', JSON.stringify(newChat));
        return newChat;
      }
      return prev;
    });
  }, [lang]);

  const [activeTab, setActiveTab] = useState('onboarding');
  
  // Experience & Flow State
  const [experienceLevel, setExperienceLevel] = useState(() => {
    return localStorage.getItem('experienceLevel') || 'unselected';
  });

  const [knownMovements, setKnownMovements] = useState(() => {
    const saved = localStorage.getItem('knownMovements');
    if (saved) return JSON.parse(saved);
    return {};
  });

  // State 1: Baseline Strength
  const [baselineExercises, setBaselineExercises] = useState(() => {
    const saved = localStorage.getItem('baselineExercises');
    if (saved && localStorage.getItem('experienceLevel')) {
      const parsed = JSON.parse(saved);
      // Migrate older data by looking up missing categories
      return parsed.map(ex => {
        if (!ex.category) {
          const match = exercisesDb.find(e => e.name_en === ex.name);
          if (match) {
            return { ...ex, category: match.category };
          }
        }
        return ex;
      });
    }
    return [];
  });

  const [swapModalState, setSwapModalState] = useState(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState('');
  const [beginnerLogModal, setBeginnerLogModal] = useState(null); // { exercise: Object }
  const [beginnerLogWeight, setBeginnerLogWeight] = useState('');
  const [beginnerLogReps, setBeginnerLogReps] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // State 2: Active Mesocycle State
  const [mesocycle, setMesocycle] = useState(() => {
    const saved = localStorage.getItem('mesocycle');
    if (saved) return JSON.parse(saved);
    return null; // Empty on start, initialized via baseline
  });

  // Workout logging states for current week
  const [weeklyFeedback, setWeeklyFeedback] = useState({});
  const [isSystemFatigued, setIsSystemFatigued] = useState(false);

  // State 3: Local JSON Database (Synced from AI outputs)
  const [dbState, setDbState] = useState(() => {
    const saved = localStorage.getItem('dbState');
    if (saved) return JSON.parse(saved);
    return null;
  });

  // State 4: Mock AI Personal Trainer Chat State
  const [chatMessages, setChatMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) return JSON.parse(saved);
    
    const initialLang = localStorage.getItem('appLang') || 'en';
    const initText = initialLang === 'fa' ? faTranslations.chatInitialMessage : enTranslations.chatInitialMessage;
    
    return [
      {
        sender: 'ai',
        text: initText,
        timestamp: new Date().toLocaleTimeString()
      }
    ];
  });
  
  const [chatInput, setChatInput] = useState('');
  const [rawJsonPaste, setRawJsonPaste] = useState('');
  const [syncFeedback, setSyncFeedback] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredExerciseId, setHoveredExerciseId] = useState(null);

  const getMuscleMatchStatus = (ex) => {
    if (!selectedMuscle) return 'all'; // Show all if nothing selected
    
    // Check primary muscle
    if (ex.primary_muscle === selectedMuscle) return 'primary';
    
    // Check secondary muscles
    if (ex.secondary_muscles && Array.isArray(ex.secondary_muscles)) {
      if (ex.secondary_muscles.includes(selectedMuscle)) return 'secondary';
    }
    
    return null;
  };

  const matchesSearch = (ex) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameEn = (ex.name_en || '').toLowerCase();
    const nameFa = (ex.name_fa || '').toLowerCase();
    const equip = (ex.equipment_type || '').toLowerCase();
    return nameEn.includes(query) || nameFa.includes(query) || equip.includes(query);
  };

  const filteredDb = exercisesDb.filter(ex => matchesSearch(ex));
  const primaryExercises = filteredDb.filter(ex => getMuscleMatchStatus(ex) === 'primary' || getMuscleMatchStatus(ex) === 'all');
  const secondaryExercises = selectedMuscle ? filteredDb.filter(ex => getMuscleMatchStatus(ex) === 'secondary') : [];

  const renderExerciseCard = (ex, isSecondary = false) => {
    const isHovered = hoveredExerciseId === ex.id;
    return (
      <div 
        key={ex.id}
        className="card"
        style={{ 
          padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', 
          transition: 'transform 0.2s, box-shadow 0.2s',
          opacity: isSecondary ? 0.85 : 1
        }}
        onMouseEnter={(e) => { 
          setHoveredExerciseId(ex.id);
          e.currentTarget.style.transform = 'translateY(-2px)'; 
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4)'; 
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; 
        }}
        onMouseLeave={(e) => { 
          setHoveredExerciseId(null);
          e.currentTarget.style.transform = 'none'; 
          e.currentTarget.style.boxShadow = 'none'; 
          e.currentTarget.style.borderColor = 'var(--border-color)'; 
        }}
        onClick={() => setBeginnerLogModal({ exercise: ex })}
      >
        <div style={{ 
          height: '140px', borderRadius: '8px', overflow: 'hidden', 
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(30, 41, 59, 0.5))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', border: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          <ExerciseImage 
            thumbnail_url={ex.thumbnail_url}
            gif_url={ex.gif_url}
            name={ex.name_en || ex.name}
            equipment_type={ex.equipment_type}
            isHovered={isHovered}
          />

          {isSecondary && (
            <div style={{
              position: 'absolute', top: '8px', right: '8px', 
              background: 'rgba(0,0,0,0.75)', color: 'var(--text-muted)', 
              padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              zIndex: 3
            }}>
              Stabilizer
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>{ex.category}</div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>{lang === 'fa' ? ex.name_fa : ex.name_en}</div>
        </div>
      </div>
    );
  };

  // Calorie & Macro calculator state (Nutrition tab)
  const [bodyweight, setBodyweight] = useState(() => parseFloat(localStorage.getItem('nutrition_bw')) || 80);
  const [height, setHeight] = useState(() => parseFloat(localStorage.getItem('nutrition_height')) || 175);
  const [age, setAge] = useState(() => parseInt(localStorage.getItem('nutrition_age')) || 25);
  const [biologicalSex, setBiologicalSex] = useState(() => localStorage.getItem('nutrition_sex') || 'M');
  const [activityLevel, setActivityLevel] = useState(() => localStorage.getItem('nutrition_activity') || '1.55');
  const [activityGoal, setActivityGoal] = useState(() => localStorage.getItem('nutrition_goal') || 'hypertrophy');
  const [savedMacros, setSavedMacros] = useState(() => {
    const saved = localStorage.getItem('savedMacros');
    return saved ? JSON.parse(saved) : null;
  });

  const calculateMacros = () => {
    let bmr = 10 * bodyweight + 6.25 * height - 5 * age;
    bmr += (biologicalSex === 'M') ? 5 : -161;
    let tdee = bmr * parseFloat(activityLevel);
    if (activityGoal === 'hypertrophy') tdee += 300; 
    const protein = bodyweight * 2.2;
    const fat = bodyweight * 0.8;
    const carbs = (tdee - (protein * 4 + fat * 9)) / 4;
    return { tdee: Math.round(tdee), protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs) };
  };

  const macros = calculateMacros();

  const handleSaveMacros = () => {
    localStorage.setItem('nutrition_bw', bodyweight);
    localStorage.setItem('nutrition_height', height);
    localStorage.setItem('nutrition_age', age);
    localStorage.setItem('nutrition_sex', biologicalSex);
    localStorage.setItem('nutrition_activity', activityLevel);
    localStorage.setItem('nutrition_goal', activityGoal);
    localStorage.setItem('savedMacros', JSON.stringify(macros));
    setSavedMacros(macros);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Persist state to localstorage
  useEffect(() => {
    localStorage.setItem('experienceLevel', experienceLevel);
  }, [experienceLevel]);

  useEffect(() => {
    localStorage.setItem('knownMovements', JSON.stringify(knownMovements));
  }, [knownMovements]);

  useEffect(() => {
    localStorage.setItem('baselineExercises', JSON.stringify(baselineExercises));
  }, [baselineExercises]);

  useEffect(() => {
    if (mesocycle) {
      localStorage.setItem('mesocycle', JSON.stringify(mesocycle));
    }
  }, [mesocycle]);

  useEffect(() => {
    if (dbState) {
      localStorage.setItem('dbState', JSON.stringify(dbState));
    }
  }, [dbState]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Handlers for Onboarding & Experience Setup
  const handleSelectExperience = (level) => {
    setExperienceLevel(level);
    if (level === 'unselected') return;
    
    if (level === 'beginner') {
      setBaselineExercises([]);
    } else {
      const template = BASELINE_TEMPLATES[level] || BASELINE_TEMPLATES['intermediate'];
      setBaselineExercises(template.map(m => ({
        ...m,
        weight: '',
        reps: '',
        e1rm: 0
      })));
    }
    setKnownMovements({});
  };

  const handleSaveBeginnerLog = () => {
    if (!beginnerLogModal || !beginnerLogReps) return;
    
    const exerciseName = beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name;
    const isBodyweight = checkIsBodyweight(exerciseName, beginnerLogModal.exercise.equipment_type);
    if (!isBodyweight && !beginnerLogWeight) return;

    const weightVal = parseFloat(beginnerLogWeight) || 0;
    const repsVal = parseInt(beginnerLogReps) || 0;
    
    // Determine if this is a rep-based PR (bodyweight exercise with zero/empty added weight logged)
    const isRepBasedPR = isBodyweight && weightVal === 0;

    const e1rm = calculateE1RM(weightVal, repsVal, isRepBasedPR);
    const newEx = {
      name: exerciseName,
      category: beginnerLogModal.exercise.category,
      weight: weightVal,
      reps: repsVal,
      e1rm: e1rm,
      isRepBasedPR: isRepBasedPR
    };

    // Update or push into baselineExercises
    setBaselineExercises(prev => {
      const idx = prev.findIndex(p => p.name === newEx.name);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newEx;
        return copy;
      }
      return [...prev, newEx];
    });

    setBeginnerLogModal(null);
    setBeginnerLogWeight('');
    setBeginnerLogReps('');
    
    // Show success toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleToggleKnown = (exName) => {
    setKnownMovements(prev => ({
      ...prev,
      [exName]: !prev[exName]
    }));
  };

  const handleUpdateBaselineEx = (idx, field, value) => {
    const updated = [...baselineExercises];
    updated[idx][field] = value;
    
    // Recalculate e1rm if weight and reps are present
    if (field === 'weight' || field === 'reps') {
       updated[idx].e1rm = calculateE1RM(updated[idx].weight, updated[idx].reps);
    }
    
    setBaselineExercises(updated);
  };

  const handleSwapClick = (idx, category) => {
    setSwapModalState({ idx, category });
    setSwapSearchQuery('');
  };

  const executeSwap = (newExDetails) => {
    if (!swapModalState) return;
    const updated = [...baselineExercises];
    
    const newName = newExDetails.name_en;
    
    updated[swapModalState.idx] = {
      ...updated[swapModalState.idx],
      name: newName,
      category: newExDetails.category,
      weight: '',
      reps: '',
      e1rm: 0
    };
    
    // Clear known movement toggle for this specific index if it changed
    setKnownMovements(prev => {
      const copy = { ...prev };
      delete copy[newName]; // We don't know the new weight
      return copy;
    });

    setBaselineExercises(updated);
    setSwapModalState(null);
  };

  const handleRemoveExercise = (exName) => {
    setBaselineExercises(prev => prev.filter(ex => ex.name !== exName));
    setKnownMovements(prev => {
      const copy = { ...prev };
      delete copy[exName];
      return copy;
    });
  };


  // Initialize Week 1 Mesocycle from Baselines
  const handleInitializeMesocycle = async () => {
    setIsGeneratingPlan(true);
    setGenerationError(null);

    const baselinesForAi = baselineExercises.map(ex => ({
      name: ex.name,
      weight: ex.weight || null,
      reps: ex.reps || null,
      e1rm: ex.e1rm || null,
      category: ex.category
    }));

    const preferencesForAi = {
      experienceLevel,
      bodyweight,
      activityGoal,
      language: lang,
      exclusions: ["oatmeal", "kashk"]
    };

    try {
      const result = await generateMesocyclePlan(baselinesForAi, preferencesForAi);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Received invalid response from the AI coaching engine.");
      }

      const payload = result.data;
      if (!payload.mesocycle || !payload.mesocycle.exercises) {
        throw new Error("The AI response did not contain a valid mesocycle structure.");
      }

      const weekNum = payload.mesocycle.week || 1;
      const parsedWeeklyExercises = payload.mesocycle.exercises.map((ex, idx) => ({
        name: ex.name || `Exercise ${idx + 1}`,
        target_sets: Number(ex.sets) || 3,
        base_weight_kg: ex.load || 'Calibration',
        target_reps_range: ex.reps || '8-12'
      }));

      const newMeso = {
        week: weekNum,
        exercises: parsedWeeklyExercises,
        history: []
      };

      setMesocycle(newMeso);

      const initialDb = {
        action: payload.action || 'CREATE_PLAN_OR_UPDATE_WEEK',
        mesocycle_week: weekNum,
        adjustments: {
          volume_change: 'HOLD',
          reason: lang === 'fa' 
            ? 'برنامه اولیه بر اساس تحلیل هوش مصنوعی از رکوردهای پایه شما فرموله‌سازی شد.' 
            : 'Initial program built using scientific AI personalization.'
        },
        exercises: parsedWeeklyExercises
      };
      setDbState(initialDb);

      const initialFeedback = {};
      parsedWeeklyExercises.forEach(ex => {
        initialFeedback[ex.name] = 'HARD_1_2_LEFT';
      });
      setWeeklyFeedback(initialFeedback);

      // Bot summary message
      const botMsg = lang === 'fa'
        ? `### برنامه هفته اول بلوک تمرینی شما آماده شد 🏋️‍♂️📈\n\nامیر عزیز، برنامه هفته اول شما توسط مربی هوش مصنوعی بر اساس رکوردهایتان طراحی شد! ساختار شروع شما به این صورت است:\n\n${formatExercisesToMarkdownTable(parsedWeeklyExercises)}\n\nبرای ثبت میزان خستگی و پیشرفت خود، به تب **پیگیری تمرین** مراجعه کنید.`
        : `### Mesocycle Week 1 Formulated 🏋️‍♂️📈\n\nAmir, your Week 1 program has been formulated by your AI Personal Trainer! Here is your starting structure:\n\n${formatExercisesToMarkdownTable(parsedWeeklyExercises)}\n\nCheck out the **Workout & Progression** tab to log your exertion feedback as you complete workouts!`;

      appendBotMessage(botMsg, initialDb);
      setIsGeneratingPlan(false);
      setActiveTab('workout');

    } catch (err) {
      console.error("Failed to generate AI plan:", err);
      setGenerationError(err.message || "An unexpected error occurred during plan generation.");
      setIsGeneratingPlan(false);
    }
  };

  // Fallback Local Calibration Initializer (Runs offline/on API failure)
  const handleLocalFallback = () => {
    setGenerationError(null);
    setIsGeneratingPlan(false);

    let reasonText = '';
    const defaultWeeklyExercises = baselineExercises.map(ex => {
      let baseWeight;
      
      const isBeginner = experienceLevel === 'beginner';
      const isUnknownExperienced = experienceLevel === 'experienced' && !knownMovements[ex.name];
      
      if (isBeginner || isUnknownExperienced || !ex.e1rm) {
        baseWeight = 'Calibration';
        reasonText = 'Calibration Week initialized. Weights are left blank to discover optimal loading. Log your exertion after the workout to auto-calculate your baseline for Week 2.';
      } else {
        const isRepBased = ex.isRepBasedPR || (checkIsBodyweight(ex.name) && (ex.weight === 0 || !ex.weight));
        baseWeight = isRepBased ? 0 : Math.round((ex.e1rm * 0.70) * 2) / 2;
        if (!reasonText) reasonText = 'Initial program built using baseline estimated 1RM calculations.';
      }

      return {
        name: ex.name,
        target_sets: 3,
        base_weight_kg: baseWeight,
        target_reps_range: '8-12'
      };
    });

    const newMeso = {
      week: 1,
      exercises: defaultWeeklyExercises,
      history: []
    };

    setMesocycle(newMeso);

    const initialDb = {
      action: 'CREATE_PLAN_OR_UPDATE_WEEK',
      mesocycle_week: 1,
      adjustments: {
        volume_change: 'HOLD',
        reason: reasonText
      },
      exercises: defaultWeeklyExercises
    };
    setDbState(initialDb);

    const initialFeedback = {};
    defaultWeeklyExercises.forEach(ex => {
      initialFeedback[ex.name] = 'HARD_1_2_LEFT';
    });
    setWeeklyFeedback(initialFeedback);

    const botMsg = lang === 'fa'
      ? `### برنامه هفته اول بلوک تمرینی شما آماده شد (سیستم محلی) 🏋️‍♂️📈\n\nامیر عزیز، برنامه هفته اول شما با محاسبات محلی طراحی شد:\n\n${formatExercisesToMarkdownTable(defaultWeeklyExercises)}\n\nبرای شروع به تب **پیگیری تمرین** بروید.`
      : `### Mesocycle Week 1 Formulated (Offline Local Engine) 🏋️‍♂️📈\n\nAmir, your Week 1 program has been initialized based on your baseline movements! Here is your starting structure:\n\n${formatExercisesToMarkdownTable(defaultWeeklyExercises)}\n\nCheck out the **Workout & Progression** tab to log your exertion feedback as you complete workouts!`;

    appendBotMessage(botMsg, initialDb);
    setActiveTab('workout');
  };

  // Autoregulate & Advance Week
  const handleResetMesocycle = () => {
    if (window.confirm("Are you sure you want to delete this current cycle and start over? All logged progress for this block will be lost.")) {
      setMesocycle(null);
      setDbState(null);
      setActiveTab('onboarding');
    }
  };

  const handleHardReset = () => {
    if (window.confirm("DANGER: Are you sure you want to completely erase all data, including your strength baselines, and reset the app? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleAutoregulateWeek = () => {
    if (!mesocycle) return;

    // Calculate average RIR across all exercises
    let totalRir = 0;
    const rirList = mesocycle.exercises.map(ex => {
      const feedback = weeklyFeedback[ex.name] || 'HARD_1_2_LEFT';
      return mapExertionToRIR(feedback);
    });
    const avgRir = rirList.reduce((a, b) => a + b, 0) / rirList.length;

    // Determine volume adjustments
    const adjResult = determineVolumeAdjustment(avgRir, isSystemFatigued);

    // Scale exercises based on volume recommendation
    const nextWeekExercises = mesocycle.exercises.map(ex => {
      let newSets = ex.target_sets;
      let newWeight = ex.base_weight_kg;

      if (adjResult.volumeChange === 'INCREASE') {
        newSets = Math.min(ex.target_sets + 1, 6); // Cap sets at 6
        newWeight = Math.round((ex.base_weight_kg * 1.025) * 2) / 2; // Incremental weight progression (2.5%)
      } else if (adjResult.volumeChange === 'DECREASE') {
        newSets = Math.max(ex.target_sets - 1, 2); // Floor sets at 2
        // Hold weight
      } else {
        // HOLD volume
        newWeight = Math.round((ex.base_weight_kg * 1.015) * 2) / 2; // Minor incremental weight progression
      }

      return {
        ...ex,
        target_sets: newSets,
        base_weight_kg: newWeight
      };
    });

    const nextWeek = mesocycle.week + 1;
    const updatedMeso = {
      ...mesocycle,
      week: nextWeek,
      exercises: nextWeekExercises,
      history: [
        ...mesocycle.history,
        {
          week: mesocycle.week,
          exercises: mesocycle.exercises,
          feedback: weeklyFeedback,
          fatigue: isSystemFatigued
        }
      ]
    };

    setMesocycle(updatedMeso);

    // Sync database representation
    const updatedDb = {
      action: 'CREATE_PLAN_OR_UPDATE_WEEK',
      mesocycle_week: nextWeek,
      adjustments: {
        volume_change: adjResult.volumeChange,
        reason: adjResult.reason
      },
      exercises: nextWeekExercises
    };
    setDbState(updatedDb);

    // Reset weekly feedback inputs
    const newFeedback = {};
    nextWeekExercises.forEach(ex => {
      newFeedback[ex.name] = 'HARD_1_2_LEFT';
    });
    setWeeklyFeedback(newFeedback);
    setIsSystemFatigued(false);

    // Push bot message
    appendBotMessage(`### Autoregulation Applied: Week ${nextWeek} ⚡️\n\nCompleted training cycle analysis for Week ${mesocycle.week}. \n\n**Autoregulation Insights:**\n- Average Reps in Reserve (RIR): \`${avgRir.toFixed(1)}\`\n- Fatigue Alert: \`${isSystemFatigued ? 'HIGH' : 'NORMAL'}\`\n- Decision: **${adjResult.volumeChange}** Volume\n- Reason: *${adjResult.reason}*\n\nHere is your new structure for Week ${nextWeek}:\n\n${formatExercisesToMarkdownTable(nextWeekExercises)}`, updatedDb);

    setActiveTab('chat');
  };

  // Directly parse a raw pasted JSON block and sync to DB / dashboard state
  const handleDirectJsonSync = () => {
    try {
      const parsed = JSON.parse(rawJsonPaste);
      if (!parsed.action || !parsed.mesocycle_week || !parsed.exercises) {
        setSyncFeedback('❌ Invalid schema: Must contain action, mesocycle_week, and exercises array.');
        return;
      }

      setDbState(parsed);
      
      // Update workout dashboard to match synced DB
      setMesocycle(prevMeso => {
        const history = prevMeso ? prevMeso.history : [];
        return {
          week: parsed.mesocycle_week,
          exercises: parsed.exercises,
          history
        };
      });

      // Update workout feedbacks
      const newFeedback = {};
      parsed.exercises.forEach(ex => {
        newFeedback[ex.name] = 'HARD_1_2_LEFT';
      });
      setWeeklyFeedback(newFeedback);

      setSyncFeedback('✅ Synced successfully! Dashboard and active plan updated.');
      setRawJsonPaste('');
      setTimeout(() => setSyncFeedback(''), 4000);
    } catch (err) {
      setSyncFeedback('❌ JSON Parse Error: ' + err.message);
    }
  };

  // Helper: Append bot chat message
  const appendBotMessage = (markdownContent, jsonPayload = null) => {
    let finalMsg = markdownContent;
    if (jsonPayload) {
      finalMsg += `\n\n\`\`\`json\n${JSON.stringify(jsonPayload, null, 2)}\n\`\`\``;
    }
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: finalMsg,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Formats exercises into a markdown table string
  const formatExercisesToMarkdownTable = (exercises) => {
    let table = `| Exercise Name | Target Sets | Weight (kg) | Target Reps |\n`;
    table += `| :--- | :---: | :---: | :---: |\n`;
    exercises.forEach(ex => {
      table += `| ${ex.name} | ${ex.target_sets} | ${ex.base_weight_kg} kg | ${ex.target_reps_range} |\n`;
    });
    return table;
  };

  // Handle custom user chat message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');

    // Append User Message and an initial loading state
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        sender: 'ai',
        text: lang === 'fa' ? 'مربی در حال بررسی است...' : 'Coach is analyzing...',
        timestamp: new Date().toLocaleTimeString(),
        isLoading: true
      }
    ]);

    // Construct context
    const currentContext = {
      dbState: dbState,
      mesocycle: mesocycle,
      knownMovements: knownMovements,
    };

    const aiResult = await sendChatMessage(userText, currentContext, lang);

    // Replace the loading message with the actual response
    setChatMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      
      if (aiResult.success && aiResult.data && aiResult.data.reply) {
        newMessages[lastIndex] = {
          sender: 'ai',
          text: aiResult.data.reply,
          timestamp: new Date().toLocaleTimeString()
        };
      } else {
        newMessages[lastIndex] = {
          sender: 'ai',
          text: lang === 'fa' 
            ? `❌ خطا در ارتباط با مربی: ${aiResult.error}` 
            : `❌ Connection error: ${aiResult.error}`,
          timestamp: new Date().toLocaleTimeString()
        };
      }
      return newMessages;
    });
  };

  // Custom JSX renderer for Markdown elements (Headings, Alerts, Tables)
  const renderMessageContent = (msgText) => {
    // Separate markdown text from the JSON block
    const parts = msgText.split('```json');
    const mdText = parts[0];
    const jsonBlock = parts[1] ? parts[1].replace('```', '').trim() : null;

    const lines = mdText.split('\n');
    let renderedElements = [];
    let inTable = false;
    let tableHeaders = [];
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table parsing
      if (line.startsWith('|')) {
        inTable = true;
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (line.includes('---')) {
          // Alignment row - skip
          continue;
        }
        if (tableHeaders.length === 0) {
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        // Render completed table
        renderedElements.push(
          <div key={`table-${i}`} className="table-container" style={{ margin: '12px 0' }}>
            <table className="workout-table">
              <thead>
                <tr>
                  {tableHeaders.map((th, hIdx) => <th key={hIdx}>{th}</th>)}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Headings
      if (line.startsWith('###')) {
        renderedElements.push(<h3 key={i} style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '18px', marginTop: '16px', marginBottom: '8px', fontWeight: 'bold' }}>{line.replace('###', '').trim()}</h3>);
      } else if (line.startsWith('####')) {
        renderedElements.push(<h4 key={i} style={{ color: 'var(--text-main)', fontFamily: 'var(--font-display)', fontSize: '15px', marginTop: '12px', marginBottom: '6px', fontWeight: '600' }}>{line.replace('####', '').trim()}</h4>);
      } else if (line.startsWith('> [!CAUTION]') || line.startsWith('> [!IMPORTANT]')) {
        // Alert heading
        renderedElements.push(
          <div key={i} className="badge badge-accent" style={{ display: 'flex', gap: '6px', margin: '8px 0 4px 0' }}>
            <AlertTriangle size={14} />
            <strong>CRITICAL RESTRICTION</strong>
          </div>
        );
      } else if (line.startsWith('>') && line.includes('NO')) {
        // Alert content
        renderedElements.push(
          <p key={i} style={{ color: 'var(--danger)', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '2px solid var(--danger)', marginBottom: '8px' }}>
            {line.replace('>', '').trim()}
          </p>
        );
      } else if (line.startsWith('- ')) {
        // Bullet list
        renderedElements.push(<li key={i} style={{ marginLeft: '16px', fontSize: '14px', listStyleType: 'square' }}>{line.replace('- ', '')}</li>);
      } else if (line) {
        // Standard text, handle basic bold highlights **text**
        const parts = line.split('**');
        if (parts.length > 1) {
          renderedElements.push(
            <p key={i} style={{ margin: '6px 0', fontSize: '14px' }}>
              {parts.map((p, idx) => idx % 2 === 1 ? <strong key={idx} style={{ color: 'var(--primary)' }}>{p}</strong> : p)}
            </p>
          );
        } else {
          renderedElements.push(<p key={i} style={{ margin: '6px 0', fontSize: '14px' }}>{line}</p>);
        }
      }
    }

    // Render trailing tables
    if (tableHeaders.length > 0) {
      renderedElements.push(
        <div key="table-end" className="table-container" style={{ margin: '12px 0' }}>
          <table className="workout-table">
            <thead>
              <tr>
                {tableHeaders.map((th, hIdx) => <th key={hIdx}>{th}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="md-content">
        {renderedElements}
        
        {jsonBlock && (
          <div style={{ marginTop: '16px', background: '#090a0d', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>database_sync_payload.json</span>
              <button 
                onClick={() => {
                  setRawJsonPaste(jsonBlock);
                  setActiveTab('chat');
                  // Quick scroll to the db direct sync box or click it immediately
                  setTimeout(() => {
                    document.getElementById('sync-trigger-btn')?.click();
                  }, 100);
                }}
                className="btn btn-primary"
                style={{ padding: '4px 8px', fontSize: '11px', height: '24px', borderRadius: '4px' }}
              >
                {t('syncToActiveProgram')}
              </button>
            </div>
            <pre style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', overflowX: 'auto', background: '#000', padding: '8px', borderRadius: '4px', color: '#10b981' }}>
              {jsonBlock}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header Bar */}
      <header className="header">
        <div className="container header-content">
          <div className="logo-section">
            <div className="logo-icon">RP</div>
            <div className="logo-text">HYPERTROPHY<span>.ai</span></div>
          </div>

          <nav className="nav-tabs">
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            >
              <Activity size={16} /> {t('baselines')}
            </button>
            <button 
              onClick={() => setActiveTab('workout')}
              className={`tab-btn ${activeTab === 'workout' ? 'active' : ''}`}
            >
              <Dumbbell size={16} /> {t('workoutTracker')}
            </button>
            <button 
              onClick={() => setActiveTab('nutrition')}
              className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
            >
              <Apple size={16} /> {t('nutrition')}
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <MessageSquare size={16} /> {t('aiTrainer')}
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User size={16} /> {t('profile')}
            </button>
          </nav>

          <div style={{ marginInlineStart: '16px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setLang(lang === 'en' ? 'fa' : 'en')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 'bold' }}
            >
              {lang === 'en' ? 'FA' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="container">
          
          {/* Tab 1: Baselines & Onboarding */}
          {activeTab === 'onboarding' && (
            <div className="grid-two-cols">
              {experienceLevel === 'unselected' ? (
                <div style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                  <h2 className="section-title">{t('welcome')}</h2>
                  <p className="section-subtitle">{t('welcomeSub')}</p>
                  
                  <div className="grid-two-cols" style={{ marginTop: '40px' }}>
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleSelectExperience('beginner')}>
                      <Dumbbell size={48} style={{ color: 'var(--primary)', margin: '0 auto 20px' }} />
                      <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{t('absBeginner')}</h3>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>{t('absBeginnerDesc')}</p>
                    </div>
                    
                    <div className="card" style={{ cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleSelectExperience('experienced')}>
                      <TrendingUp size={48} style={{ color: 'var(--accent)', margin: '0 auto 20px' }} />
                      <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{t('expLifter')}</h3>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>{t('expLifterDesc')}</p>
                    </div>
                  </div>
                </div>
              ) : (
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
                      {baselineExercises.length > 0 
                        ? 'We\'ve pre-selected a dynamic template for your experience level. Check the box if you know your heavy weight for the movement. If unchecked, you can click "Swap" to pick an alternative, or leave it unchecked to mark it for a "Calibration Week". You can also browse the Interactive Body Map below to add more movements!'
                        : 'To build your custom baseline, scroll down to the Interactive Exercise Library, select a muscle group, and log the movements you remember doing recently. Or just click Initialize Plan to start fresh!'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {baselineExercises.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '32px 16px', 
                          background: 'rgba(255, 255, 255, 0.01)', 
                          border: '1px dashed var(--border-color)', 
                          borderRadius: '8px',
                          color: 'var(--text-muted)'
                        }}>
                          <Dumbbell size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '12px' }} />
                          <p style={{ margin: 0, fontSize: '14px' }}>
                            {lang === 'fa' 
                              ? 'هنوز حرکتی به رکورد پایه خود اضافه نکرده‌اید. برای شروع یک گروه عضلانی را از پایین انتخاب کنید!' 
                              : 'No exercises added to your baseline yet. Select a muscle group below to add some!'}
                          </p>
                        </div>
                      ) : (
                        baselineExercises.map((ex, idx) => {
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
                              {/* Header: Name, Category, Swap and Remove */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{ex.name}</h4>
                                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>{ex.category}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  {ex.category && (
                                    <button 
                                      onClick={() => handleSwapClick(idx, ex.category)}
                                      className="btn btn-secondary"
                                      style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255, 255, 255, 0.05)', border: 'none' }}
                                    >
                                      <RefreshCw size={14} /> Swap
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRemoveExercise(ex.name)}
                                    className="btn btn-secondary"
                                    style={{ 
                                      padding: '6px 12px', 
                                      fontSize: '12px', 
                                      background: 'rgba(239, 68, 68, 0.05)', 
                                      border: '1px solid rgba(239, 68, 68, 0.15)',
                                      color: 'rgba(239, 68, 68, 0.85)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s',
                                      cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                                      e.currentTarget.style.color = '#ef4444';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                                      e.currentTarget.style.color = 'rgba(239, 68, 68, 0.85)';
                                    }}
                                  >
                                    <TrashIcon size={14} /> {lang === 'fa' ? 'حذف' : 'Remove'}
                                  </button>
                                </div>
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
                                      {(() => {
                                        const exIsDumbbell = checkIsDumbbell(ex.name);
                                        const exIsAssisted = checkIsAssisted(ex.name);
                                        const exIsBodyweight = checkIsBodyweight(ex.name);
                                        return (
                                          <input 
                                            type="number" 
                                            placeholder={lang === 'fa' 
                                              ? (exIsDumbbell ? "وزن/دست" : (exIsAssisted ? "وزن کمکی" : (exIsBodyweight ? "وزن اضافی" : "وزن"))) 
                                              : (exIsDumbbell ? "Wt/Hand" : (exIsAssisted ? "Assist Wt" : (exIsBodyweight ? "Added Wt" : "Weight")))} 
                                            value={ex.weight} 
                                            onChange={(e) => handleUpdateBaselineEx(idx, 'weight', parseFloat(e.target.value) || 0)}
                                            style={{ width: '80px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none' }}
                                          />
                                        );
                                      })()}
                                      <span style={{ color: 'var(--text-muted)' }}>kg ×</span>
                                      {(() => {
                                        const exIsUnilateral = checkIsUnilateral(ex.name);
                                        return (
                                          <input 
                                            type="number" 
                                            placeholder={lang === 'fa' 
                                              ? (exIsUnilateral ? "تکرار/طرف" : "تکرار") 
                                              : (exIsUnilateral ? "Reps/side" : "Reps")} 
                                            value={ex.reps} 
                                            onChange={(e) => handleUpdateBaselineEx(idx, 'reps', parseInt(e.target.value) || 0)}
                                            style={{ width: '70px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', outline: 'none' }}
                                          />
                                        );
                                      })()}
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
                        })
                      )}
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
                        <style>{`
                          @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        `}</style>
                        <h3 style={{ marginBottom: '8px', fontSize: '22px' }}>{beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name}</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>What did you lift today?</p>
                        
                        {/* Looping exercise animation GIF / Fallback */}
                        <div style={{
                          height: '220px', borderRadius: '12px', overflow: 'hidden',
                          marginBottom: '24px',
                          position: 'relative',
                          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(30, 41, 59, 0.5))',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <ExerciseImage 
                            thumbnail_url={beginnerLogModal.exercise.thumbnail_url}
                            gif_url={beginnerLogModal.exercise.gif_url}
                            name={beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name}
                            equipment_type={beginnerLogModal.exercise.equipment_type}
                            isHovered={true}
                          />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                          <div style={{ flex: 1 }}>
                            {(() => {
                              const exerciseName = beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name;
                              const isDumbbell = checkIsDumbbell(exerciseName);
                              const isAssisted = checkIsAssisted(exerciseName);
                              const isBodyweight = checkIsBodyweight(exerciseName, beginnerLogModal.exercise.equipment_type);
                              return (
                                <label className="form-label">
                                  {lang === 'fa' 
                                    ? (isAssisted ? "وزن کمکی (کیلوگرم)" : (isDumbbell ? "وزن هر دست (کیلوگرم)" : (isBodyweight ? "وزن اضافی (کیلوگرم)" : "وزن (کیلوگرم)"))) 
                                    : (isAssisted ? "Assisted Weight (kg)" : (isDumbbell ? "Weight per hand (kg)" : (isBodyweight ? "Added Weight (kg)" : "Weight (kg)")))}
                                </label>
                              );
                            })()}
                            {(() => {
                              const exerciseName = beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name;
                              const isBodyweight = checkIsBodyweight(exerciseName, beginnerLogModal.exercise.equipment_type);
                              return (
                                <input 
                                  type="number" 
                                  className="form-input" 
                                  placeholder={isBodyweight ? "e.g. 0" : "e.g. 40"}
                                  value={beginnerLogWeight}
                                  onChange={(e) => setBeginnerLogWeight(e.target.value)}
                                  style={{ fontSize: '24px', padding: '16px', textAlign: 'center' }}
                                />
                              );
                            })()}
                          </div>
                          <div style={{ flex: 1 }}>
                            {(() => {
                              const exerciseName = beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name;
                              const isUnilateral = checkIsUnilateral(exerciseName);
                              return (
                                <label className="form-label">
                                  {lang === 'fa' 
                                    ? (isUnilateral ? "تکرار (هر سمت)" : "تکرار انجام شده") 
                                    : (isUnilateral ? "Reps (per side)" : "Reps Completed")}
                                </label>
                              );
                            })()}
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
                          {(() => {
                            const exerciseName = beginnerLogModal.exercise.name_en || beginnerLogModal.exercise.name;
                            const isBodyweight = checkIsBodyweight(exerciseName, beginnerLogModal.exercise.equipment_type);
                            const canSave = (isBodyweight || beginnerLogWeight) && beginnerLogReps;
                            return (
                              <button 
                                onClick={handleSaveBeginnerLog} 
                                className="btn btn-primary" 
                                style={{ flex: 2, padding: '16px', fontSize: '16px' }}
                                disabled={!canSave}
                              >
                                Save Log
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {swapModalState && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.85)', zIndex: 1000,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)' }}>Swap Exercise</h3>
                      <button onClick={() => setSwapModalState(null)} className="btn btn-secondary" style={{ padding: '4px 8px' }}>Close</button>
                    </div>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <input 
                        type="search" 
                        value={swapSearchQuery}
                        onChange={(e) => setSwapSearchQuery(e.target.value)}
                        placeholder="Search exercises..."
                        style={{
                          width: '100%', padding: '12px', borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)',
                          color: 'var(--text-light)', fontSize: '14px', outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                      {exercisesDb
                        .filter(ex => !swapSearchQuery.trim() || (ex.name_en || '').toLowerCase().includes(swapSearchQuery.toLowerCase()) || (ex.name_fa || '').includes(swapSearchQuery))
                        .map((alt, altIdx) => (
                          <div 
                            key={altIdx} 
                            style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                              padding: '12px', background: 'rgba(255, 255, 255, 0.03)', 
                              border: '1px solid var(--border-color)', borderRadius: '8px' 
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden',
                                position: 'relative', flexShrink: 0,
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(30, 41, 59, 0.5))',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                                <ExerciseImage 
                                  thumbnail_url={alt.thumbnail_url}
                                  gif_url={alt.gif_url}
                                  name={alt.name_en}
                                  equipment_type={alt.equipment_type}
                                  isHovered={false}
                                />
                              </div>
                              <div>
                                <div style={{ fontWeight: '600' }}>{alt.name_en}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alt.category} • {alt.equipment_type}</div>
                              </div>
                            </div>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => executeSwap(alt)}
                              style={{ padding: '6px 16px', fontSize: '12px' }}
                            >
                              Select
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Workout & Autoregulation Tracker */}
          {activeTab === 'workout' && (
            <div>
              {!mesocycle ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Dumbbell size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                  <h2>{t('noActiveMesocycle')}</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                    {t('noActiveMesocycleDesc')}
                  </p>
                  <button onClick={() => setActiveTab('onboarding')} className="btn btn-primary">
                    {t('goToBaselines')}
                  </button>
                </div>
              ) : (
                <div className="grid-two-cols">
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 className="card-title" style={{ marginBottom: 0 }}>
                        <Dumbbell /> {t('activeTrainingLogs')}
                      </h2>
                      <span className="badge badge-primary" style={{ fontSize: '14px', padding: '6px 12px' }}>
                        {t('mesocycleWeek')} {mesocycle.week}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                      {t('completeSetsDesc')}
                    </p>

                    <div className="table-container">
                      <table className="workout-table">
                        <thead>
                          <tr>
                            <th>Exercise Name</th>
                            <th className="nowrap">Sets × Reps</th>
                            <th className="nowrap">Load (kg)</th>
                            <th>Exertion / Feedback</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mesocycle.exercises.map((ex, idx) => (
                            <tr key={idx}>
                              <td><strong>{ex.name}</strong></td>
                              <td>{ex.target_sets} sets × {ex.target_reps_range} reps</td>
                              <td className="nowrap">
                                <span className="badge badge-info">{ex.base_weight_kg} kg</span>
                              </td>
                              <td>
                                <select
                                  value={weeklyFeedback[ex.name] || 'HARD_1_2_LEFT'}
                                  onChange={(e) => {
                                    setWeeklyFeedback({
                                      ...weeklyFeedback,
                                      [ex.name]: e.target.value
                                    });
                                  }}
                                  className="form-select"
                                  style={{ padding: '6px 12px', fontSize: '13px' }}
                                >
                                  <option value="CANT_DO_MORE">Couldn't do a single more rep (RIR 0)</option>
                                  <option value="HARD_1_2_LEFT">Hard, maybe 1 or 2 left (RIR 1-2)</option>
                                  <option value="COMFORTABLE_3_4_LEFT">Comfortable, could do 3-4 more (RIR 3-4)</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Fatigue override toggle */}
                    <div style={{ marginTop: '20px' }}>
                      <div 
                        onClick={() => setIsSystemFatigued(!isSystemFatigued)}
                        className={`toggle-card ${isSystemFatigued ? 'active' : ''}`}
                      >
                        <div className="toggle-label">
                          <span className="toggle-title">Severe Fatigue Alert</span>
                          <span className="toggle-desc">Check this if you are experiencing abnormal muscle soreness or fatigue.</span>
                        </div>
                        <div className="toggle-switch">
                          <div className="toggle-dot"></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                      <button 
                        onClick={handleAutoregulateWeek}
                        className="btn btn-primary btn-block"
                      >
                        <RefreshCw size={16} /> Complete Week & Autoregulate Program
                      </button>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <button 
                        onClick={handleResetMesocycle}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--danger)',
                          fontSize: '13px', fontWeight: '500', cursor: 'pointer', opacity: 0.8,
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <TrashIcon size={14} /> {t('abortCycle')}
                      </button>
                    </div>
                  </div>

                  <div className="card">
                    <h2 className="card-title">
                      <TrendingUp /> Autoregulation & Progression History
                    </h2>
                    {mesocycle.history.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
                        No completed cycles logged yet. Complete your first week to display history analytics.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {mesocycle.history.map((hist, idx) => (
                          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <strong>Completed Week {hist.week} Logs</strong>
                              <span className="badge badge-accent">
                                System Fatigue: {hist.fatigue ? 'HIGH' : 'NORMAL'}
                              </span>
                            </div>
                            <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {hist.exercises.map((ex, eIdx) => (
                                <li key={eIdx}>
                                  {ex.name}: {ex.target_sets} sets at {ex.base_weight_kg} kg (Exertion: {hist.feedback[ex.name] || 'HARD_1_2_LEFT'})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Personalized Nutrition Preferences */}
          {activeTab === 'nutrition' && (
            <div className="grid-two-cols">
              <div className="card">
                <h2 className="card-title">
                  <Apple /> {t('nutritionTitle')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  {t('nutritionDesc')}
                </p>

                <div className="diet-list">
                  <div className="diet-item">
                    <div className="diet-icon-ban">
                      <Ban size={16} />
                    </div>
                    <div className="diet-item-content">
                      <span className="diet-item-title" style={{ color: 'var(--danger)' }}>{t('strictExclusions')}</span>
                      <p className="diet-item-desc">{t('strictExclusionsDesc')}</p>
                    </div>
                  </div>

                  <div className="diet-item">
                    <div className="diet-icon-check">
                      <Check size={16} />
                    </div>
                    <div className="diet-item-content">
                      <span className="diet-item-title">{t('breakfastOptions')}</span>
                      <p className="diet-item-desc">
                        {t('breakfast1')}<br />
                        {t('breakfast2')}
                      </p>
                    </div>
                  </div>

                  <div className="diet-item">
                    <div className="diet-icon-check">
                      <Check size={16} />
                    </div>
                    <div className="diet-item-content">
                      <span className="diet-item-title">{t('premiumShake')}</span>
                      <p className="diet-item-desc">{t('premiumShakeDesc')}</p>
                    </div>
                  </div>

                  <div className="diet-item">
                    <div className="diet-icon-check">
                      <Check size={16} />
                    </div>
                    <div className="diet-item-content">
                      <span className="diet-item-title">{t('beverages')}</span>
                      <p className="diet-item-desc">
                        {t('beverage1')}<br />
                        {t('beverage2')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 className="card-title" style={{ marginBottom: 0 }}>
                    <TrendingUp /> {t('macroCalculator')}
                  </h2>
                  <button onClick={handleSaveMacros} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                    <Save size={14} /> Save Macros
                  </button>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bodyweight (kg)</label>
                    <input type="number" value={bodyweight} onChange={(e) => setBodyweight(parseFloat(e.target.value) || 0)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Height (cm)</label>
                    <input type="number" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} className="form-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 0)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Biological Sex</label>
                    <select value={biologicalSex} onChange={(e) => setBiologicalSex(e.target.value)} className="form-select">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Activity Level</label>
                    <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="form-select">
                      <option value="1.2">Sedentary (Little to no exercise)</option>
                      <option value="1.375">Lightly Active (1-3 days/week)</option>
                      <option value="1.55">Moderately Active (3-5 days/week)</option>
                      <option value="1.725">Very Active (6-7 days/week)</option>
                      <option value="1.9">Extra Active (Physical job + training)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('mesocycleGoal')}</label>
                    <select value={activityGoal} onChange={(e) => setActivityGoal(e.target.value)} className="form-select">
                      <option value="hypertrophy">{t('slowHypertrophy')}</option>
                      <option value="maintenance">{t('maintenance')}</option>
                    </select>
                  </div>
                </div>

                <div className="metric-card-grid">
                  <div className="metric-card metric-primary" style={{ gridColumn: '1 / -1' }}>
                    <div className="metric-title">Target Daily Calories</div>
                    <div className="metric-value">{macros.tdee} <span className="metric-unit">kcal</span></div>
                  </div>
                  <div className="metric-card metric-accent">
                    <div className="metric-title">Protein</div>
                    <div className="metric-value">{macros.protein} <span className="metric-unit">g</span></div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Fats</div>
                    <div className="metric-value">{macros.fat} <span className="metric-unit">g</span></div>
                  </div>
                  <div className="metric-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="metric-title">Carbohydrates</div>
                    <div className="metric-value">{macros.carbs} <span className="metric-unit">g</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Interactive Trainer & DB Sync Playground */}
          {/* Tab 4: Interactive Trainer Console */}
          {activeTab === 'chat' && (
            <div className="chat-container" style={{ display: 'flex', justifyContent: 'center' }}>
              
              {/* Center Console */}
              <div className="chat-messages" style={{ width: '100%', maxWidth: '800px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '10px' }}>
                  <Sparkles style={{ color: 'var(--primary)' }} />
                  <div>
                    <strong style={{ fontSize: '15px' }}>{t('trainerConsole')}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('trainerConsoleDesc')}</div>
                  </div>
                </div>

                <div className="chat-history">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.sender === 'user' ? 'message-user' : 'message-ai'}`}>
                      <div className="message-bubble">
                        <div className="message-content">
                          {renderMessageContent(msg.text)}
                        </div>
                        <div className="message-time">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chat-suggestions">
                  <button onClick={() => setChatInput('Give me a custom meal plan for my training days.')} className="quick-action-chip">
                    {t('mealPlanPrompt')}
                  </button>
                  <button onClick={() => setChatInput('Adjust my exercises for next week.')} className="quick-action-chip">
                    {t('progressionPrompt')}
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-area">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t('chatPlaceholder')} 
                    className="chat-input"
                  />
                  <button type="submit" className="btn btn-primary">{t('send')}</button>
                </form>
              </div>

            </div>
          )}

          {/* Tab: Profile & Analytics */}
          {activeTab === 'profile' && (
            <div className="grid-two-cols">
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                  }}>
                    <User size={32} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{t('amirsProfile')}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                      {t('level')} <strong style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>{experienceLevel === 'unselected' ? t('pending') : experienceLevel}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('currentBlockWeek')}</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {mesocycle ? mesocycle.week : 0}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('workoutsLogged')}</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      {mesocycle ? (mesocycle.week - 1) * mesocycle.exercises.length : 0}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <h4 style={{ color: 'var(--danger)', marginBottom: '8px' }}>{t('dangerZone')}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                    {t('dangerDesc')}
                  </p>
                  <button 
                    onClick={handleHardReset} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}
                  >
                    {t('factoryReset')}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="card">
                  <h2 className="card-title">
                    <Activity /> Muscle Heatmap
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                    Visualizing your current weekly volume distribution.
                  </p>
                  <MuscleHeatmap mesocycle={mesocycle} />
                </div>

                <div className="card">
                  <h2 className="card-title">
                    <TrendingUp /> {t('baselinePrBoard')}
                  </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  {t('prBoardDesc')}
                </p>
                
                {baselineExercises.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                    {t('noBaselines')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {baselineExercises.map((ex, idx) => {
                      const isRepBased = ex.isRepBasedPR || (checkIsBodyweight(ex.name) && (ex.weight === 0 || !ex.weight));
                      const displayVal = isRepBased 
                        ? `${ex.reps} Reps (BW)` 
                        : (ex.e1rm ? `${ex.e1rm.toFixed(1)} kg` : 'N/A');
                      
                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{ex.name}</div>
                            <span className="badge badge-info" style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {ex.category}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: '800', fontSize: '16px' }}>
                              {displayVal}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {lang === 'fa' ? 'رکورد ثبت‌شده' : 'Baseline Logged'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

        </div>
      </main>

      {isGeneratingPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 8, 10, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
            animation: 'pulse 1.8s infinite ease-in-out',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--primary)',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <TrendingUp size={36} style={{ color: '#000' }} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>
            {t('aiGeneratingPlan')}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '14px' }}>
            {lang === 'fa' ? 'ما در حال تحلیل وزنه‌های پایه شما و فرموله‌سازی بهینه‌ترین حالت اضافه‌بار پیشرونده هستیم...' : 'We are analyzing your baseline weights and formulating the optimal progressive overload schedule...'}
          </p>
        </div>
      )}

      {generationError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 8, 10, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: 'var(--danger)'
          }}>
            <AlertTriangle size={32} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>
            {t('aiGenerationError')}
          </h3>
          <p style={{ color: 'var(--danger)', maxWidth: '500px', fontSize: '14px', marginBottom: '32px', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)', direction: 'ltr', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
            {generationError}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button 
              onClick={handleInitializeMesocycle} 
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} /> {t('retry')}
            </button>
            <button 
              onClick={handleLocalFallback} 
              className="btn btn-secondary"
            >
              {t('useOfflineFallback')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
