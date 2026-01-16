
export enum Unit {
  INTRODUCTION = "مدخل إلى الشخصية",
  FREUD = "نظرية التحليل النفسي (فرويد)",
  MODERN_PSYCHOANALYSIS = "التحليل النفسي الحديث",
  BEHAVIORISM = "النظرية السلوكية",
  COGNITIVE = "النظرية المعرفية",
  HUMANISM = "النظرية الإنسانية",
  TRAITS = "نظرية السمات",
  INTEGRATION = "المقارنة والتكامل"
}

export interface Question {
  id: number;
  unit: Unit;
  scenario: string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: keyof Question['options'];
  explanation: string;
}

export interface ExamInfo {
  instructor: string;
  faculty: string;
  department: string;
  university: string;
  level: string;
  year: string;
  courseTitle: string;
}
