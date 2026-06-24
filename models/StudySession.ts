import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudySession extends Document {
  userId: string;
  subject: string;
  subjectId?: string;
  duration: number;
  date: Date;
  completed: boolean;
  notes?: string;
  createdAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId:    { type: String, default: "guest", index: true },
    subject:   { type: String, required: true, trim: true },
    subjectId: { type: String },
    duration:  { type: Number, required: true, min: 1 },
    date:      { type: Date, required: true },
    completed: { type: Boolean, default: true },
    notes:     { type: String, trim: true },
  },
  { timestamps: true }
);

const StudySession: Model<IStudySession> =
  mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
