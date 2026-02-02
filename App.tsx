
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Unit, Question } from './types';
import { QUESTIONS_BANK as INITIAL_BANK } from './data';
import { ACADEMIC_INFO } from './constants';
import { 
  BookOpen, 
  Search, 
  Printer, 
  CheckCircle2, 
  School,
  GraduationCap,
  Info,
  Compass,
  Zap, 
  RotateCcw,
  XCircle,
  PlayCircle,
  Eye,
  EyeOff,
  Layout,
  PlusCircle,
  Save,
  Trash2,
  FileText,
  HelpCircle,
  CircleHelp,
  X,
  Link2,
  Share2,
  Check,
  AlertCircle,
  BellRing,
  StickyNote,
  MessageSquareMore,
  ChevronDown,
  ChevronUp,
  Boxes,
  Brain,
  Activity,
  UserCheck,
  Trophy,
  Timer,
  User,
  Medal,
  History,
  TrendingUp,
  Flame,
  AlertTriangle,
  Lightbulb,
  ArrowLeftRight,
  ClipboardList,
  Download,
  Target,
  BarChart3,
  Award
} from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error' | 'delete';
}

interface UnitCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  units: Unit[];
}

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
  correctAnswers: number;
  totalQuestions: number;
}

const STORAGE_KEY_NOTES = 'personality_bank_user_notes';
const STORAGE_KEY_LEADERBOARD = 'personality_bank_leaderboard';
const COMP_TIME_PER_QUESTION = 15; // seconds

const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'intro',
    title: 'المدخل والشمولية',
    icon: Boxes,
    units: [Unit.INTRODUCTION, Unit.INTEGRATION]
  },
  {
    id: 'psycho',
    title: 'مدرسة التحليل النفسي',
    icon: Brain,
    units: [Unit.FREUD, Unit.MODERN_PSYCHOANALYSIS]
  },
  {
    id: 'beh-cog',
    title: 'السلوكية والمعرفية',
    icon: Activity,
    units: [Unit.BEHAVIORISM, Unit.COGNITIVE]
  },
  {
    id: 'hum-traits',
    title: 'الإنسانية والسمات',
    icon: UserCheck,
    units: [Unit.HUMANISM, Unit.TRAITS]
  }
];

