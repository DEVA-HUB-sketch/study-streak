import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubject extends Document {
  userId: string;
  name: string;
  color: string;
  icon?: string;
  totalMinutes: number;
  sessionCount: number;
  createdAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId:       { type: String, default: "guest", index: true },
    name:         { type: String, required: true, trim: true },
    color:        { type: String, default: "#E63946" },
    icon:         { type: String, default: "📚" },
    totalMinutes: { type: Number, default: 0 },
    sessionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Subject: Model<ISubject> =
  mongoose.models.Subject ||
  mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
