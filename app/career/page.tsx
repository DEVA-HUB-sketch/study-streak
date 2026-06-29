"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { CareerRoadmap } from "@/app/api/career/route";

const CAREERS = [
  { id: "Full Stack Developer", icon: "💻", color: "#4895EF", desc: "Build complete web apps" },
  { id: "AI Engineer",          icon: "🤖", color: "#9B5DE5", desc: "LLMs, ML pipelines, RAG" },
  { id: "Data Scientist",       icon: "📊", color: "#52B788", desc: "Analytics & ML models" },
  { id: "UI/UX Designer",       icon: "🎨", color: "#F4A261", desc: "Design beautiful products" },
  { id: "Cyber Security",       icon: "🔒", color: "#E63946", desc: "Protect systems & data" },
  { id: "Cloud Engineer",       icon: "☁️",  color: "#4895EF", desc: "AWS, GCP, Azure infra" },
  { id: "DevOps",               icon: "⚙️",  color: "#D4A373", desc: "CI/CD, Docker, K8s" },
];

const PHASE_COLORS = ["#4895EF", "#52B788", "#D4A373", "#9B5DE5", "#F4A261"];

function levelColor(level: string) {
  if (level === "Beginner")     return "#52B788";
  if (level === "Intermediate") return "#D4A373";
  return "#E63946";
}

function priorityColor(priority: string) {
  if (priority === "Must")   return "#E63946";
  if (priority === "Should") return "#D4A373";
  return "#52B788";
}

