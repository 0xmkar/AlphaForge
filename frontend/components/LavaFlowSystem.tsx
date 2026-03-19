"use client";

import { useRef } from "react";
import { useScroll, useSpring } from "framer-motion";
import LavaPath from "@/components/LavaPath";
import ForgeStation from "@/components/ForgeStation";
import LavaGutter from "@/components/LavaGutter";
import SparkParticles from "@/components/SparkParticles";

const STATIONS = [
  {
    title: "Signal Ingestion",
    description: "Raw market data streams are captured and normalized in real time.",
  },
  {
    title: "Regime Detection",
    description: "Market regimes and macro conditions are classified across timeframes.",
  },
  {
    title: "Alpha Synthesis",
    description: "Multi-factor models converge on high-confidence opportunity sets.",
  },
  {
    title: "Execution Forging",
    description: "Strategies are forged into precise, risk-adjusted execution signals.",
  },
];

// Activation windows for each station (scroll 0→1)
const STATION_WINDOWS = [
  { start: 0.05, end: 0.22 },
  { start: 0.25, end: 0.42 },
  { start: 0.45, end: 0.62 },
  { start: 0.65, end: 0.82 },
];

const PIPE_WINDOWS = [
  { start: 0.0, end: 0.07 },   // entry pipe
  { start: 0.2, end: 0.27 },   // pipe 1→2
  { start: 0.4, end: 0.47 },   // pipe 2→3
  { start: 0.6, end: 0.67 },   // pipe 3→4
  { start: 0.82, end: 0.94 },  // pipe 4 → gutter
];

const STATION_POSITIONS = [
  { left: 140, top: 200, dropX: 230, dropY: 250, exitX: 230, exitY: 345 },
  { left: 480, top: 600, dropX: 570, dropY: 650, exitX: 570, exitY: 745 },
  { left: 140, top: 1000, dropX: 230, dropY: 1050, exitX: 230, exitY: 1145 },
  { left: 480, top: 1400, dropX: 570, dropY: 1450, exitX: 570, exitY: 1545 },
];

function drawPipe(startX: number, startY: number, endX: number, endY: number, radius = 40) {
  const isRight = endX > startX;
  if (startX === endX) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
  const midY = startY + (endY - startY) / 2;
  const r = radius;
  let d = `M ${startX} ${startY} `;
  d += `L ${startX} ${midY - r} `;
  d += `A ${r} ${r} 0 0 ${isRight ? 0 : 1} ${startX + (isRight ? r : -r)} ${midY} `;
  d += `L ${endX - (isRight ? r : -r)} ${midY} `;
  d += `A ${r} ${r} 0 0 ${isRight ? 1 : 0} ${endX} ${midY + r} `;
  d += `L ${endX} ${endY}`;
  return d;
}

export default function LavaFlowSystem() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 28,
    restDelta: 0.001,
  });

  const LAYOUT_W = 800;
  const LAYOUT_H = 2200;

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {/* Fixed background effects */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 40% 70% at 50% 50%, rgba(255,69,0,0.06) 0%, transparent 70%)",
          }}
        />
        <SparkParticles />
      </div>

      {/* Scrolling Pipeline Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: LAYOUT_W,
          height: LAYOUT_H,
          margin: "0 auto",
          zIndex: 1,
        }}
      >
        {/* SVG Pipeline Paths (rendered behind stations) */}
        
        {/* Entry pipe */}
        <LavaPath 
          pathD={drawPipe(400, 0, STATION_POSITIONS[0].dropX, STATION_POSITIONS[0].dropY)} 
          smoothProgress={smoothProgress} 
          startFill={PIPE_WINDOWS[0].start} 
          endFill={PIPE_WINDOWS[0].end} 
        />

        {/* Connector Pipes */}
        {STATIONS.map((_, i) => {
          if (i === STATIONS.length - 1) return null;
          const pos = STATION_POSITIONS[i];
          const nextPos = STATION_POSITIONS[i + 1];
          return (
            <LavaPath
              key={`pipe-${i}`}
              pathD={drawPipe(pos.exitX, pos.exitY, nextPos.dropX, nextPos.dropY)}
              smoothProgress={smoothProgress}
              startFill={PIPE_WINDOWS[i + 1].start}
              endFill={PIPE_WINDOWS[i + 1].end}
            />
          );
        })}

        {/* Exit pipe into gutter */}
        <LavaPath 
          pathD={drawPipe(STATION_POSITIONS[3].exitX, STATION_POSITIONS[3].exitY, 570, 1900)} 
          smoothProgress={smoothProgress} 
          startFill={PIPE_WINDOWS[4].start} 
          endFill={PIPE_WINDOWS[4].end} 
        />

        {/* Stations rendering ATOP the SVG Paths */}
        {STATIONS.map((station, i) => {
          const pos = STATION_POSITIONS[i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                width: 180,
              }}
            >
              <ForgeStation
                smoothProgress={smoothProgress}
                activationStart={STATION_WINDOWS[i].start}
                activationEnd={STATION_WINDOWS[i].end}
                title={station.title}
                description={station.description}
                stationIndex={i}
              />
            </div>
          );
        })}

        {/* Bottom gutter */}
        <div style={{ position: "absolute", left: 570, top: 1900, transform: "translateX(-50%)" }}>
          <LavaGutter smoothProgress={smoothProgress} gutterStart={0.88} />
        </div>
      </div>
    </section>
  );
}
