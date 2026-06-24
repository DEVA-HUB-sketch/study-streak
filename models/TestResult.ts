import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion {
  question:      string;
  options:       string[];   // 4 choices A–D
  correctAnswer: number;     // 0-based index into options
  explanation:   string;
  userAnswer?:   number;     // set after submission
}

export interface ITestResult extends Document {
  userId:         string;
  subject:        string;
  topic:          string;
  difficulty:     string;
  questions:      IQuestion[];
  score:          number;
  totalQuestions: number;
  percentage:     number;
  createdAt:      Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    question:      { type: String, required: true },
    options:       { type: [String], required: true },
    correctAnswer: { type: Number, required: true },
    explanation:   { type: String, default: "" },
    userAnswer:    { type: Number },
  },
  { _id: false }
);

const TestResultSchema = new Schema<ITestResult>(
  {
    userId:         { type: String, required: true, index: true },
    subject:        { type: String, required: true },
    topic:          { type: String, required: true },
    difficulty:     { type: String, default: "Medium" },
    questions:      { type: [QuestionSchema], default: [] },
    score:          { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    percentage:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TestResult: Model<ITestResult> =
  mongoose.models.TestResult ||
  mongoose.model<ITestResult>("TestResult", TestResultSchema);

export default TestResult;
