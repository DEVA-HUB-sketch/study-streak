import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudySession extends Document {
  subject: string;
  duration: number;
  date: Date;
  completed: boolean;
}

const StudySessionSchema = new Schema<IStudySession>({
  subject: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true },
  completed: { type: Boolean, default: true },
});

const StudySession: Model<IStudySession> =
  mongoose.models.StudySession ||
  mongoose.model<IStudySession>("StudySession", StudySessionSchema);

export default StudySession;
