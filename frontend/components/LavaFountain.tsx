"use client";

import { motion } from "framer-motion";

// Spark particle element
function Spark({
  delay,
  x,
  size,
}: {
  delay: number;
  x: number;
  size: number;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: "10%",
        left: `calc(50% + ${x}px)`,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, #fff 0%, var(--lava-hot) 50%, transparent 100%)`,
        filter: "blur(0.5px)",
      }}
      animate={{
        y: [0, -50 - Math.random() * 30],
        x: [0, x * 0.4],
        opacity: [0, 0.9, 0],
        scale: [1, 0.5, 0],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.8,
        repeat: Infinity,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
}

export default function LavaFountain() {
  const sparks = [
    { delay: 0, x: -12, size: 3 },
    { delay: 0.3, x: 8, size: 2 },
    { delay: 0.6, x: -5, size: 4 },
    { delay: 0.9, x: 15, size: 2 },
    { delay: 1.2, x: -18, size: 3 },
    { delay: 1.5, x: 4, size: 2 },
    { delay: 0.15, x: 22, size: 2 },
    { delay: 0.75, x: -8, size: 3 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: 160,
        height: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Sparks */}
      {sparks.map((s, i) => (
        <Spark key={i} {...s} />
      ))}

      {/* Fountain SVG */}
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        style={{ position: "relative", zIndex: 1 }}
      >
        <defs>
          {/* Moving lava gradient */}
          <linearGradient id="lava-grad-fountain" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#FFB347" />
            <stop offset="70%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#FF2200" stopOpacity="0.6" />
          </linearGradient>

          {/* Blurred glow duplicate */}
          <filter id="fountain-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="fountain-blur-only">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Well / basin */}
        <ellipse cx="80" cy="138" rx="44" ry="10" fill="#1a1008" />
        <ellipse
          cx="80"
          cy="138"
          rx="44"
          ry="10"
          fill="none"
          stroke="#FF4500"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Glow pool under well */}
        <ellipse
          cx="80"
          cy="145"
          rx="36"
          ry="7"
          fill="rgba(255,69,0,0.25)"
          filter="url(#fountain-blur-only)"
        />

        {/* Main fountain arc — blurred glow layer */}
        <path
          d="M80 130 C80 100, 55 70, 60 30"
          stroke="#FF6B00"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          filter="url(#fountain-blur-only)"
        />
        <path
          d="M80 130 C80 100, 105 70, 100 30"
          stroke="#FF6B00"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
          filter="url(#fountain-blur-only)"
        />

        {/* Left arc */}
        <path
          d="M80 130 C80 100, 55 70, 60 30"
          stroke="url(#lava-grad-fountain)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          filter="url(#fountain-glow)"
        />

        {/* Right arc */}
        <path
          d="M80 130 C80 100, 105 70, 100 30"
          stroke="url(#lava-grad-fountain)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          filter="url(#fountain-glow)"
        />

        {/* Center drip */}
        <motion.ellipse
          cx="80"
          cy="30"
          rx="4"
          ry="6"
          fill="url(#lava-grad-fountain)"
          filter="url(#fountain-glow)"
          animate={{
            ry: [6, 14, 6],
            cy: [30, 90, 30],
            opacity: [1, 0.6, 1],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Crown splash dots */}
        {[-18, -8, 0, 8, 18].map((offset, i) => (
          <motion.circle
            key={i}
            cx={80 + offset}
            cy={28}
            r={2}
            fill="#FFB347"
            animate={{
              cy: [28, 18 - i * 2, 28],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      {/* Ambient glow halo below well */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 40,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(255,107,0,0.35) 0%, transparent 70%)",
          animation: "breathe-glow 2s ease-in-out infinite",
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}
