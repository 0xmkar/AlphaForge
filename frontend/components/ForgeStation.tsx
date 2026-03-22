"use client";

import { motion, MotionValue, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useEffect, useState, useId } from "react";

interface ForgeStationProps {
  smoothProgress: MotionValue<number>;
  activationStart: number;
  activationEnd: number;
  title: string;
  description: string;
  stationIndex: number;
  intelligenceStates: string[];
}

function IntelligenceIndicator({ active, states }: { active: boolean; states: string[] }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhraseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % states.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [active, states]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "1.2rem",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.4rem",
        width: "100%",
      }}
    >
      {/* Pulsing dots */}
      <div style={{ display: "flex", gap: "5px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: active ? "var(--lava-hot)" : "var(--stone-dark)",
              animation: active
                ? `dot-pulse 1.1s ease-in-out ${i * 0.2}s infinite`
                : "none",
              transition: "background 0.4s",
            }}
          />
        ))}
      </div>
      {/* Intelligence phrase */}
      <AnimatePresence mode="wait">
        <motion.span
          key={active ? phraseIndex : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            fontFamily: "Inter, monospace",
            color: active ? "var(--lava-hot)" : "var(--stone-dark)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            opacity: active ? 1 : 0.4,
          }}
        >
          {active ? states[phraseIndex] : "Standby"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function ForgeStation({
  smoothProgress,
  activationStart,
  activationEnd,
  title,
  description,
  stationIndex,
  intelligenceStates,
}: ForgeStationProps) {
  const uid = useId().replace(/:/g, "");

  const fillFraction = useTransform(
    smoothProgress,
    [activationStart, activationEnd],
    [0, 1],
    { clamp: true }
  );

  // Scale spring for activation pop
  const rawScale = useTransform(fillFraction, [0, 0.5, 1], [1, 1.03, 1]);
  const scale = useSpring(rawScale, { stiffness: 200, damping: 18 });

  // Glow intensity
  const glowOpacity = useTransform(fillFraction, [0, 1], [0, 1]);

  // Fill height for the lava level inside pot
  const fillHeight = useTransform(fillFraction, [0, 1], [0, 110]);
  const fillY = useTransform(fillHeight, (h) => 130 - h);

  // Track active state for intelligence indicators
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    const unsub = fillFraction.on("change", (v) => setIsActive(v > 0.15));
    return unsub;
  }, [fillFraction]);

  // Pulse ring opacity — triggers on activation
  const pulseOpacity = useTransform(fillFraction, [0, 0.2, 0.8, 1], [0, 0.8, 0.5, 0]);

  const size = 180;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        position: "relative",
      }}
    >
      {/* Ambient floor glow */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,107,0,0.25) 0%, transparent 70%)",
          filter: "blur(20px)",
          opacity: glowOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Pulse ring 1 */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size + 20,
          height: size + 20,
          marginTop: -(size + 20) / 2,
          marginLeft: -(size + 20) / 2,
          borderRadius: "50%",
          border: "2px solid rgba(255,107,0,0.5)",
          opacity: pulseOpacity,
          animation: isActive ? "pulse-ring 1.8s ease-out infinite" : "none",
          pointerEvents: "none",
        }}
      />
      {/* Pulse ring 2 (offset) */}
      <motion.div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: size + 40,
          height: size + 40,
          marginTop: -(size + 40) / 2,
          marginLeft: -(size + 40) / 2,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,69,0,0.3)",
          opacity: pulseOpacity,
          animation: isActive ? "pulse-ring 1.8s ease-out 0.5s infinite" : "none",
          pointerEvents: "none",
        }}
      />

      {/* Main pot */}
      <motion.div style={{ scale }}>
        <svg width={size} height={size} viewBox="0 0 180 180" fill="none">
          <defs>
            <linearGradient id={`pot-body-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1008" />
              <stop offset="40%" stopColor="#2e1c0c" />
              <stop offset="100%" stopColor="#0d0804" />
            </linearGradient>

            <linearGradient id={`pot-rim-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a3020" />
              <stop offset="100%" stopColor="#1a0e06" />
            </linearGradient>

            <linearGradient
              id={`lava-fill-${uid}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#FFD580" />
              <stop offset="30%" stopColor="#FF6B00" />
              <stop offset="70%" stopColor="#FF4500" />
              <stop offset="100%" stopColor="#FF2200" stopOpacity="0.7" />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                from="0 -8"
                to="0 8"
                dur="1.2s"
                repeatCount="indefinite"
                additive="sum"
              />
            </linearGradient>

            <filter id={`pot-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id={`lava-outer-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="8" />
            </filter>

            <clipPath id={`pot-clip-${uid}`}>
              {/* Pot interior shape */}
              <path d="M40 55 L50 145 Q90 155 130 145 L140 55 Z" />
            </clipPath>
          </defs>

          {/* Station index label (top left badge) */}
          <circle cx={22} cy={22} r={14} fill="rgba(255,69,0,0.15)" />
          <text
            x={22}
            y={27}
            textAnchor="middle"
            fill="var(--lava-hot)"
            fontSize={14}
            fontFamily="Outfit, sans-serif"
            fontWeight="700"
          >
            {stationIndex + 1}
          </text>

          {/* Pot outer rim */}
          <path
            d="M35 52 L145 52"
            stroke={`url(#pot-rim-${uid})`}
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Rim highlight */}
          <path
            d="M36 47 L144 47"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
            strokeLinecap="round"
          />

          {/* Pot body */}
          <path
            d="M40 55 L50 145 Q90 155 130 145 L140 55 Z"
            fill={`url(#pot-body-${uid})`}
          />
          {/* Inner shadow left wall */}
          <path
            d="M45 58 L55 142"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Inner shadow right wall */}
          <path
            d="M135 58 L125 142"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Inner highlight (left glint) */}
          <path
            d="M48 60 L56 136"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Lava fill — blurred glow behind */}
          <g clipPath={`url(#pot-clip-${uid})`}>
            <motion.rect
              x={40}
              y={fillY}
              width={100}
              height={fillHeight}
              fill={`url(#lava-fill-${uid})`}
              filter={`url(#lava-outer-${uid})`}
              opacity={0.4}
            />
            <motion.rect
              x={40}
              y={fillY}
              width={100}
              height={fillHeight}
              fill={`url(#lava-fill-${uid})`}
              filter={`url(#pot-glow-${uid})`}
            />

            {/* Lava surface shimmer line */}
            <motion.line
              x1={42}
              y1={fillY}
              x2={138}
              y2={fillY}
              stroke="#FFD580"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              filter={`url(#pot-glow-${uid})`}
            />
          </g>

          {/* Pot rim border (over lava) */}
          <path
            d="M40 55 L50 145 Q90 155 130 145 L140 55 Z"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={1.5}
          />
        </svg>

        {/* Intelligence indicator overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
          }}
        >
          <IntelligenceIndicator active={isActive} states={intelligenceStates} />
        </div>
      </motion.div>

      {/* Label below pot */}
      <motion.div
        style={{
          textAlign: "center",
          opacity: useTransform(fillFraction, [0, 0.3], [0.3, 1]),
        }}
      >
        <h3
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: isActive ? "var(--lava-hot)" : "var(--stone-wall)",
            transition: "color 0.5s",
            marginBottom: "0.4rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--stone-dark)",
            maxWidth: 200,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </motion.div>
    </div>
  );
}
