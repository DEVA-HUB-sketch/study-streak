"use client";

import { useState, useEffect } from "react";

interface StudySession {
  _id: string;
  subject: string;
  duration: number;
  date: string;
  completed: boolean;
}

interface FormState {
  subject: string;
  duration: string;
  date: string;
}

const emptyForm: FormState = { subject: "", duration: "", date: "" };

export default function Home() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setFetching(true);
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: unknown = await res.json();
      setSessions(Array.isArray(data) ? (data as StudySession[]) : []);
    } catch (err) {
      console.error("fetchSessions:", err);
      setSessions([]);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        subject: form.subject,
        duration: Number(form.duration),
        date: form.date,
      };
      if (editingId) {
        await fetch(`/api/sessions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setEditingId(null);
      } else {
        await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setForm(emptyForm);
      await fetchSessions();
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(session: StudySession) {
    setEditingId(session._id);
    setForm({
      subject: session.subject,
      duration: String(session.duration),
      date: session.date.slice(0, 10),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    await fetchSessions();
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Study Streak</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Track your learning sessions
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-gray-800 rounded-xl px-5 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-indigo-400">
                {sessions.length}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Sessions</p>
            </div>
            <div className="bg-gray-800 rounded-xl px-5 py-3 text-center min-w-[90px]">
              <p className="text-2xl font-bold text-emerald-400">
                {totalMinutes}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Minutes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Form Card */}
        <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-base font-semibold mb-5">
            {editingId ? "Edit Session" : "Add Session"}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Subject
              </label>
              <input
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Mathematics"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">
                Duration (mins)
              </label>
              <input
                type="number"
                min="1"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. 60"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Date</label>
              <input
                type="date"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                required
              />
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {submitting
                  ? "Saving…"
                  : editingId
                  ? "Update Session"
                  : "Add Session"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-sm font-medium text-gray-400 hover:text-white px-5 py-2.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Sessions List */}
        <section>
          <h2 className="text-base font-semibold mb-4">Sessions</h2>
          {fetching ? (
            <div className="text-center text-gray-500 py-16 text-sm">
              Loading…
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center text-gray-500 text-sm">
              No sessions yet. Add one above to get started.
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li
                  key={session._id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <div>
                      <p className="font-medium text-white">{session.subject}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {session.duration} min &middot;{" "}
                        {new Date(session.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(session)}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 hover:bg-indigo-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session._id)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
