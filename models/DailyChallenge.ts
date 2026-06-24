import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyChallenge extends Document {
  userId: string;
  challengeId: string;
  date: string; // "YYYY-MM-DD"
  target: number;
  unit: "sessions" | "minutes";
  progress: number;
  completed: boolean;
  rubyReward: number;
  rewardClaimed: boolean;
}

const DailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    userId:        { type: String, default: "guest", index: true },
    challengeId:   { type: String, required: true },
    date:          { type: String, required: true },
    target:        { type: Number, required: true },
    unit:          { type: String, enum: ["sessions", "minutes"], required: true },
    progress:      { type: Number, default: 0 },
    completed:     { type: Boolean, default: false },
    rubyReward:    { type: Number, required: true },
    rewardClaimed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DailyChallengeSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyChallenge: Model<IDailyChallenge> =
  mongoose.models.DailyChallenge ||
  mongoose.model<IDailyChallenge>("DailyChallenge", DailyChallengeSchema);

export default DailyChallenge;
