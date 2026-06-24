import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPinnedTimetable extends Document {
  userId:              string;
  course:              string;
  subjects:            string;
  examDate:            string;
  studyHours:          string;
  examReadinessScore:  number;
  timetable:           { slot: string; subject: string; activity: string; duration: string }[];
  weeklyRoadmap:       { week: string; theme: string; goals: string[] }[];
  reviewed:            boolean;
  reviewRating?:       number;
  reviewText?:         string;
  createdAt:           Date;
}

const TimetableRowSchema = new Schema(
  { slot: String, subject: String, activity: String, duration: String },
  { _id: false }
);

const RoadmapWeekSchema = new Schema(
  { week: String, theme: String, goals: [String] },
  { _id: false }
);

const PinnedTimetableSchema = new Schema<IPinnedTimetable>(
  {
    userId:             { type: String, required: true, unique: true },
    course:             { type: String, default: "" },
    subjects:           { type: String, default: "" },
    examDate:           { type: String, required: true },
    studyHours:         { type: String, default: "6" },
    examReadinessScore: { type: Number, default: 0 },
    timetable:          { type: [TimetableRowSchema], default: [] },
    weeklyRoadmap:      { type: [RoadmapWeekSchema],  default: [] },
    reviewed:           { type: Boolean, default: false },
    reviewRating:       { type: Number },
    reviewText:         { type: String },
  },
  { timestamps: true }
);

const PinnedTimetable: Model<IPinnedTimetable> =
  mongoose.models.PinnedTimetable ||
  mongoose.model<IPinnedTimetable>("PinnedTimetable", PinnedTimetableSchema);

export default PinnedTimetable;
