
import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  CircleHelp
} from 'lucide-react';

const App: React.FC = () => {
  // --- Questions State ---
  const [questions, setQuestions] = useState<Question[]>(INITIAL_BANK);
  
  // --- View & Filter State ---
  const [selectedUnit, setSelectedUnit] = useState<Unit | 'الكل'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // --- New Question Form State ---
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    unit: Unit.INTRODUCTION,
    scenario: '',
    questionText: '',
    options: { a: '', b: '', c: '', d: '' },
    correctAnswer: 'a',
    explanation: ''
  });

  // --- Quiz State ---
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizUnits, setQuizUnits] = useState<Unit[]>([]);
  const [quizCount, setQuizCount] = useState(10);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // --- Bank Logic ---
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchUnit = selectedUnit === 'الكل' || q.unit === selectedUnit;
      const matchSearch = q.scenario.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
      return matchUnit && matchSearch;
    });
  }, [questions, selectedUnit, searchQuery]);

  // --- Quiz Logic ---
  const handleStartQuiz = () => {
    const pool = quizUnits.length === 0 
      ? questions 
      : questions.filter(q => quizUnits.includes(q.unit));
    
    if (pool.length === 0) {
      alert("عذراً، لا توجد أسئلة كافية في الوحدات المختارة.");
      return;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setActiveQuizQuestions(shuffled.slice(0, Math.min(quizCount, pool.length)));
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setIsQuizMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetQuiz = () => {
    setIsQuizMode(false);
    setIsQuizSubmitted(false);
    setActiveQuizQuestions([]);
    setUserAnswers({});
  };

  const toggleQuizUnit = (unit: Unit) => {
    setQuizUnits(prev => 
      prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
    );
  };

  const toggleAnswer = (id: number) => {
    setShowAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateScore = () => {
    let score = 0;
    activeQuizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  // --- Add Question Logic ---
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.scenario || !newQuestion.questionText || !newQuestion.options?.a || !newQuestion.options?.b || !newQuestion.options?.c || !newQuestion.options?.d) {
      alert("يرجى إكمال جميع حقول السؤال قبل الحفظ.");
      return;
    }

    const questionToAdd: Question = {
      ...newQuestion as Question,
      id: Date.now(), // Generate unique ID
    };

    setQuestions(prev => [questionToAdd, ...prev]);
    setShowAddForm(false);
    // Reset Form
    setNewQuestion({
      unit: Unit.INTRODUCTION,
      scenario: '',
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: 'a',
      explanation: ''
    });
    alert("تمت إضافة السؤال بنجاح إلى البنك.");
  };

  const deleteQuestion = (id: number) => {
    if (window.confirm("هل أنت متأكد من حذف هذا السؤال نهائياً؟")) {
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const units = Object.values(Unit);
  const getUnitCount = (unitName: string) => {
    if (unitName === 'الكل') return questions.length;
    return questions.filter(q => q.unit === unitName).length;
  };

  // Progress Calculation
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuizCount = activeQuizQuestions.length;
  const progressPercentage = totalQuizCount > 0 ? (answeredCount / totalQuizCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-['Cairo']">
      {/* Header Section */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <School size={32} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-indigo-900 leading-tight">{ACADEMIC_INFO.university}</h1>
              <p className="text-sm text-slate-500 font-medium">{ACADEMIC_INFO.faculty} - {ACADEMIC_INFO.department}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isQuizMode && (
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-all font-bold border border-transparent hover:border-indigo-200"
              >
                <Printer size={18} />
                <span>طباعة البنك الكامل</span>
              </button>
            )}
            <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-sm font-bold shadow-sm">
              العام الجامعي {ACADEMIC_INFO.year} م
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {!isQuizMode && (
        <div className="max-w-7xl mx-auto px-4 pt-8 no-print">
          <div className="bg-gradient-to-br from-indigo-800 via-indigo-700 to-blue-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute transform -rotate-12 -top-10 -left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute transform rotate-12 -bottom-10 -right-10 w-64 h-64 bg-indigo-400 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-right">
              <div className="space-y-6 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-semibold backdrop-blur-md">
                  <Layout size={16} className="text-amber-400" />
                  <span>المنصة الأكاديمية لطلاب علم النفس</span>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  بنك أسئلة {ACADEMIC_INFO.courseTitle}
                </h2>
                <div className="flex flex-wrap gap-4 text-indigo-50 justify-start">
                  <span className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 font-bold">
                    <GraduationCap size={20} className="text-amber-400"/> {ACADEMIC_INFO.level}
                  </span>
                  <span className="flex items-center gap-2 bg-indigo-900/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 font-bold">
                    <Info size={20} className="text-amber-400"/> {ACADEMIC_INFO.instructor}
                  </span>
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
      <main className={`max-w-7xl mx-auto px-4 ${isQuizMode ? 'pt-8' : 'mt-10'} flex flex-col lg:flex-row-reverse gap-8`}>
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 no-print">
          <div className="sticky top-28 space-y-6">
            
            {!isQuizMode && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
                <div className="flex items-center justify-between">
                   <button 
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="إضافة سؤال جديد"
                    >
                      <PlusCircle size={20} />
                    </button>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 justify-end">
                      تصفح الوحدات
                      <Compass size={20} className="text-indigo-600" />
                    </h3>
                </div>
                <nav className="flex flex-col gap-1.5">
                  {['الكل', ...units].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setSelectedUnit(unit as any)}
                      className={`group flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-sm text-right ${
                        selectedUnit === unit 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded-full text-[10px] shrink-0 ${
                        selectedUnit === unit ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        {getUnitCount(unit)}
                      </span>
                      <span className="truncate">{unit}</span>
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Quiz Builder Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-xl p-6 text-white space-y-6 border border-indigo-700">
              <div className="flex items-center gap-2 justify-end">
                <h3 className="text-xl font-black">الاختبار التفاعلي</h3>
                <Zap size={24} className="text-amber-400" />
              </div>
              
              {!isQuizMode ? (
                <div className="space-y-4 text-right">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-indigo-200">اختر وحدات الاختبار:</p>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pl-2 custom-scrollbar">
                      {units.map(u => (
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
                  
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-indigo-200 flex justify-between">
                      <span className="text-amber-400">{quizCount}</span>
                      <span>عدد الأسئلة المطلوبة:</span>
                    </p>
                    <input 
                      type="range" min="3" max="20" step="1" 
                      value={quizCount} 
                      onChange={(e) => setQuizCount(parseInt(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <button 
                    onClick={handleStartQuiz}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={20} />
                    ابدأ جلسة اختبار
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-xs text-indigo-200 mb-1 font-bold text-right">معلومات الجلسة</p>
                    <div className="flex justify-between items-center font-black">
                      <span className="text-xl text-amber-400">{activeQuizQuestions.length}</span>
                      <span className="text-indigo-50">سؤال نشط</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleResetQuiz}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                  >
                    <RotateCcw size={18} />
                    إنهاء الاختبار
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 space-y-6 text-right">
          
          {isQuizMode ? (
            // --- QUIZ INTERFACE ---
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-black text-indigo-900">منصة الاختبار المباشر</h2>
                {isQuizSubmitted && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">النتيجة</p>
                      <p className="text-3xl font-black text-indigo-600">{calculateScore()} / {activeQuizQuestions.length}</p>
                    </div>
                    <div className="h-12 w-px bg-slate-200"></div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">التقدير</p>
                      <p className="text-3xl font-black text-emerald-600">{Math.round((calculateScore()/activeQuizQuestions.length)*100)}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              {!isQuizSubmitted && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-indigo-600">{answeredCount}</span>
                      <span className="text-sm font-bold text-slate-400">/ {totalQuizCount} أسئلة مجابة</span>
                    </div>
                    <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      إنجاز: {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-100 relative shadow-inner">
                    <div 
                      className="bg-gradient-to-l from-indigo-600 to-indigo-400 h-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(79,70,229,0.3)] relative"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute top-0 right-0 w-2 h-full bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {activeQuizQuestions.map((q, idx) => {
                  const isCorrect = userAnswers[q.id] === q.correctAnswer;
                  const isAnswered = !!userAnswers[q.id];
                  
                  return (
                    <div key={q.id} className={`bg-white rounded-3xl shadow-md overflow-hidden border-2 transition-all ${
                      isQuizSubmitted 
                        ? (isCorrect ? 'border-emerald-500' : 'border-rose-500')
                        : (isAnswered ? 'border-indigo-100 shadow-indigo-50/50' : 'border-transparent')
                    }`}>
                      <div className="p-6 md:p-8 space-y-8">
                        <div className="flex justify-between items-start">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                            isAnswered && !isQuizSubmitted ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            سؤال {idx + 1}
                          </span>
                          <span className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-lg">{q.unit}</span>
                        </div>
                        
                        {/* 1. Scenario Section */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                            <FileText size={18} />
                            <span>الموقف السلوكي الملحوظ:</span>
                          </div>
                          <div className="bg-slate-50 p-6 rounded-2xl border-r-4 border-indigo-400 text-slate-700 leading-relaxed font-medium italic shadow-inner">
                            {q.scenario}
                          </div>
                        </div>
                        
                        {/* 2. Question Text */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                            <CircleHelp size={18} />
                            <span>المطلوب تحليله وتفسيره:</span>
                          </div>
                          <div className="bg-amber-50/30 border border-amber-100 p-5 rounded-2xl shadow-sm">
                            <h4 className="text-xl font-black text-slate-900 leading-snug">{q.questionText}</h4>
                          </div>
                        </div>

                        {/* 3. Options Section */}
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <span>خيارات الاستجابة المقترحة:</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(q.options).map(([key, value]) => {
                              const isSelected = userAnswers[q.id] === key;
                              const isThisCorrect = q.correctAnswer === key;
                              
                              let btnClass = "p-5 rounded-2xl border-2 text-right transition-all font-bold flex items-center justify-between ";
                              if (isQuizSubmitted) {
                                if (isThisCorrect) btnClass += "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-md";
                                else if (isSelected) btnClass += "bg-rose-50 border-rose-500 text-rose-900";
                                else btnClass += "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                              } else {
                                btnClass += isSelected 
                                  ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md scale-[1.02]" 
                                  : "bg-white border-slate-100 hover:border-indigo-200 text-slate-700 hover:bg-slate-50";
                              }

                              return (
                                <button
                                  key={key}
                                  disabled={isQuizSubmitted}
                                  onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: key }))}
                                  className={btnClass}
                                >
                                  {isQuizSubmitted && isThisCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                                  {isQuizSubmitted && isSelected && !isThisCorrect && <XCircle size={20} className="text-rose-500" />}
                                  <span className="text-right flex-1">{value}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {isQuizSubmitted && (
                          <div className={`p-6 rounded-2xl flex items-start gap-4 shadow-sm border ${isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                            <div className={`p-2 rounded-lg ${isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                              <Info size={24} className="shrink-0" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-black text-base">التأصيل والتفسير العلمي:</p>
                              <p className="text-sm font-bold opacity-90 leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isQuizSubmitted ? (
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 flex flex-col items-center gap-6">
                  <div className="text-center space-y-2">
                    <p className="text-slate-800 font-black text-lg">إنهاء الاختبار وحساب النتيجة</p>
                    <p className="text-slate-500 font-bold">لقد قمت بحل {answeredCount} من أصل {totalQuizCount} أسئلة حتى الآن</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsQuizSubmitted(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-16 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-2xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    عرض نتيجتي النهائية
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 pt-10">
                  <button
                    onClick={handleResetQuiz}
                    className="px-12 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
                  >
                    العودة لمتصفح بنك الأسئلة
                  </button>
                </div>
              )}
            </div>
          ) : (
            // --- BANK INTERFACE ---
            <div className="space-y-8">
              {/* Add Question Form Section */}
              {showAddForm && (
                <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <PlusCircle size={24} />
                      <h2 className="text-xl font-black">إضافة سؤال جديد للبنك</h2>
                    </div>
                    <button onClick={() => setShowAddForm(false)} className="hover:rotate-90 transition-transform">
                      <XCircle size={24} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddQuestion} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                          <Compass size={16} /> الوحدة الدراسية
                        </label>
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                          value={newQuestion.unit}
                          onChange={(e) => setNewQuestion({...newQuestion, unit: e.target.value as Unit})}
                        >
                          {units.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                          <CheckCircle2 size={16} /> الإجابة الصحيحة
                        </label>
                        <select 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                          value={newQuestion.correctAnswer}
                          onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value as any})}
                        >
                          <option value="a">الخيار (A)</option>
                          <option value="b">الخيار (B)</option>
                          <option value="c">الخيار (C)</option>
                          <option value="d">الخيار (D)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <FileText size={16} /> الموقف السلوكي (Scenario)
                      </label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                        placeholder="اكتب الموقف أو السياق الذي يُبنى عليه السؤال..."
                        value={newQuestion.scenario}
                        onChange={(e) => setNewQuestion({...newQuestion, scenario: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <HelpCircle size={16} /> نص السؤال
                      </label>
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        placeholder="ما هو السؤال المطلوب بناءً على الموقف أعلاه؟"
                        value={newQuestion.questionText}
                        onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['a', 'b', 'c', 'd'].map((opt) => (
                        <div key={opt} className="space-y-2">
                          <label className="text-xs font-black text-slate-500 uppercase">خيار ({opt.toUpperCase()})</label>
                          <input 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                            placeholder={`أدخل نص الخيار ${opt.toUpperCase()}`}
                            value={newQuestion.options?.[opt as keyof Question['options']]}
                            onChange={(e) => setNewQuestion({
                              ...newQuestion, 
                              options: { ...newQuestion.options as any, [opt]: e.target.value }
                            })}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                        <Info size={16} /> التفسير العلمي
                      </label>
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                        placeholder="اشرح لماذا هذه الإجابة هي الصحيحة من منظور النظرية..."
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="submit"
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        <Save size={20} /> حفظ السؤال في البنك
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Search & Filter Top Bar */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 items-center no-print">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="ابحث في المواقف أو نصوص الأسئلة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-right font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-bold text-sm shrink-0">
                  <span>{filteredQuestions.length} سؤال متاح</span>
                  <div className="w-px h-4 bg-slate-300 mx-2"></div>
                  <span>المجموعة: {selectedUnit}</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {filteredQuestions.map((q) => (
                  <article key={q.id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100 group overflow-hidden page-break">
                    <div className="p-6 md:p-8 space-y-8">
                      <div className="flex justify-between items-center no-print pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => toggleAnswer(q.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              showAnswers[q.id] 
                              ? 'bg-amber-100 text-amber-700 shadow-sm' 
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {showAnswers[q.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span>{showAnswers[q.id] ? 'إخفاء الإجابة' : 'عرض الإجابة النموذجية'}</span>
                          </button>
                          <button 
                            onClick={() => deleteQuestion(q.id)}
                            className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="حذف السؤال"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                       
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">#{q.id}</span>
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-black border border-indigo-100">{q.unit}</span>
                        </div>
                      </div>

                      {/* 1. Scenario Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                          <FileText size={18} />
                          <span>الموقف السلوكي الملحوظ:</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border-r-4 border-indigo-400 text-slate-700 leading-relaxed font-medium italic shadow-inner">
                          {q.scenario}
                        </div>
                      </div>

                      {/* 2. Question Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                          <CircleHelp size={18} />
                          <span>المطلوب تحليله وتفسيره:</span>
                        </div>
                        <div className="bg-amber-50/30 border border-amber-100 p-5 rounded-2xl shadow-sm">
                          <h3 className="text-xl font-black text-slate-900 leading-tight">
                            {q.questionText}
                          </h3>
                        </div>
                      </div>

                      {/* 3. Options Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                          <span>خيارات الاستجابة المقترحة:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
                          {Object.entries(q.options).map(([key, value]) => (
                            <div 
                              key={key}
                              className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                showAnswers[q.id] && q.correctAnswer === key
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-black shadow-md scale-[1.02]'
                                : 'bg-white border-slate-100 text-slate-700'
                              }`}
                            >
                              {showAnswers[q.id] && q.correctAnswer === key && (
                                <div className="bg-emerald-500 text-white p-1 rounded-full">
                                  <CheckCircle2 size={20} />
                                </div>
                              )}
                              <span className="text-right flex-1">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Print only answers */}
                      <div className="hidden print:block border-t-2 border-dashed pt-4 mt-4">
                        <p className="font-bold text-indigo-900">الإجابة النموذجية: ({q.correctAnswer.toUpperCase()}) - {q.options[q.correctAnswer]}</p>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed"><span className="font-black text-slate-800">التعليل العلمي:</span> {q.explanation}</p>
                      </div>

                      {showAnswers[q.id] && (
                        <div className="mt-4 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 no-print shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                              <Info size={24} className="shrink-0" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-indigo-900 text-base">التأصيل والتفسير العلمي للموقف:</p>
                              <p className="text-slate-700 font-bold leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {filteredQuestions.length === 0 && (
                  <div className="bg-white rounded-3xl p-20 text-center space-y-4 border border-dashed border-slate-300">
                    <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Search size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">لا توجد نتائج بحث مطابقة</h3>
                    <p className="text-slate-500 font-medium">جرب البحث بكلمات مفتاحية أخرى أو تغيير الوحدة المختارة من القائمة الجانبية.</p>
                    <button 
                      onClick={() => {setSearchQuery(''); setSelectedUnit('الكل');}}
                      className="text-indigo-600 font-black hover:underline px-6 py-2 bg-indigo-50 rounded-full transition-all"
                    >
                      إعادة ضبط الفلاتر
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer / Copyright */}
      <footer className="mt-20 py-10 border-t bg-white no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 opacity-50">
            <School size={24} />
            <div className="h-6 w-px bg-slate-300"></div>
            <p className="font-bold text-sm tracking-widest uppercase">جامعة العريش - كلية الآداب</p>
          </div>
          <p className="text-slate-400 text-xs font-bold text-center leading-relaxed">
            جميع الحقوق محفوظة للمنصة الأكاديمية للدكتور أحمد حمدي الغول &copy; {new Date().getFullYear()}<br/>
            صمم هذا البنك خصيصاً لتعزيز التفكير التحليلي والربط بين النظرية والتطبيق لطلاب قسم علم النفس.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
