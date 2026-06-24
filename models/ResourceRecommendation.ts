import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResourceItem { name: string; url: string; why: string; }

export interface IResourceRecommendation extends Document {
  userId:           string;
  subject:          string;
  topic:            string;
  difficulty:       string;
  goal:             string;
  youtubeChannels:  IResourceItem[];
  websites:         IResourceItem[];
  studyStrategy:    string[];
  roadmap:          string[];
  quickTips:        string[];
  createdAt:        Date;
}

const ItemSchema = new Schema<IResourceItem>(
  { name: String, url: String, why: String },
  { _id: false }
);

const ResourceRecommendationSchema = new Schema<IResourceRecommendation>(
  {
    userId:          { type: String, required: true, index: true },
    subject:         { type: String, required: true },
    topic:           { type: String, required: true },
    difficulty:      { type: String, default: "Intermediate" },
    goal:            { type: String, default: "" },
    youtubeChannels: { type: [ItemSchema], default: [] },
    websites:        { type: [ItemSchema], default: [] },
    studyStrategy:   { type: [String],    default: [] },
    roadmap:         { type: [String],    default: [] },
    quickTips:       { type: [String],    default: [] },
  },
  { timestamps: true }
);

const ResourceRecommendation: Model<IResourceRecommendation> =
  mongoose.models.ResourceRecommendation ||
  mongoose.model<IResourceRecommendation>("ResourceRecommendation", ResourceRecommendationSchema);

export default ResourceRecommendation;