const App: React.FC = () => {
  // --- Questions State ---
  const [questions, setQuestions] = useState<Question[]>(INITIAL_BANK);
  
  // --- User Notes State ---
  const [userNotes, setUserNotes] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // --- Leaderboard State ---
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // --- View & Filter State ---
  const [selectedUnit, setSelectedUnit] = useState<Unit | 'الكل'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [showNotesField, setShowNotesField] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [linkedQuestionId, setLinkedQuestionId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openCategories, setOpenCategories] = useState<string[]>(['intro', 'psycho']);

  // --- Quiz & Competitive State ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isCompMode, setIsCompMode] = useState(false);
  const [compSetup, setCompSetup] = useState(false);
  const [compUsername, setCompUsername] = useState('');
  const [compCurrentIdx, setCompCurrentIdx] = useState(0);
  const [compScore, setCompScore] = useState(0);
  const [compTimer, setCompTimer] = useState(COMP_TIME_PER_QUESTION);
  const [compCorrectCount, setCompCorrectCount] = useState(0);
  
  const [quizUnits, setQuizUnits] = useState<Unit[]>([]);
  const [quizCount, setQuizCount] = useState(10);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  const timerRef = useRef<number | null>(null);

  // --- Sync Notes & Leaderboard ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(userNotes));
  }, [userNotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(leaderboard));
  }, [leaderboard]);

  // --- Competitive Timer Logic ---
  useEffect(() => {
    if (isCompMode && !isQuizSubmitted) {
      if (compTimer > 0) {
        timerRef.current = window.setTimeout(() => setCompTimer(prev => prev - 1), 1000);
      } else {
        handleNextCompQuestion();
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isCompMode, compTimer, isQuizSubmitted]);

  // --- Deep Linking Logic ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#q-')) {
        const id = parseInt(hash.replace('#q-', ''));
        if (!isNaN(id)) {
          setLinkedQuestionId(id);
          if (!isQuizMode && !isCompMode) {
            setTimeout(() => {
              const element = document.getElementById(`question-${id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isQuizMode, isCompMode]);

  // --- Bank Logic ---
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchUnit = selectedUnit === 'الكل' || q.unit === selectedUnit;
      const matchSearch = q.scenario.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUnit && matchSearch;
    });
  }, [questions, selectedUnit, searchQuery]);

  // --- Helpers ---
  const getUnitCategoryColor = (unit: Unit) => {
    const cat = UNIT_CATEGORIES.find(c => c.units.includes(unit));
    if (!cat) return 'bg-slate-400';
    switch(cat.id) {
      case 'intro': return 'bg-slate-400';
      case 'psycho': return 'bg-purple-500';
      case 'beh-cog': return 'bg-amber-500';
      case 'hum-traits': return 'bg-emerald-500';
      default: return 'bg-slate-400';
    }
  };

  const getUnitCategoryName = (unit: Unit) => {
    return UNIT_CATEGORIES.find(c => c.units.includes(unit))?.title || 'عام';
  };

  const getQuizAnalysis = () => {
    const analysis: Record<string, { total: number, correct: number, color: string }> = {};
    activeQuizQuestions.forEach(q => {
      const catName = getUnitCategoryName(q.unit);
      const catColor = getUnitCategoryColor(q.unit);
      if (!analysis[catName]) analysis[catName] = { total: 0, correct: 0, color: catColor };
      analysis[catName].total++;
      if (userAnswers[q.id] === q.correctAnswer) analysis[catName].correct++;
    });
    return analysis;
  };

  // --- Toast Logic ---
  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Shared Logic ---
  const handleShare = (id: number) => {
    const url = `${window.location.origin}${window.location.pathname}#q-${id}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast('تم نسخ رابط السؤال المباشر بنجاح', 'info');
      window.location.hash = `q-${id}`;
    });
  };

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const calculateScore = () => {
    return activeQuizQuestions.reduce((score, q) => {
      return score + (userAnswers[q.id] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  const toggleAnswer = (id: number) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleNotesField = (id: number) => {
    setShowNotesField(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredQuestions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `personality_questions_export_${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    addToast('تم تصدير الأسئلة المحددة بنجاح بصيغة JSON', 'success');
  };

  // --- Competitive Logic ---
  const handleStartCompChallenge = () => {
    if (!compUsername.trim()) {
      addToast('يرجى إدخال اسمك للمشاركة في التحدي', 'error');
      return;
    }
    const pool = questions;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setActiveQuizQuestions(shuffled.slice(0, 10)); 
    setCompCurrentIdx(0);
    setCompScore(0);
    setCompCorrectCount(0);
    setCompTimer(COMP_TIME_PER_QUESTION);
    setIsQuizSubmitted(false);
    setCompSetup(false);
    setIsCompMode(true);
    setIsQuizMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('انطلق التحدي! لديك 15 ثانية لكل سؤال', 'success');
  };

  const handleNextCompQuestion = () => {
    if (compCurrentIdx < activeQuizQuestions.length - 1) {
      setCompCurrentIdx(prev => prev + 1);
      setCompTimer(COMP_TIME_PER_QUESTION);
    } else {
      finishCompChallenge();
    }
  };

  const handleCompAnswer = (key: string) => {
    if (isQuizSubmitted) return;
    const currentQ = activeQuizQuestions[compCurrentIdx];
    const isCorrect = key === currentQ.correctAnswer;
    if (isCorrect) {
      const bonus = compTimer * 10;
      setCompScore(prev => prev + 100 + bonus);
      setCompCorrectCount(prev => prev + 1);
      addToast(`إجابة صحيحة! +${100 + bonus}`, 'success');
    } else {
      addToast('إجابة خاطئة، حظاً أوفر في السؤال القادم', 'error');
    }
    handleNextCompQuestion();
  };

  const finishCompChallenge = () => {
    setIsQuizSubmitted(true);
    const finalScore = compScore;
    const newEntry: LeaderboardEntry = {
      name: compUsername,
      score: finalScore,
      date: new Date().toLocaleDateString('ar-EG'),
      correctAnswers: compCorrectCount,
      totalQuestions: activeQuizQuestions.length
    };
    setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score).slice(0, 10));
    addToast('انتهى التحدي! تم تسجيل نتيجتك في لوحة الشرف', 'info');
  };

  // --- Standard Quiz Logic ---
  const handleStartQuiz = () => {
    const pool = quizUnits.length === 0 
      ? questions 
      : questions.filter(q => quizUnits.includes(q.unit));
    if (pool.length === 0) {
      addToast('عذراً، لا توجد أسئلة كافية في الوحدات المختارة', 'error');
      return;
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setActiveQuizQuestions(shuffled.slice(0, Math.min(quizCount, pool.length)));
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setIsQuizMode(true);
    setIsCompMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast('بدأت جلسة الاختبار التفاعلي، بالتوفيق!', 'success');
  };

  const handleReset = () => {
    setIsQuizMode(false);
    setIsCompMode(false);
    setCompSetup(false);
    setIsQuizSubmitted(false);
    setActiveQuizQuestions([]);
    setUserAnswers({});
    setCompCurrentIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleQuizUnit = (unit: Unit) => {
    setQuizUnits(prev => 
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const confirmDelete = () => {
    if (pendingDeleteId !== null) {
      setQuestions(prev => prev.filter(q => q.id !== pendingDeleteId));
      addToast('تم حذف السؤال نهائياً من البنك', 'delete');
      setPendingDeleteId(null);
    }
  };

  const getUnitCount = (unitName: string) => {
    if (unitName === 'الكل') return questions.length;
    return questions.filter(q => q.unit === unitName).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-['Cairo']">
      
      {/* Delete Confirmation Modal Overlay */}
      {pendingDeleteId !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="bg-rose-50 p-6 flex flex-col items-center gap-4 text-center">
              <div className="bg-rose-100 p-3 rounded-full text-rose-600">
                <AlertTriangle size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-rose-900">تأكيد حذف السؤال؟</h3>
                <p className="text-slate-600 font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف هذا السؤال نهائياً من بنك الأسئلة؟ لا يمكن التراجع عن هذا الإجراء لاحقاً.
                </p>
              </div>
            </div>
            <div className="p-6 flex flex-row-reverse gap-4">
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                حذف نهائي
              </button>
              <button 
                onClick={() => setPendingDeleteId(null)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-lg transition-all active:scale-95"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[300px] animate-in slide-in-from-left-4 duration-300 ${
              toast.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' :
              toast.type === 'info' ? 'bg-indigo-600 border-indigo-500 text-white' :
              toast.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' :
              'bg-slate-800 border-slate-700 text-white'
            }`}
          >
            <div className="shrink-0 bg-white/20 p-1.5 rounded-lg">
              {toast.type === 'success' ? <CheckCircle2 size={20} /> :
               toast.type === 'info' ? <BellRing size={20} /> :
               toast.type === 'error' ? <AlertCircle size={20} /> :
               <Trash2 size={20} />}
            </div>
            <p className="font-bold text-sm flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header Section */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-right">
          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <School size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-indigo-900 leading-tight">{ACADEMIC_INFO.university}</h1>
              <p className="text-sm text-slate-500 font-medium">{ACADEMIC_INFO.faculty} - {ACADEMIC_INFO.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-row-reverse">
            {!isQuizMode && !isCompMode && !compSetup && (
              <>
                <button 
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all font-bold border border-indigo-100 shadow-sm"
                  title="تصدير بنك الأسئلة الحالي بصيغة JSON"
                >
                  <Download size={18} />
                  <span>تصدير JSON</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-bold border border-slate-200 shadow-sm"
                >
                  <Printer size={18} />
                  <span>طباعة</span>
                </button>
              </>
            )}
            <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-sm font-bold shadow-sm">
              العام الجامعي {ACADEMIC_INFO.year} م
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {!isQuizMode && !isCompMode && !compSetup && (
        <div className="max-w-7xl mx-auto px-4 pt-8 no-print text-right">
          <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute transform -rotate-12 -top-10 -left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute transform rotate-12 -bottom-10 -right-10 w-64 h-64 bg-indigo-400 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold backdrop-blur-md flex-row-reverse">
                  <Layout size={16} className="text-amber-400" />
                  <span>المنصة الأكاديمية لطلاب علم النفس</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  بنك أسئلة {ACADEMIC_INFO.courseTitle}
                </h2>
                <div className="flex flex-wrap gap-4 text-indigo-50 justify-end">
                  <span className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 font-bold flex-row-reverse">
                    <GraduationCap size={20} className="text-amber-400"/> {ACADEMIC_INFO.level}
                  </span>
                  <span className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 font-bold flex-row-reverse">
                    <Info size={20} className="text-amber-400"/> {ACADEMIC_INFO.instructor}
                  </span>
                </div>
                <div className="pt-4 flex gap-4 flex-row-reverse">
                  <button onClick={handleStartQuiz} className="px-8 py-3 bg-white text-indigo-700 rounded-2xl font-black shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2 flex-row-reverse animate-bounce">
                    <Zap size={20} className="text-amber-500" /> ابدأ اختباراً سريعاً
                  </button>
                </div>
              </div>
              <div className="hidden lg:block shrink-0">
                <div className="w-48 h-48 bg-white/10 rounded-3xl flex items-center justify-center border-2 border-white/20 rotate-3 shadow-2xl backdrop-blur-lg">
                    <BookOpen size={96} className="text-white/90 drop-shadow-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto px-4 ${(isQuizMode || isCompMode || compSetup) ? 'pt-8' : 'mt-10'} flex flex-col lg:flex-row-reverse gap-8`}>
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 no-print text-right">
          <div className="sticky top-28 space-y-6">
            {!isQuizMode && !isCompMode && !compSetup && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedUnit('الكل')}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black text-right border ${
                    selectedUnit === 'الكل' 
                    ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' 
                    : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 border-slate-100 shadow-sm'
                  }`}
                >
                  <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${
                    selectedUnit === 'الكل' ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {getUnitCount('الكل')}
                  </span>
                  <span className="flex items-center gap-3 flex-row-reverse">
                    كامل بنك الأسئلة
                    <Compass size={20} />
                  </span>
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  <div className="p-4 bg-slate-50/50 flex items-center justify-between flex-row-reverse">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">تصنيفات الوحدات</h3>
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={`p-2 rounded-lg transition-colors ${showAddForm ? 'bg-slate-200 text-slate-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                        title="إضافة سؤال جديد"
                    >
                      {showAddForm ? <X size={18} /> : <PlusCircle size={18} />}
                    </button>
                  </div>
                  {UNIT_CATEGORIES.map((cat) => {
                    const isOpen = openCategories.includes(cat.id);
                    const hasActiveUnit = cat.units.includes(selectedUnit as Unit);
                    const CategoryIcon = cat.icon;
                    return (
                      <div key={cat.id} className="group">
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full flex items-center justify-between p-4 transition-all hover:bg-slate-50 flex-row-reverse ${isOpen ? 'bg-slate-50/50' : ''}`}
                        >
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <div className={`p-1.5 rounded-lg ${hasActiveUnit ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                              <CategoryIcon size={18} />
                            </div>
                            <span className={`font-bold text-sm ${hasActiveUnit ? 'text-indigo-600' : 'text-slate-700'}`}>
                              {cat.title}
                            </span>
                          </div>
                          <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDown size={18} className="text-slate-400" />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="p-2 space-y-1 bg-white animate-in slide-in-from-top-2 duration-200">
                            {cat.units.map((unit) => (
                              <button
                                key={unit}
                                onClick={() => setSelectedUnit(unit)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all font-bold text-xs text-right border flex-row-reverse ${
                                  selectedUnit === unit 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-inner' 
                                  : 'text-slate-500 hover:bg-slate-50 border-transparent'
                                }`}
                              >
                                <span className="truncate">{unit}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                                  selectedUnit === unit ? 'bg-indigo-200' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {getUnitCount(unit)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!isQuizMode && !isCompMode && !compSetup && (
               <div className="bg-gradient-to-br from-amber-600 to-amber-500 rounded-2xl shadow-xl p-6 text-white space-y-4 border border-amber-400 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Trophy size={80} />
                  </div>
                  <div className="relative z-10 flex items-center gap-3 flex-row-reverse">
                    <div className="bg-white/20 p-2 rounded-xl"><Flame size={24} className="text-white" /></div>
                    <h3 className="text-xl font-black">وضع التحدي</h3>
                  </div>
                  <button 
                    onClick={() => setCompSetup(true)}
                    className="w-full py-3 bg-white text-amber-600 rounded-xl font-black shadow-lg transition-all hover:bg-amber-50 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 flex-row-reverse"
                  >
                    <Trophy size={18} /> دخول التحدي
                  </button>
               </div>
            )}

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-xl p-6 text-white space-y-6 border border-indigo-700 text-right">
              <div className="flex items-center gap-2 justify-end">
                <h3 className="text-xl font-black">الاختبار التفاعلي</h3>
                <Zap size={24} className="text-amber-400" />
              </div>
              
              {!isQuizMode && !isCompMode && !compSetup ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-indigo-200">اختر وحدات الاختبار:</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pl-2 custom-scrollbar flex-row-reverse">
                      {Object.values(Unit).map(u => (
                        <button
                          key={u}
                          onClick={() => toggleQuizUnit(u)}
                          className={`text-right px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                            quizUnits.includes(u) 
                            ? 'bg-amber-500 border-amber-300 text-white shadow-md' 
                            : 'bg-white/5 border-white/10 text-indigo-100 hover:bg-white/10'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleStartQuiz} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 flex-row-reverse">
                    <PlayCircle size={20} /> ابدأ جلسة اختبار
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button onClick={handleReset} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10 flex-row-reverse">
                    <RotateCcw size={18} /> إنهاء والعودة
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 space-y-6 text-right">
          
          {compSetup ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
               <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                  <div className="bg-amber-600 p-8 text-white flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-4 flex-row-reverse text-right">
                      <div className="bg-white/20 p-3 rounded-2xl"><Trophy size={40} /></div>
                      <div>
                        <h2 className="text-3xl font-black">تحدي نظريات الشخصية</h2>
                        <p className="text-amber-100 font-bold opacity-80">أثبت جدارتك الأكاديمية</p>
                      </div>
                    </div>
                    <button onClick={() => setCompSetup(false)} className="hover:rotate-90 transition-transform"><X size={32} /></button>
                  </div>
                  <div className="p-8 space-y-10">
                    <div className="max-w-md mx-auto space-y-4 text-center">
                      <input 
                        type="text" 
                        placeholder="أدخل اسمك هنا..."
                        value={compUsername}
                        onChange={(e) => setCompUsername(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-500 focus:ring-0 transition-all text-right font-black text-xl"
                      />
                      <button 
                        onClick={handleStartCompChallenge}
                        className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-2xl shadow-2xl transition-all"
                      >
                        دخول حلبة التحدي
                      </button>
                    </div>
                  </div>
               </div>
            </div>
          ) : isCompMode ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-6 rounded-3xl shadow-lg border flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6 flex-row-reverse">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 mb-1">النقاط</p>
                      <p className="text-4xl font-black text-amber-600">{compScore.toLocaleString()}</p>
                    </div>
                    <div className="text-right border-r pr-6 border-slate-100">
                       <p className="text-xs font-black text-slate-400 mb-1">السؤال</p>
                       <p className="text-2xl font-black text-slate-800">{compCurrentIdx + 1} / 10</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                    <Timer size={24} className={compTimer <= 5 ? 'animate-pulse text-rose-600' : ''} />
                    <span className={`text-2xl font-black tabular-nums ${compTimer <= 5 ? 'text-rose-600' : ''}`}>{compTimer} ثانية</span>
                  </div>
               </div>
               {!isQuizSubmitted && activeQuizQuestions[compCurrentIdx] && (
                 <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-50 p-8 md:p-12 space-y-10 animate-in fade-in zoom-in-95">
                    <div className="space-y-4">
                      <div className="bg-indigo-50 p-8 rounded-3xl border-r-8 border-indigo-500 text-xl font-bold italic text-slate-700">
                        {activeQuizQuestions[compCurrentIdx].scenario}
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 leading-tight pr-2">
                         {activeQuizQuestions[compCurrentIdx].questionText}
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(activeQuizQuestions[compCurrentIdx].options).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => handleCompAnswer(key)}
                          className="p-6 rounded-2xl border-2 border-slate-100 text-right transition-all font-black text-lg hover:border-amber-500 hover:bg-amber-50 flex items-center justify-between flex-row-reverse"
                        >
                          <span className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-400">{key.toUpperCase()}</span>
                          <span>{value}</span>
                        </button>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          ) : isQuizMode ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Quiz Progress Header */}
              <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-indigo-100 flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse">
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Zap size={24} /></div>
                  <div className="text-right">
                    <h2 className="text-xl font-black text-indigo-900 leading-none">الاختبار التفاعلي النشط</h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">تحديد مستوى الاستيعاب الأكاديمي</p>
                  </div>
                </div>
                
                {!isQuizSubmitted ? (
                  <div className="w-full md:w-80 space-y-2">
                    <div className="flex justify-between items-center text-xs font-black flex-row-reverse">
                      <span className="text-indigo-600">إنجاز: {Math.round((Object.keys(userAnswers).length / activeQuizQuestions.length) * 100)}%</span>
                      <span className="text-slate-400">{Object.keys(userAnswers).length} من {activeQuizQuestions.length} سؤال</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                      <div 
                        className="h-full bg-gradient-to-l from-indigo-600 to-indigo-400 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${(Object.keys(userAnswers).length / activeQuizQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6 flex-row-reverse">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">مجموع الدرجات</p>
                      <p className="text-3xl font-black text-indigo-600">{calculateScore()} / {activeQuizQuestions.length}</p>
                    </div>
                  </div>
                )}
              </div>

              {isQuizSubmitted && (
                <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-50 overflow-hidden animate-in zoom-in duration-500">
                  <div className="bg-indigo-600 p-8 text-white text-center space-y-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-xl"><Award size={48} /></div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black">تحليل الأداء التربوي</h3>
                      <p className="text-indigo-100 font-bold">ملخص شامل لمستوى استيعابك للمدارس النفسية</p>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(getQuizAnalysis()).map(([cat, data]) => (
                      <div key={cat} className="p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 flex flex-col items-center gap-3 text-center transition-all hover:scale-105">
                        <div className={`w-3 h-3 rounded-full ${data.color}`}></div>
                        <p className="font-black text-slate-700 text-sm">{cat}</p>
                        <div className="text-2xl font-black text-indigo-600">{Math.round((data.correct / data.total) * 100)}%</div>
                        <p className="text-[10px] font-bold text-slate-400 italic">
                          ({data.correct} من {data.total})
                        </p>
                        <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
                           <div className={`h-full ${data.color}`} style={{ width: `${(data.correct / data.total) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 bg-slate-50 border-t flex flex-col md:flex-row justify-center gap-4">
                    <button onClick={handleReset} className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2 justify-center flex-row-reverse">
                      <RotateCcw size={18} /> اختبار جديد
                    </button>
                    <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 justify-center flex-row-reverse">
                      <Printer size={18} /> طباعة النتائج
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {activeQuizQuestions.map((q, idx) => {
                  const isCorrect = userAnswers[q.id] === q.correctAnswer;
                  const isAnswered = !!userAnswers[q.id];
                  return (
                    <div 
                      key={q.id} 
                      className={`bg-white rounded-[2.5rem] shadow-xl overflow-hidden border-2 transition-all duration-500 ${
                        isQuizSubmitted 
                        ? (isCorrect ? 'border-emerald-500/30 ring-4 ring-emerald-50' : 'border-rose-500/30 ring-4 ring-rose-50') 
                        : (isAnswered ? 'border-indigo-500 shadow-indigo-100/50' : 'border-slate-100')
                      }`}
                    >
                      <div className="p-8 md:p-12 space-y-10 text-right">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <span className={`px-5 py-2 rounded-2xl font-black text-sm transition-all shadow-sm ${isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              سؤال {idx + 1}
                            </span>
                            <div className="flex items-center gap-2 flex-row-reverse bg-slate-50 px-3 py-1.5 rounded-xl border">
                              <div className={`w-2.5 h-2.5 rounded-full ${getUnitCategoryColor(q.unit)}`}></div>
                              <span className="text-xs font-black text-slate-400">{q.unit}</span>
                            </div>
                          </div>
                          {isQuizSubmitted && (
                             <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 flex-row-reverse shadow-sm ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                               {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                               {isCorrect ? 'إجابة دقيقة' : 'تحليل خاطئ'}
                             </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 justify-end text-indigo-600 font-black text-xs uppercase tracking-widest">
                            <span>الموقف السلوكي الملحوظ</span>
                            <FileText size={18} />
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50/50 to-white p-8 rounded-[2rem] border border-indigo-100 text-xl font-bold italic leading-relaxed text-slate-700 shadow-inner">
                            {q.scenario}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 justify-end text-amber-600 font-black text-xs uppercase tracking-widest">
                            <span>المطلوب تحليله وتفسيره</span>
                            <CircleHelp size={18} />
                          </div>
                          <h4 className="text-2xl font-black text-slate-900 leading-tight pr-4">
                             {q.questionText}
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(q.options).map(([key, value]) => {
                            const isSelected = userAnswers[q.id] === key;
                            const isThisCorrect = q.correctAnswer === key;
                            let btnClass = "p-6 rounded-3xl border-2 text-right transition-all font-black text-lg flex items-center justify-between flex-row-reverse shadow-sm ";
                            
                            if (isQuizSubmitted) {
                              if (isThisCorrect) btnClass += "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-100";
                              else if (isSelected) btnClass += "bg-rose-50 border-rose-500 text-rose-900";
                              else btnClass += "bg-slate-50 border-slate-100 text-slate-300 opacity-60";
                            } else {
                              btnClass += isSelected 
                                ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-indigo-100 scale-[1.02]" 
                                : "bg-white border-slate-100 text-slate-700 hover:border-indigo-300 hover:bg-slate-50/50";
                            }

                            return (
                              <button 
                                key={key} 
                                disabled={isQuizSubmitted} 
                                onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: key }))} 
                                className={btnClass}
                              >
                                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100'
                                }`}>
                                  {key.toUpperCase()}
                                </span>
                                <span className="flex-1 mr-4">{value}</span>
                                {isQuizSubmitted && isThisCorrect && <CheckCircle2 size={24} className="text-emerald-500 animate-pulse" />}
                                {isQuizSubmitted && isSelected && !isThisCorrect && <XCircle size={24} className="text-rose-500" />}
                              </button>
                            );
                          })}
                        </div>

                        {isQuizSubmitted && (
                          <div className={`p-8 rounded-[2rem] flex flex-col gap-4 shadow-xl border-t-8 transition-all animate-in slide-in-from-top-4 ${isCorrect ? 'bg-emerald-50 border-emerald-500' : 'bg-rose-50 border-rose-500'}`}>
                             <div className="flex items-center gap-3 justify-end flex-row-reverse text-slate-800 font-black">
                                <div className="p-2 bg-white rounded-xl shadow-sm"><Lightbulb size={24} className="text-amber-500" /></div>
                                <h5 className="text-lg">التأصيل والتفسير العلمي للموقف:</h5>
                             </div>
                             <p className="text-right font-bold leading-relaxed text-slate-600 text-base">
                               {q.explanation}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isQuizSubmitted && (
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-indigo-100 flex flex-col items-center gap-8 text-center animate-pulse">
                  <div className="space-y-3">
                    <div className="bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-inner"><Target size={48} /></div>
                    <h3 className="text-3xl font-black text-slate-800">إنهاء الاختبار وحساب النتائج؟</h3>
                    <p className="text-slate-500 font-bold text-lg">لقد قمت بتحليل {Object.keys(userAnswers).length} من أصل {activeQuizQuestions.length} مواقف نفسية</p>
                  </div>
                  <button 
                    onClick={() => { setIsQuizSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                    className="px-20 py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-3xl font-black text-2xl shadow-2xl shadow-indigo-200 transition-all transform hover:-translate-y-2 active:scale-95 flex items-center gap-4 flex-row-reverse"
                  >
                    <BarChart3 size={28} /> استخراج تقرير الأداء
                  </button>
                </div>
              )}
            </div>
          ) : (
            // --- BANK INTERFACE ---
            <div className="space-y-8 text-right">
              {/* Search & Filter Top Bar */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center no-print flex-row-reverse">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="ابحث في المواقف أو نصوص الأسئلة..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pr-12 pl-4 py-3.5 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-right font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-5 py-2.5 rounded-2xl text-slate-600 font-bold text-sm shrink-0 flex-row-reverse border border-slate-200">
                  <ClipboardList size={18} className="text-indigo-500" />
                  <span>{filteredQuestions.length} سؤال متاح</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-10">
                {filteredQuestions.map((q) => (
                  <article 
                    key={q.id} 
                    id={`question-${q.id}`} 
                    className={`bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all border group overflow-hidden page-break flex flex-col ${linkedQuestionId === q.id ? 'ring-4 ring-indigo-500/20 border-indigo-200' : 'border-slate-100'}`}
                  >
                    {/* 1. Header Section */}
                    <div className="px-8 py-5 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center flex-row-reverse">
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <div className="bg-indigo-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200">
                          #{q.id}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الوحدة الدراسية</span>
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-sm font-black text-indigo-900 leading-none">{q.unit}</span>
                            <div 
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${getUnitCategoryColor(q.unit)} border border-white shadow-sm`}
                              title={`تصنيف: ${getUnitCategoryName(q.unit)}`}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-row-reverse no-print">
                        <button 
                          onClick={() => handleShare(q.id)} 
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="مشاركة رابط السؤال"
                        >
                          <Share2 size={18} />
                        </button>
                        <button 
                          onClick={() => setPendingDeleteId(q.id)} 
                          className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="حذف السؤال"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* 2. Scenario Section */}
                    <div className="p-8 space-y-4">
                      <div className="flex items-center gap-3 justify-end text-indigo-600">
                        <span className="text-sm font-black uppercase tracking-widest">الموقف السلوكي الملحوظ</span>
                        <div className="p-1.5 bg-indigo-100 rounded-lg"><FileText size={18} /></div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50/40 to-white p-8 rounded-3xl border border-indigo-100/50 text-xl font-bold italic leading-relaxed text-slate-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500/20"></div>
                        {q.scenario}
                      </div>
                    </div>

                    {/* 3. Question Section */}
                    <div className="px-8 pb-8 space-y-6">
                      <div className="flex items-center gap-3 justify-end text-amber-600">
                        <span className="text-sm font-black uppercase tracking-widest">المطلوب تحليله وتفسيره</span>
                        <div className="p-1.5 bg-amber-100 rounded-lg"><CircleHelp size={18} /></div>
                      </div>
                      <div className="bg-amber-50/30 p-8 rounded-3xl border border-amber-200/40 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                          {q.questionText}
                        </h3>
                      </div>

                      {/* 4. Options Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">خيارات الاستجابة المقترحة</span>
                          <div className="h-px bg-slate-100 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                          {Object.entries(q.options).map(([key, value]) => (
                            <div 
                              key={key} 
                              className={`p-6 rounded-2xl border-2 flex items-center justify-between flex-row-reverse transition-all duration-300 relative group/opt ${
                                showAnswers[q.id] && q.correctAnswer === key 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-lg shadow-emerald-100/50 scale-[1.02] z-10' 
                                : (showAnswers[q.id] ? 'bg-slate-50 border-slate-100 text-slate-300 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md')
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-row-reverse">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-colors ${
                                  showAnswers[q.id] && q.correctAnswer === key 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-slate-100 text-slate-400 group-hover/opt:bg-indigo-100 group-hover/opt:text-indigo-600'
                                }`}>
                                  {key.toUpperCase()}
                                </span>
                                <span className="text-right flex-1">{value}</span>
                              </div>
                              {showAnswers[q.id] && q.correctAnswer === key && (
                                <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg ml-2 animate-bounce">
                                  <CheckCircle2 size={18} />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 5. Action Footer & Explanation Section */}
                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4 no-print">
                      <div className="flex justify-between items-center flex-row-reverse">
                         <button 
                          onClick={() => toggleAnswer(q.id)} 
                          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm ${
                            showAnswers[q.id] 
                            ? 'bg-indigo-600 text-white shadow-indigo-200' 
                            : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-100'
                          }`}
                        >
                          {showAnswers[q.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                          <span>{showAnswers[q.id] ? 'إخفاء التحليل العلمي' : 'كشف التحليل العلمي'}</span>
                        </button>
                        <button 
                          onClick={() => toggleNotesField(q.id)} 
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            userNotes[q.id] 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-white text-slate-500 hover:text-slate-700 border-slate-200'
                          }`}
                        >
                          {userNotes[q.id] ? <MessageSquareMore size={18} /> : <StickyNote size={18} />}
                          <span>{userNotes[q.id] ? 'ملاحظة مسجلة' : 'إضافة ملاحظة'}</span>
                        </button>
                      </div>

                      {showNotesField[q.id] && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                           <textarea 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 text-right min-h-[80px] shadow-inner" 
                            placeholder="دون ملاحظاتك الخاصة لتعميق فهمك لهذا الموقف..." 
                            value={userNotes[q.id] || ''} 
                            onChange={(e) => setUserNotes(prev => ({...prev, [q.id]: e.target.value}))}
                          />
                        </div>
                      )}

                      {showAnswers[q.id] && (
                        <div className="mt-2 p-8 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden animate-in slide-in-from-top-6 duration-500">
                          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2"></div>
                          <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3 justify-end flex-row-reverse border-b border-white/10 pb-4">
                              <div className="bg-white/20 p-2 rounded-xl"><Lightbulb size={24} className="text-amber-300" /></div>
                              <div className="text-right">
                                <h5 className="font-black text-lg">التأصيل والتفسير الأكاديمي</h5>
                                <p className="text-[10px] text-indigo-100 opacity-80 uppercase font-bold tracking-widest">من منظور {q.unit}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 flex-row-reverse">
                               <div className="bg-emerald-400/20 px-3 py-1 rounded-lg text-emerald-300 font-black h-fit shrink-0 text-xs">
                                 الإجابة: {q.correctAnswer.toUpperCase()}
                               </div>
                               <p className="text-right font-bold leading-relaxed text-indigo-50 text-base">
                                 {q.explanation}
                               </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-32 py-16 border-t bg-white no-print text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-8">
          <div className="flex items-center gap-6 flex-row-reverse opacity-40">
            <School size={32} />
            <div className="h-8 w-px bg-slate-300"></div>
            <p className="font-black text-lg tracking-widest uppercase">{ACADEMIC_INFO.university} - {ACADEMIC_INFO.faculty}</p>
          </div>
          <div className="max-w-2xl space-y-4">
             <p className="text-slate-400 text-sm font-bold leading-relaxed">
              تم تطوير هذه المنصة التعليمية لتعزيز التحليل النفسي العميق والربط بين المفاهيم النظرية والواقع التطبيقي.<br/>
              حقوق المحتوى العلمي محفوظة بالكامل للدكتور أحمد حمدي الغول &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
