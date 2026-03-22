"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LavaFountain from "@/components/LavaFountain";
import LavaFlowSystem from "@/components/LavaFlowSystem";

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("alphaforge_token"));
  }, []);

  return (
    <main
      style={{
        background: "var(--background)",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {/* ─── Nav Button (Login / Profile) ──────────────────── */}
      {loggedIn !== null && (
        <motion.button
          onClick={() => router.push(loggedIn ? "/profile" : "/login")}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          whileHover={{ scale: 1.06, boxShadow: "0 0 28px rgba(255,69,0,0.6), 0 0 60px rgba(255,107,0,0.25)" }}
          whileTap={{ scale: 0.96 }}
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "2rem",
            zIndex: 100,
            padding: "0.55rem 1.6rem",
            borderRadius: "0.45rem",
            border: "1px solid rgba(255,100,0,0.35)",
            cursor: "pointer",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: "0.9rem",
            letterSpacing: "0.06em",
            background: "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
            color: "#fff",
            boxShadow: "0 0 16px rgba(255,69,0,0.35), 0 0 40px rgba(255,107,0,0.12)",
            backdropFilter: "blur(4px)",
          }}
        >
          {loggedIn ? "Profile" : "Login"}
        </motion.button>
      )}
      {/* ─── Hero Section ───────────────────────────────────────────── */}
      <section
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 60%, rgba(255,69,0,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Stone texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ textAlign: "center", zIndex: 1, marginBottom: "2rem" }}
        >
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "0.85rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--lava-hot)",
              marginBottom: "1rem",
              opacity: 0.85,
            }}
          >
            Introducing
          </p>
          <h1
            className="glow-text-lava"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "clamp(3.5rem, 10vw, 8rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              background:
                "linear-gradient(135deg, #fff 0%, var(--lava-hot) 40%, var(--lava-core) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AlphaForge
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(1rem, 2vw, 1.35rem)",
              fontWeight: 300,
              color: "var(--stone-mid)",
              marginTop: "1.2rem",
              letterSpacing: "0.05em",
              opacity: 0.8,
            }}
          >
            Alpha is forged, not found.
          </p>
        </motion.div>

        {/* Lava Fountain */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
          style={{ zIndex: 1 }}
        >
          <LavaFountain />
        </motion.div>

        {/* Scroll invitation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--stone-dark)",
              opacity: 0.7,
            }}
          >
            Scroll to forge
          </p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 1,
              height: 40,
              background:
                "linear-gradient(to bottom, var(--lava-glow), transparent)",
            }}
          />
        </motion.div>
      </section>

      {/* ─── Lava Flow Pipeline ─────────────────────────────────────── */}
      <LavaFlowSystem />

      {/* ─── CTA Section ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "10rem 2rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(255,69,0,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h2
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              background:
                "linear-gradient(135deg, #fff 0%, var(--lava-hot) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1.5rem",
            }}
          >
            The forge is ready.
          </h2>
          <p
            style={{
              color: "var(--stone-dark)",
              fontSize: "1.1rem",
              maxWidth: 480,
              margin: "0 auto 3rem",
              lineHeight: 1.8,
            }}
          >
            Join the institutions already forging precision alpha from raw
            signal.
          </p>
          <motion.button
            onClick={() => router.push(loggedIn ? "/profile" : "/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "1rem 2.8rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: "0.05em",
              background:
                "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
              color: "#fff",
              boxShadow:
                "0 0 24px rgba(255,69,0,0.5), 0 0 60px rgba(255,107,0,0.2)",
            }}
          >
            Invest Now
          </motion.button>
        </motion.div>
      </section>
    </main>
  );
}