export default function CareerPage() {
  const { user } = useCurrentUser();
  const [selectedCareer, setSelectedCareer] = useState("");
  const [currentSkills, setCurrentSkills]   = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [roadmap, setRoadmap]   = useState<CareerRoadmap | null>(null);
  const [openPhases, setOpenPhases] = useState<Record<number, boolean>>({});

  function togglePhase(idx: number) {
    setOpenPhases(prev => ({ ...prev, [idx]: !prev[idx] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCareer) {
      toast.error("Please select a career path.");
      return;
    }
    setLoading(true);
    setError("");
    setRoadmap(null);
    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career: selectedCareer, currentSkills, experienceYears }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setRoadmap(data as CareerRoadmap);
      setOpenPhases({ 0: true });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout user={user}>
      <div style={{ padding: "2rem", maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: "linear-gradient(135deg,#9B5DE5,#4895EF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>
              <Cpu size={22} color="#fff" />
            </div>
            <h1 style={{
              fontSize: "1.75rem", fontWeight: 700,
              color: "var(--text-primary)", margin: 0,
            }}>
              Career Roadmap Generator
            </h1>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            Select your target role and get a personalized, step-by-step learning roadmap.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Career Selection Grid */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{
              display: "block", fontWeight: 600, fontSize: "0.9rem",
              color: "var(--text-primary)", marginBottom: 12,
            }}>
              Choose a Career Path
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 12,
            }}>
              {CAREERS.map(c => {
                const selected = selectedCareer === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCareer(c.id)}
                    style={{
                      padding: "1rem",
                      borderRadius: 12,
                      border: `2px solid ${selected ? c.color : "var(--border)"}`,
                      background: selected
                        ? `${c.color}18`
                        : "var(--warm-white)",
                      cursor: "pointer",
                      boxShadow: selected
                        ? `0 0 0 3px ${c.color}30`
                        : "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
                    <div style={{
                      fontWeight: 600, fontSize: "0.85rem",
                      color: selected ? c.color : "var(--text-primary)",
                      marginBottom: 3,
                    }}>
                      {c.id}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                      {c.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom career input */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 8 }}>
              Or type a custom career path
            </label>
            <input
              type="text"
              value={CAREERS.some(c => c.id === selectedCareer) ? "" : selectedCareer}
              onChange={e => setSelectedCareer(e.target.value)}
              placeholder="e.g. Blockchain Developer, Game Developer, Embedded Systems…"
              style={{
                width: "100%", padding: "0.75rem 1rem", borderRadius: 10,
                border: `2px solid ${selectedCareer && !CAREERS.some(c => c.id === selectedCareer) ? "#E63946" : "var(--border)"}`,
                background: "var(--warm-white)", color: "var(--text-primary)",
                fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
              }}
            />
            {selectedCareer && !CAREERS.some(c => c.id === selectedCareer) && (
              <p style={{ fontSize: "0.75rem", color: "#E63946", marginTop: 4 }}>
                ✓ Custom career: &quot;{selectedCareer}&quot; — AI will generate a tailored roadmap
              </p>
            )}
          </div>

          {/* Current Skills */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{
              display: "block", fontWeight: 600, fontSize: "0.9rem",
              color: "var(--text-primary)", marginBottom: 8,
            }}>
              Current Skills
            </label>
            <textarea
              value={currentSkills}
              onChange={e => setCurrentSkills(e.target.value)}
              placeholder="e.g. Python basics, HTML/CSS..."
              rows={3}
              style={{
                width: "100%", padding: "0.75rem 1rem",
                borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--warm-white)", color: "var(--text-primary)",
                fontSize: "0.9rem", resize: "vertical",
                outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Experience */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{
              display: "block", fontWeight: 600, fontSize: "0.9rem",
              color: "var(--text-primary)", marginBottom: 8,
            }}>
              Years of Experience
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={experienceYears}
              onChange={e => setExperienceYears(Number(e.target.value))}
              style={{
                width: 120, padding: "0.65rem 1rem",
                borderRadius: 10, border: "1.5px solid var(--border)",
                background: "var(--warm-white)", color: "var(--text-primary)",
                fontSize: "0.9rem", outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "0.75rem 2rem",
              background: loading ? "#aaa" : "linear-gradient(135deg,#9B5DE5,#4895EF)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: "0.95rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Generating..." : "Generate Roadmap"}
          </button>
        </form>

        {/* Spin keyframes */}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "1.5rem", padding: "1rem 1.25rem",
            borderRadius: 10, background: "#E6394618",
            border: "1.5px solid #E63946",
            color: "#E63946", fontSize: "0.9rem", fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            marginTop: "2.5rem", display: "flex",
            flexDirection: "column", alignItems: "center", gap: 16,
          }}>
            <Loader2
              size={38}
              color="#9B5DE5"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
              Generating your roadmap…
            </p>
          </div>
        )}

        {/* Results */}
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: "2.5rem" }}
          >

            {/* Overview Card */}
            <div style={{
              padding: "1.5rem", borderRadius: 14,
              background: "#1e1e2e",
              marginBottom: "1.5rem",
              border: "1px solid #333",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ color: "#fff", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                  {roadmap.career}
                </h2>
                <span style={{
                  background: "#9B5DE522", color: "#9B5DE5",
                  border: "1px solid #9B5DE5",
                  borderRadius: 20, padding: "3px 14px",
                  fontSize: "0.8rem", fontWeight: 600,
                }}>
                  {roadmap.totalMonths} months total
                </span>
              </div>
              <p style={{ color: "#ccc", margin: "0.75rem 0 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
                {roadmap.overview}
              </p>
            </div>

            {/* Phases Accordion */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 12 }}>
                Learning Phases
              </h3>
              {roadmap.phases.map((phase, idx) => {
                const color = PHASE_COLORS[idx % PHASE_COLORS.length];
                const open  = !!openPhases[idx];
                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: 12, border: `1.5px solid ${color}44`,
                      marginBottom: 10, overflow: "hidden",
                    }}
                  >
                    {/* Phase Header */}
                    <button
                      type="button"
                      onClick={() => togglePhase(idx)}
                      style={{
                        width: "100%", display: "flex",
                        alignItems: "center", justifyContent: "space-between",
                        padding: "0.9rem 1.2rem",
                        background: `${color}18`,
                        border: "none", cursor: "pointer",
                        borderBottom: open ? `1px solid ${color}33` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          background: color, color: "#fff",
                          borderRadius: 8, padding: "2px 10px",
                          fontSize: "0.8rem", fontWeight: 700,
                        }}>
                          {phase.phase}
                        </span>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                          {phase.theme}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                          ({phase.months})
                        </span>
                      </div>
                      {open
                        ? <ChevronUp size={18} color={color} />
                        : <ChevronDown size={18} color={color} />
                      }
                    </button>

                    {/* Phase Body */}
                    {open && (
                      <div style={{ padding: "1.1rem 1.2rem", background: "var(--warm-white)" }}>

                        {/* Skills Pills */}
                        {phase.skills.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                              SKILLS
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {phase.skills.map((sk, si) => (
                                <span
                                  key={si}
                                  style={{
                                    background: `${color}18`, color: color,
                                    border: `1px solid ${color}55`,
                                    borderRadius: 20, padding: "3px 12px",
                                    fontSize: "0.8rem", fontWeight: 500,
                                  }}
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Projects */}
                        {phase.projects.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                              PROJECTS
                            </div>
                            {phase.projects.map((proj, pi) => (
                              <div key={pi} style={{ marginBottom: 8 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                                  {proj.name}
                                </div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 4 }}>
                                  {proj.description}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                  {proj.tech.map((t, ti) => (
                                    <span
                                      key={ti}
                                      style={{
                                        background: "#33333318", color: "var(--text-secondary)",
                                        border: "1px solid var(--border)",
                                        borderRadius: 6, padding: "1px 8px",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Resources */}
                        {phase.resources.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                              RESOURCES
                            </div>
                            {phase.resources.map((res, ri) => (
                              <div key={ri} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{
                                  background: "#4895EF22", color: "#4895EF",
                                  border: "1px solid #4895EF55",
                                  borderRadius: 6, padding: "1px 8px",
                                  fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
                                }}>
                                  {res.type}
                                </span>
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: "#4895EF", fontSize: "0.84rem",
                                    textDecoration: "none", fontWeight: 500,
                                  }}
                                >
                                  {res.name}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Milestone */}
                        <div style={{
                          padding: "0.6rem 1rem",
                          borderRadius: 8, background: `${color}14`,
                          border: `1px solid ${color}44`,
                          fontSize: "0.85rem", color: color, fontWeight: 600,
                        }}>
                          Milestone: {phase.milestone}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Core Skills Grid */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 12 }}>
                Core Skills
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}>
                {roadmap.coreSkills.map((skill, si) => (
                  <div
                    key={si}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: 10, border: "1.5px solid var(--border)",
                      background: "var(--warm-white)",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)", marginBottom: 6 }}>
                      {skill.name}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        background: `${levelColor(skill.level)}22`,
                        color: levelColor(skill.level),
                        border: `1px solid ${levelColor(skill.level)}55`,
                        borderRadius: 12, padding: "2px 9px",
                        fontSize: "0.72rem", fontWeight: 600,
                      }}>
                        {skill.level}
                      </span>
                      <span style={{
                        background: `${priorityColor(skill.priority)}22`,
                        color: priorityColor(skill.priority),
                        border: `1px solid ${priorityColor(skill.priority)}55`,
                        borderRadius: 12, padding: "2px 9px",
                        fontSize: "0.72rem", fontWeight: 600,
                      }}>
                        {skill.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Roles + Salary */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderRadius: 14, border: "1.5px solid var(--border)",
              background: "var(--warm-white)",
              marginBottom: "1.5rem",
            }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 12, marginTop: 0 }}>
                Job Roles &amp; Salary
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {roadmap.jobRoles.map((role, ri) => (
                  <span
                    key={ri}
                    style={{
                      background: "#52B78822", color: "#52B788",
                      border: "1px solid #52B78844",
                      borderRadius: 20, padding: "4px 14px",
                      fontSize: "0.82rem", fontWeight: 500,
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#52B78814",
                border: "1.5px solid #52B78855",
                borderRadius: 10, padding: "6px 14px",
              }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Salary Range</span>
                <span style={{ color: "#52B788", fontWeight: 700, fontSize: "0.9rem" }}>{roadmap.salaryRange}</span>
              </div>
            </div>

            {/* Interview Topics */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderRadius: 14, border: "1.5px solid var(--border)",
              background: "var(--warm-white)",
              marginBottom: "1.5rem",
            }}>
              <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 12, marginTop: 0 }}>
                Interview Topics
              </h3>
              <ul style={{ margin: 0, padding: "0 0 0 18px" }}>
                {roadmap.interviewTopics.map((topic, ti) => (
                  <li key={ti} style={{ color: "var(--text-primary)", fontSize: "0.88rem", marginBottom: 6 }}>
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            {/* Career Tip */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderRadius: 14,
              background: "#D4A37318",
              border: "1.5px solid #D4A37355",
            }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#D4A373", marginBottom: 6, letterSpacing: 1 }}>
                CAREER TIP
              </div>
              <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.92rem", lineHeight: 1.65 }}>
                {roadmap.careerTip}
              </p>
            </div>

          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
