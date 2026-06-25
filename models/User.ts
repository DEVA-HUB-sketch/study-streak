import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name:                 string;
  email:                string;
  password?:            string;   // optional for Google/OAuth users
  googleId?:            string;
  authProvider:         "email" | "google";
  college?:             string;
  department?:          string;
  academicYear?:        string;
  goals?:               string;
  examTarget?:          string;
  targetCGPA?:          number;
  preferredStudyHours?: number;
  avatarUrl?:           string;
  totalRubies:          number;
  rank:                 string;
  /* password reset */
  resetToken?:          string;
  resetTokenExpiry?:    Date;
  createdAt:            Date;
  updatedAt:            Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:                 { type: String, required: true, trim: true },
    email:                { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:             { type: String, select: false },          // not required — Google users have no password
    googleId:             { type: String, sparse: true },           // sparse = unique only when present
    authProvider:         { type: String, enum: ["email", "google"], default: "email" },
    college:              { type: String, trim: true },
    department:           { type: String, trim: true },
    academicYear:         { type: String, trim: true },
    goals:                { type: String, trim: true },
    examTarget:           { type: String, trim: true },
    targetCGPA:           { type: Number, min: 0, max: 10 },
    preferredStudyHours:  { type: Number, min: 0, max: 24 },
    avatarUrl:            { type: String },
    totalRubies:          { type: Number, default: 0 },
    rank:                 { type: String, default: "Beginner" },
    resetToken:           { type: String, select: false },
    resetTokenExpiry:     { type: Date },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
