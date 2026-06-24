import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExamResult extends Document {
  userId:                string;
  subject:               string;
  examName:              string;
  examDate:              string;
  marksObtained:         number;
  totalMarks:            number;
  percentage:            number;
  grade:                 string;
  studyHoursBeforeExam?: number;
  notes?:                string;
  createdAt:             Date;
}

export function toGrade(pct: number): string {
  if (pct >= 90) return "O";
  if (pct >= 75) return "A+";
  if (pct >= 60) return "A";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
}

export function toPercentage(marks: number, total: number): number {
  return Math.round((marks / total) * 100);
}

const ExamResultSchema = new Schema<IExamResult>(
  {
    userId:                { type: String, required: true, index: true },
    subject:               { type: String, required: true, trim: true },
    examName:              { type: String, required: true, trim: true },
    examDate:              { type: String, required: true },
    marksObtained:         { type: Number, required: true, min: 0 },
    totalMarks:            { type: Number, required: true, min: 1 },
    percentage:            { type: Number, default: 0 },
    grade:                 { type: String, default: "F" },
    studyHoursBeforeExam:  { type: Number, min: 0 },
    notes:                 { type: String, trim: true },
  },
  { timestamps: true }
);

const ExamResult: Model<IExamResult> =
  mongoose.models.ExamResult ||
  mongoose.model<IExamResult>("ExamResult", ExamResultSchema);

export default ExamResult;
