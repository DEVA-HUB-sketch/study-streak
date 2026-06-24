import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  college?: string;
  department?: string;
  avatarUrl?: string;
  totalRubies: number;
  rank: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true, select: false },
    college:     { type: String, trim: true },
    department:  { type: String, trim: true },
    avatarUrl:   { type: String },
    totalRubies: { type: Number, default: 0 },
    rank:        { type: String, default: "Beginner" },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
