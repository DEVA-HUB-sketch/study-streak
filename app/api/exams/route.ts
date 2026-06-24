import { connectDB } from "@/lib/mongodb";
import ExamResult, { toGrade, toPercentage } from "@/models/ExamResult";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const results = await ExamResult.find({ userId: auth.userId }).sort({ examDate: -1 }).lean();
    return Response.json(results);
  } catch (err) {
    console.error("[GET /api/exams]", err);
    return Response.json({ error: "Failed to fetch exam results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getUserFromRequest(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectDB();
    const body = await request.json();
    const { subject, examName, examDate, marksObtained, totalMarks, studyHoursBeforeExam, notes } = body;
    if (!subject || !examName || !examDate || marksObtained == null || !totalMarks) {
      return Response.json({ error: "All required fields must be provided." }, { status: 400 });
    }
    if (marksObtained > totalMarks) {
      return Response.json({ error: "Marks obtained cannot exceed total marks." }, { status: 400 });
    }
    const pct  = toPercentage(Number(marksObtained), Number(totalMarks));
    const result = await ExamResult.create({
      userId: auth.userId, subject, examName, examDate,
      marksObtained: Number(marksObtained), totalMarks: Number(totalMarks),
      percentage: pct, grade: toGrade(pct),
      studyHoursBeforeExam: studyHoursBeforeExam ? Number(studyHoursBeforeExam) : undefined,
      notes: notes || undefined,
    });
    return Response.json(result, { status: 201 });
  } catch (err) {
    console.error("[POST /api/exams]", err);
    return Response.json({ error: "Failed to save exam result" }, { status: 500 });
  }
}
