import mongoose, { Schema, Document, Model } from "mongoose";

const AdjSchema = new Schema(
  { subject: String, currentMinutes: Number, recommendedMinutes: Number, reason: String },
  { _id: false }
);

export interface IAgentState extends Document {
  userId:                    string;
  /* Daily Mission */
  mission:                   string;
  priority:                  string;
  studyGoal:                 string;
  suggestedDuration:         number;  // minutes
  bestStudyTime:             string;
  motivation:                string;
  warnings:                  string[];
  /* Performance Prediction */
  predictedExamScore:        number | null;
  predictedGrade:            string | null;
  examConfidence:            string;
  weakSubject:               string | null;
  strongSubject:             string | null;
  riskLevel:                 string;
  /* Agent Status */
  confidenceScore:           number;  // 0-100
  agentStatus:               string;  // Active | Monitoring | Alert | Recovery
  nextRecommendation:        string;
  /* Burnout */
  burnoutLevel:              string;  // None | Low | Medium | High | Critical
  burnoutRecommendation:     string;
  /* Reminder */
  studyReminder:             string | null;
  completedTodayMinutes:     number;
  plannedTodayMinutes:       number;
  /* Reports */
  dailyReport:               string;
  weeklyInsight:             string;
  /* Auto Timetable Rebalancing */
  timetableRebalanceNeeded:  boolean;
  timetableRebalanceReason:  string;
  timetableAdjustments:      { subject: string; currentMinutes: number; recommendedMinutes: number; reason: string }[];
  timetableRebalancedAt:     Date | null;
  /* Goal */
  goalProgress:              string | null;
  /* Cache */
  generatedAt:               Date;
  validUntil:                Date;
}

const AgentStateSchema = new Schema<IAgentState>(
  {
    userId:                    { type: String, required: true, unique: true, index: true },
    mission:                   { type: String, default: "" },
    priority:                  { type: String, default: "" },
    studyGoal:                 { type: String, default: "" },
    suggestedDuration:         { type: Number, default: 120 },
    bestStudyTime:             { type: String, default: "" },
    motivation:                { type: String, default: "" },
    warnings:                  { type: [String], default: [] },
    predictedExamScore:        { type: Number, default: null },
    predictedGrade:            { type: String, default: null },
    examConfidence:            { type: String, default: "Low" },
    weakSubject:               { type: String, default: null },
    strongSubject:             { type: String, default: null },
    riskLevel:                 { type: String, default: "Low" },
    confidenceScore:           { type: Number, default: 50 },
    agentStatus:               { type: String, default: "Monitoring" },
    nextRecommendation:        { type: String, default: "" },
    burnoutLevel:              { type: String, default: "None" },
    burnoutRecommendation:     { type: String, default: "" },
    studyReminder:             { type: String, default: null },
    completedTodayMinutes:     { type: Number, default: 0 },
    plannedTodayMinutes:       { type: Number, default: 120 },
    dailyReport:               { type: String, default: "" },
    weeklyInsight:             { type: String, default: "" },
    timetableRebalanceNeeded:  { type: Boolean, default: false },
    timetableRebalanceReason:  { type: String, default: "" },
    timetableAdjustments:      { type: [AdjSchema], default: [] },
    timetableRebalancedAt:     { type: Date, default: null },
    goalProgress:              { type: String, default: null },
    generatedAt:               { type: Date, default: Date.now },
    validUntil:                { type: Date, default: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

const AgentState: Model<IAgentState> =
  mongoose.models.AgentState ||
  mongoose.model<IAgentState>("AgentState", AgentStateSchema);

export default AgentState;
