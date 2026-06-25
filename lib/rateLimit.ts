/**
 * MongoDB-backed rate limiter — works in serverless / Vercel environments
 * where in-memory Maps reset between invocations.
 */
import mongoose, { Schema, Model } from "mongoose";
import { connectDB } from "@/lib/mongodb";

interface IRateLimit {
  key:     string;
  count:   number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    key:     { type: String, required: true, unique: true },
    count:   { type: Number, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { collection: "rate_limits" }
);

// TTL index: MongoDB auto-deletes expired documents
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitModel: Model<IRateLimit> =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export interface RateLimitResult {
  success:   boolean;
  remaining: number;
  retryAfter?: number; // seconds
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  try {
    await connectDB();

    const now     = new Date();
    const resetAt = new Date(now.getTime() + windowSec * 1000);

    // Atomic: increment count if window is still valid, otherwise reset
    const doc = await RateLimitModel.findOneAndUpdate(
      { key: identifier },
      [
        {
          $set: {
            count: {
              $cond: {
                if:   { $gt: ["$resetAt", now] },
                then: { $add: ["$count", 1] },
                else: 1,
              },
            },
            resetAt: {
              $cond: {
                if:   { $gt: ["$resetAt", now] },
                then: "$resetAt",
                else: resetAt,
              },
            },
          },
        },
      ],
      { upsert: true, new: true }
    );

    if (doc.count > limit) {
      const retryAfter = Math.ceil((doc.resetAt.getTime() - now.getTime()) / 1000);
      return { success: false, remaining: 0, retryAfter };
    }

    return { success: true, remaining: limit - doc.count };
  } catch {
    // Fail open — never block requests due to rate-limit DB errors
    return { success: true, remaining: limit };
  }
}
