"use client";

// Pure CSS spark particles — ambient floating embers around the pipeline
const SPARKS = [
  { left: "42%", bottom: "20%", delay: 0, size: 3, driftX: -8 },
  { left: "55%", bottom: "35%", delay: 0.4, size: 2, driftX: 10 },
  { left: "38%", bottom: "55%", delay: 0.8, size: 4, driftX: -5 },
  { left: "58%", bottom: "65%", delay: 1.2, size: 2, driftX: 12 },
  { left: "45%", bottom: "75%", delay: 0.2, size: 3, driftX: -10 },
  { left: "52%", bottom: "80%", delay: 0.6, size: 2, driftX: 6 },
  { left: "40%", bottom: "88%", delay: 1.0, size: 3, driftX: -7 },
  { left: "60%", bottom: "45%", delay: 1.4, size: 2, driftX: 9 },
  { left: "36%", bottom: "30%", delay: 0.9, size: 2, driftX: -12 },
  { left: "63%", bottom: "70%", delay: 0.3, size: 3, driftX: 5 },
];

export default function SparkParticles() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {SPARKS.map((spark, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: spark.left,
            bottom: spark.bottom,
            width: spark.size,
            height: spark.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, #fff 0%, #FFB347 60%, transparent 100%)`,
            boxShadow: `0 0 ${spark.size * 2}px #FF6B00`,
            animation: `spark-float ${1.4 + (i % 3) * 0.3}s ease-out ${spark.delay}s infinite`,
            transform: `translateX(${spark.driftX}px)`,
          }}
        />
      ))}
    </div>
  );
}
