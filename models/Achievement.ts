import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAchievement extends Document {
  userId: string;
  badgeId: string;
  unlockedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    userId:     { type: String, default: "guest", index: true },
    badgeId:    { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AchievementSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);

export default Achievement;
