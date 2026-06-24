"use client";

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const PALETTE = ["#E63946","#4895EF","#52B788","#D4A373","#9B5DE5","#F4A261","#E9C46A","#2A9D8F"];

interface StudyChartProps {
  labels: string[];
  data: number[];
  subjectBreakdown: Record<string,number>;
}

export default function StudyChart({ labels, data, subjectBreakdown }: StudyChartProps) {
  const subjects  = Object.keys(subjectBreakdown);
  const subValues = Object.values(subjectBreakdown);
  const hasData   = data.some(v=>v>0);
  const hasSubs   = subjects.length > 0;

  const barOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ display:false },
      tooltip:{ callbacks:{ label:(ctx:any)=>`${ctx.raw} min` }, backgroundColor:"#1D1D1D", titleColor:"#fff", bodyColor:"rgba(255,255,255,0.7)", padding:10, cornerRadius:8 },
    },
    scales:{
      x:{ grid:{ display:false }, ticks:{ color:"#A0A0A0", maxTicksLimit:8, font:{ size:11 } }, border:{ display:false } },
      y:{ grid:{ color:"rgba(29,29,29,0.05)" }, ticks:{ color:"#A0A0A0", font:{ size:11 } }, border:{ display:false } },
    },
  };

  const barData = {
    labels,
    datasets:[{
      data,
      backgroundColor:(ctx:any)=>{
        const v=ctx.raw as number;
        return v>0?"rgba(230,57,70,0.75)":"rgba(29,29,29,0.06)";
      },
      borderRadius:6,
      borderSkipped:false,
      hoverBackgroundColor:"#E63946",
    }],
  };

  const doughnutData = {
    labels:subjects,
    datasets:[{
      data:subValues,
      backgroundColor:PALETTE.slice(0,subjects.length),
      borderWidth:0, hoverOffset:6,
    }],
  };

  const doughnutOptions = {
    responsive:true, maintainAspectRatio:false,
    plugins:{
      legend:{ position:"bottom" as const, labels:{ color:"#6B6B6B", font:{ size:11 }, padding:14, boxWidth:10, usePointStyle:true } },
      tooltip:{ backgroundColor:"#1D1D1D", titleColor:"#fff", bodyColor:"rgba(255,255,255,0.7)", padding:10, cornerRadius:8 },
    },
    cutout:"68%",
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 260px", gap:16 }}>
      {/* Bar chart */}
      <motion.div
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="card"
      >
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 className="t-h3" style={{ color:"var(--text-primary)" }}>30-Day Study Activity</h3>
          <span className="badge" style={{ background:"var(--cream)", color:"var(--text-secondary)" }}>
            Minutes / day
          </span>
        </div>
        <div style={{ height:180 }}>
          {hasData
            ? <Bar options={barOptions} data={barData}/>
            : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", fontSize:"0.875rem" }}>
                Log sessions to see your activity chart
              </div>
          }
        </div>
      </motion.div>

      {/* Doughnut */}
      <motion.div
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="card"
      >
        <h3 className="t-h3" style={{ color:"var(--text-primary)", marginBottom:16 }}>By Subject</h3>
        <div style={{ height:180 }}>
          {hasSubs
            ? <Doughnut options={doughnutOptions} data={doughnutData}/>
            : <div style={{ height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"var(--text-tertiary)", fontSize:"0.875rem", gap:8 }}>
                <span style={{ fontSize:"2rem" }}>🍩</span>
                <span>No subject data yet</span>
              </div>
          }
        </div>
      </motion.div>
    </div>
  );
}
