"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { useId } from "react";

interface LavaGutterProps {
  smoothProgress: MotionValue<number>;
  gutterStart: number;
}

export default function LavaGutter({ smoothProgress, gutterStart }: LavaGutterProps) {
  const uid = useId().replace(/:/g, "");

  // Fill fraction for the gutter: 0→1 over the last portion of scroll
  const fillFraction = useTransform(
    smoothProgress,
    [gutterStart, 1.0],
    [0, 1],
    { clamp: true }
  );

  // Glow intensity ramps up
  const glowOpacity = useTransform(fillFraction, [0, 0.4, 1], [0, 0.6, 1]);
  const glowBlur = useTransform(fillFraction, [0, 1], [10, 30]);

  // Drip speed: scale Y of drip elements that animate off-screen
  const dripSpeed = useTransform(fillFraction, [0, 1], [0.6, 1.8]);

  const gutterW = 40;
  const gutterH = 120;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Outer glow intensifies with scroll */}
      <motion.div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 160,
          height: 160,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,69,0,0.6) 0%, rgba(255,107,0,0.3) 40%, transparent 70%)",
          opacity: glowOpacity,
          filter: "blur(16px)",
          pointerEvents: "none",
        }}
      />

      {/* Gutter SVG */}
      <svg
        width={gutterW + 20}
        height={gutterH + 40}
        viewBox={`0 0 ${gutterW + 20} ${gutterH + 40}`}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`gutter-grad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD580" />
            <stop offset="25%" stopColor="#FF6B00" />
            <stop offset="65%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF2200" stopOpacity="0.5" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 -10"
              to="0 20"
              dur="0.8s"
              repeatCount="indefinite"
              additive="sum"
            />
          </linearGradient>

          <linearGradient id={`gutter-body-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#050302" />
            <stop offset="30%" stopColor="#2a1c10" />
            <stop offset="70%" stopColor="#2a1c10" />
            <stop offset="100%" stopColor="#050302" />
          </linearGradient>

          <filter id={`gutter-glow-${uid}`} x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`gutter-intense-glow-${uid}`} x="-80%" y="-30%" width="260%" height="160%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.5 0.3 0 0 0  0.3 0.2 0 0 0  0 0 0 0 0  0 0 0 0.8 0"
            />
          </filter>

          <clipPath id={`gutter-clip-${uid}`}>
            <rect x={10} y={0} width={gutterW} height={gutterH} rx={3} />
          </clipPath>
        </defs>

        {/* Gutter body */}
        <rect x={10} y={0} width={gutterW} height={gutterH} rx={4} fill={`url(#gutter-body-${uid})`} />
        {/* Inner shadow */}
        <rect x={10} y={0} width={gutterW} height={gutterH} rx={4} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={4} />
        {/* Rim highlight */}
        <rect x={10} y={0} width={gutterW} height={gutterH} rx={4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

        {/* Lava draining down */}
        <g clipPath={`url(#gutter-clip-${uid})`}>
          {/* Blurred glow layer */}
          <motion.rect
            x={10}
            y={useTransform(fillFraction, [0, 1], [0, 0])}
            width={gutterW}
            height={useTransform(fillFraction, [0, 1], [0, gutterH])}
            fill={`url(#gutter-grad-${uid})`}
            filter={`url(#gutter-intense-glow-${uid})`}
            opacity={0.5}
          />
          {/* Main fill */}
          <motion.rect
            x={10}
            y={useTransform(fillFraction, [0, 1], [0, 0])}
            width={gutterW}
            height={useTransform(fillFraction, [0, 1], [0, gutterH])}
            fill={`url(#gutter-grad-${uid})`}
            filter={`url(#gutter-glow-${uid})`}
          />
        </g>

        {/* Drip elements falling off-screen */}
        {[0, 1, 2, 3].map((i) => (
          <motion.ellipse
            key={i}
            cx={10 + gutterW / 2 + (i % 2 === 0 ? 4 : -4)}
            cy={gutterH + 8 + i * 6}
            rx={4 - i}
            ry={7 - i}
            fill={`url(#gutter-grad-${uid})`}
            filter={`url(#gutter-glow-${uid})`}
            animate={{
              cy: [gutterH + 8 + i * 6, gutterH + 80 + i * 6],
              opacity: [0.9, 0],
              ry: [7 - i, 12 - i],
            }}
            transition={{
              duration: useTransform(dripSpeed, (s) => 0.6 / s) as any,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeIn",
            }}
          />
        ))}

        {/* Heat shimmer at gutter exit */}
        <motion.rect
          x={8}
          y={gutterH - 2}
          width={gutterW + 4}
          height={20}
          fill="rgba(255,107,0,0.15)"
          filter={`url(#gutter-glow-${uid})`}
          style={{ animation: "heat-shimmer 1s ease-in-out infinite" }}
          opacity={glowOpacity}
        />
      </svg>

      {/* "Execution Complete" label */}
      <motion.div
        style={{
          opacity: useTransform(fillFraction, [0.7, 1], [0, 1]),
          marginTop: "1rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--lava-hot)",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Alpha Forged
        </p>
        <motion.div
          style={{
            width: 80,
            height: 1,
            background: "linear-gradient(to right, transparent, var(--lava-glow), transparent)",
            margin: "0.4rem auto 0",
            opacity: glowOpacity,
          }}
        />
      </motion.div>
    </div>
  );
}
