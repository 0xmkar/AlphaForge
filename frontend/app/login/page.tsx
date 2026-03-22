"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed. Check your credentials.");
      } else {
        setSuccess(true);
        if (data.token) localStorage.setItem("alphaforge_token", data.token);
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,69,0,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Stone noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Floating embers */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: i % 2 === 0 ? 3 : 2,
            height: i % 2 === 0 ? 3 : 2,
            borderRadius: "50%",
            background:
              i % 3 === 0
                ? "var(--lava-core)"
                : i % 3 === 1
                  ? "var(--lava-glow)"
                  : "var(--lava-hot)",
            left: `${10 + i * 11}%`,
            bottom: `${15 + (i % 4) * 15}%`,
          }}
          animate={{
            y: [0, -80 - i * 20, -160 - i * 20],
            x: [0, i % 2 === 0 ? 12 : -10, i % 2 === 0 ? -6 : 8],
            opacity: [0.8, 0.5, 0],
            scale: [1, 0.7, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          margin: "0 1.5rem",
          background: "rgba(26,20,16,0.85)",
          border: "1px solid rgba(255,69,0,0.18)",
          borderRadius: "1.25rem",
          boxShadow:
            "0 0 0 1px rgba(255,107,0,0.08), 0 8px 48px rgba(0,0,0,0.5), 0 0 80px rgba(255,69,0,0.06)",
          backdropFilter: "blur(16px)",
          padding: "2.75rem 2.5rem",
        }}
      >
        {/* Top glow line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,107,0,0.6), transparent)",
          }}
        />

        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <h1
              className="glow-text-lava"
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "1.9rem",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                background:
                  "linear-gradient(135deg, #fff 0%, var(--lava-hot) 40%, var(--lava-core) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                cursor: "pointer",
              }}
            >
              AlphaForge
            </h1>
          </Link>
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--lava-hot)",
              opacity: 0.7,
              marginTop: "0.3rem",
            }}
          >
            Enter the Forge
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AuthField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: "0.8rem",
                color: "#ff6b6b",
                background: "rgba(255,50,50,0.08)",
                border: "1px solid rgba(255,50,50,0.2)",
                borderRadius: "0.5rem",
                padding: "0.6rem 0.9rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {error}
            </motion.p>
          )}

          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: "0.8rem",
                color: "var(--lava-hot)",
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
              }}
            >
              ✓ Login successful — entering the forge…
            </motion.p>
          )}

          <motion.button
            id="login-submit"
            type="submit"
            disabled={loading || success}
            whileHover={!loading && !success ? { scale: 1.02 } : {}}
            whileTap={!loading && !success ? { scale: 0.97 } : {}}
            style={{
              marginTop: "0.4rem",
              padding: "0.9rem",
              borderRadius: "0.65rem",
              border: "none",
              cursor: loading || success ? "not-allowed" : "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              letterSpacing: "0.04em",
              background:
                loading || success
                  ? "rgba(255,69,0,0.3)"
                  : "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
              color: loading || success ? "rgba(255,255,255,0.5)" : "#fff",
              boxShadow:
                loading || success
                  ? "none"
                  : "0 0 20px rgba(255,69,0,0.4), 0 0 50px rgba(255,107,0,0.15)",
              transition: "all 0.3s",
            }}
          >
            {loading ? <LoadingDots /> : success ? "Entering…" : "Sign In"}
          </motion.button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.75rem 0 1.5rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          <span
            style={{
              fontSize: "0.7rem",
              color: "var(--stone-dark)",
              letterSpacing: "0.1em",
              fontFamily: "Inter, sans-serif",
            }}
          >
            NEW TO THE FORGE?
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        </div>

        <Link href="/signup" style={{ textDecoration: "none", display: "block" }}>
          <motion.div
            whileHover={{ scale: 1.02, borderColor: "rgba(255,69,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "0.8rem",
              borderRadius: "0.65rem",
              border: "1px solid rgba(255,69,0,0.25)",
              textAlign: "center",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "var(--lava-hot)",
              letterSpacing: "0.03em",
            }}
          >
            Create Account
          </motion.div>
        </Link>
      </motion.div>
    </main>
  );
}

function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "0.78rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--stone-dark)",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.6rem",
          padding: "0.75rem 1rem",
          color: "var(--stone-light)",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.95rem",
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          width: "100%",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,107,0,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,107,0,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function LoadingDots() {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: "4px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
