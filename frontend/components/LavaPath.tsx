"use client";

import { motion, MotionValue, useTransform } from "framer-motion";
import { useId } from "react";

interface LavaPathProps {
  pathD: string;
  smoothProgress: MotionValue<number>;
  startFill: number;
  endFill: number;
}

export default function LavaPath({ pathD, smoothProgress, startFill, endFill }: LavaPathProps) {
  const uid = useId().replace(/:/g, "");

  const fillFraction = useTransform(smoothProgress, [startFill, endFill], [0, 1], {
    clamp: true,
  });

  return (
    <svg 
      className="lava-path-svg" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        overflow: 'visible' 
      }}
    >
      <defs>
        <mask id={`path-mask-${uid}`} maskUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
          <motion.path 
            d={pathD} 
            stroke="white" 
            strokeWidth={100} 
            strokeLinecap="round" 
            fill="none" 
            style={{ pathLength: fillFraction }} 
          />
        </mask>
        
        <filter id={`glow-intense-${uid}`} filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <linearGradient id={`lava-grad-${uid}`} gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">
           <stop offset="0%" stopColor="#FF2200" />
           <stop offset="50%" stopColor="#FF6B00" />
           <stop offset="100%" stopColor="#FF2200" />
        </linearGradient>
      </defs>

      {/* Pipe Background & 3D Depth */}
      <path d={pathD} stroke="#050302" strokeWidth={56} fill="none" strokeLinecap="round" opacity={0.9} />
      <path d={pathD} stroke="#1a120b" strokeWidth={52} fill="none" strokeLinecap="round" />
      <path d={pathD} stroke="rgba(0,0,0,0.8)" strokeWidth={40} fill="none" strokeLinecap="round" />
      <path d={pathD} stroke="rgba(255,255,255,0.06)" strokeWidth={36} fill="none" strokeLinecap="round" />

      {/* Masked Flowing Lava */}
      <g mask={`url(#path-mask-${uid})`}>
        {/* Base glow */}
        <path d={pathD} stroke={`url(#lava-grad-${uid})`} strokeWidth={28} fill="none" strokeLinecap="round" filter={`url(#glow-intense-${uid})`} />
        {/* Core heat */}
        <path d={pathD} stroke="#FFD580" strokeWidth={14} fill="none" strokeLinecap="round" />
        {/* Animated flow chunks */}
        <path 
          d={pathD} 
          stroke="#FFFFFF" 
          strokeWidth={8} 
          fill="none" 
          strokeLinecap="round" 
          strokeDasharray="20 60"
          className="animate-flow-dash"
          opacity={0.8}
        />
      </g>
    </svg>
  );
}
