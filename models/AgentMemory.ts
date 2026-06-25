import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal {
  description:  string;
  targetDate?:  string;
  milestones:   string[];
  progress:     number;   // 0-100
  completed:    boolean;
  createdAt:    Date;
}

export interface IAgentMemory extends Document {
  userId:                string;
  /* Preferences (learned from behaviour) */
  preferredStudyTime:    string;   // e.g. "Evening (6–10 PM)"
  learningStyle:         string;   // e.g. "Visual, problem-solving"
  /* Academic profile */
  weakSubjects:          string[];
  strongSubjects:        string[];
  targetCGPA:            number | null;
  examGoals:             string;
  /* Behavioural patterns */
  avgSessionDuration:    number;   // minutes
  consistencyPattern:    string;   // e.g. "Consistent Mon–Fri, drops on weekends"
  totalInteractions:     number;
  /* Long-term goals */
  activeGoals:           IGoal[];
  /* Conversation / session summaries for context injection */
  conversationSummaries: { summary: string; date: Date }[];
  updatedAt:             Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    description: { type: String, required: true },
    targetDate:  { type: String },
    milestones:  { type: [String], default: [] },
    progress:    { type: Number, default: 0 },
    completed:   { type: Boolean, default: false },
    createdAt:   { type: Date, default: Date.now },
  },
  { _id: false }
);

const SummarySchema = new Schema(
  { summary: String, date: { type: Date, default: Date.now } },
  { _id: false }
);

const AgentMemorySchema = new Schema<IAgentMemory>(
  {
    userId:                { type: String, required: true, unique: true, index: true },
    preferredStudyTime:    { type: String, default: "Not determined" },
    learningStyle:         { type: String, default: "Not determined" },
    weakSubjects:          { type: [String], default: [] },
    strongSubjects:        { type: [String], default: [] },
    targetCGPA:            { type: Number, default: null },
    examGoals:             { type: String, default: "" },
    avgSessionDuration:    { type: Number, default: 0 },
    consistencyPattern:    { type: String, default: "Insufficient data" },
    totalInteractions:     { type: Number, default: 0 },
    activeGoals:           { type: [GoalSchema], default: [] },
    conversationSummaries: { type: [SummarySchema], default: [] },
  },
  { timestamps: true }
);

const AgentMemory: Model<IAgentMemory> =
  mongoose.models.AgentMemory ||
  mongoose.model<IAgentMemory>("AgentMemory", AgentMemorySchema);

export default AgentMemory;
