"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/* ─── Types ─────────────────────────────────────────────────────────── */
interface UserProfile {
  id: string;
  email: string;
  wallet: string;
  name?: string;
}

interface Balances {
  ETH: string;
  USDT: string;
  BTC: string;
  XAUT: string;
}

interface ProfileData {
  user: UserProfile;
  balances: Balances;
}

/* ─── Currency meta ──────────────────────────────────────────────────── */
const CURRENCIES: { key: keyof Balances; label: string; icon: string; color: string; glow: string }[] = [
  {
    key: "ETH",
    label: "Ethereum",
    icon: "Ξ",
    color: "linear-gradient(135deg, #627eea 0%, #a5b4fc 100%)",
    glow: "rgba(98,126,234,0.35)",
  },
  {
    key: "USDT",
    label: "Tether USD",
    icon: "₮",
    color: "linear-gradient(135deg, #26a17b 0%, #4fd1a5 100%)",
    glow: "rgba(38,161,123,0.35)",
  },
  {
    key: "BTC",
    label: "Bitcoin",
    icon: "₿",
    color: "linear-gradient(135deg, #f7931a 0%, #fbbf24 100%)",
    glow: "rgba(247,147,26,0.35)",
  },
  {
    key: "XAUT",
    label: "Tether Gold",
    icon: "✦",
    color: "linear-gradient(135deg, #d4af37 0%, #f5e17a 100%)",
    glow: "rgba(212,175,55,0.35)",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */
function shortenAddress(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatBalance(raw: string) {
  const num = parseFloat(raw);
  if (isNaN(num)) return "—";
  if (num === 0) return "0.000";
  if (num < 0.0001) return "< 0.0001";
  return num.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("alphaforge_token");
    if (!token) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load profile");
        setData(json);
      } catch (err: any) {
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleCopy = () => {
    if (!data?.user.wallet) return;
    navigator.clipboard.writeText(data.user.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("alphaforge_token");
    router.push("/login");
  };

  /* ── Shared backgrounds ── */
  const ambientBg = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(255,69,0,0.09) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />
    </>
  );

  /* ── Loading state ── */
  if (loading) {
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
        {ambientBg}
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "0.85rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--lava-hot)",
            zIndex: 1,
          }}
        >
          Loading forge…
        </motion.div>
      </main>
    );
  }

  /* ── Error state ── */
  if (error) {
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
        {ambientBg}
        <div style={{ zIndex: 1, textAlign: "center" }}>
          <p
            style={{
              color: "#ff6b6b",
              fontFamily: "Inter, sans-serif",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
          <Link
            href="/login"
            style={{ color: "var(--lava-hot)", fontFamily: "Outfit, sans-serif" }}
          >
            Return to Login →
          </Link>
        </div>
      </main>
    );
  }

  const { user, balances } = data!;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {ambientBg}

      {/* Floating embers */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "fixed",
            width: i % 2 === 0 ? 3 : 2,
            height: i % 2 === 0 ? 3 : 2,
            borderRadius: "50%",
            background:
              i % 3 === 0
                ? "var(--lava-core)"
                : i % 3 === 1
                  ? "var(--lava-glow)"
                  : "var(--lava-hot)",
            left: `${8 + i * 14}%`,
            bottom: `${10 + (i % 3) * 18}%`,
            zIndex: 0,
            pointerEvents: "none",
          }}
          animate={{
            y: [0, -100 - i * 20],
            opacity: [0.7, 0],
            scale: [1, 0.2],
          }}
          transition={{ duration: 3 + i * 0.6, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}

      {/* ─── Nav bar ────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.1rem 2.5rem",
          background: "rgba(14,11,9,0.75)",
          borderBottom: "1px solid rgba(255,69,0,0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            className="glow-text-lava"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "1.35rem",
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
          </span>
        </Link>

        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            padding: "0.45rem 1.2rem",
            borderRadius: "0.4rem",
            border: "1px solid rgba(255,69,0,0.3)",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 600,
            fontSize: "0.82rem",
            letterSpacing: "0.06em",
            color: "var(--stone-dark)",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lava-hot)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--stone-dark)")}
        >
          Log out
        </motion.button>
      </motion.nav>

      {/* ─── Content ────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "7rem 1.5rem 4rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: "2.5rem" }}
        >
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "0.72rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--lava-hot)",
              opacity: 0.75,
              marginBottom: "0.5rem",
            }}
          >
            Your Forge
          </p>
          <h1
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background: "linear-gradient(135deg, #fff 0%, var(--lava-hot) 60%, var(--lava-core) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Profile
          </h1>
        </motion.div>

        {/* ── Identity card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{
            background: "rgba(26,20,16,0.85)",
            border: "1px solid rgba(255,69,0,0.18)",
            borderRadius: "1.25rem",
            boxShadow:
              "0 0 0 1px rgba(255,107,0,0.07), 0 8px 48px rgba(0,0,0,0.45), 0 0 60px rgba(255,69,0,0.05)",
            backdropFilter: "blur(16px)",
            padding: "2rem 2.25rem",
            marginBottom: "1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "15%",
              right: "15%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,107,0,0.55), transparent)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            {/* Avatar + identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              {/* Avatar circle */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#fff",
                  fontFamily: "Outfit, sans-serif",
                  boxShadow: "0 0 20px rgba(255,69,0,0.4)",
                  flexShrink: 0,
                }}
              >
                {user.email.charAt(0).toUpperCase()}
              </div>

              <div>
                {user.name && (
                  <p
                    style={{
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "var(--stone-light)",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {user.name}
                  </p>
                )}
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.9rem",
                    color: "var(--stone-dark)",
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>

            {/* Deposit button */}
            <motion.button
              onClick={() => setDepositOpen(true)}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 28px rgba(255,69,0,0.6), 0 0 60px rgba(255,107,0,0.25)",
              }}
              whileTap={{ scale: 0.96 }}
              style={{
                padding: "0.65rem 1.8rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
                color: "#fff",
                boxShadow: "0 0 16px rgba(255,69,0,0.35), 0 0 40px rgba(255,107,0,0.12)",
                alignSelf: "center",
              }}
            >
              ↓ Deposit
            </motion.button>
          </div>

          {/* Wallet row */}
          <div
            style={{
              marginTop: "1.5rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "0.68rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--stone-dark)",
                  marginBottom: "0.35rem",
                }}
              >
                Wallet Address
              </p>
              <p
                style={{
                  fontFamily: "\"Courier New\", monospace",
                  fontSize: "0.88rem",
                  color: "var(--stone-mid)",
                  wordBreak: "break-all",
                }}
              >
                {user.wallet}
              </p>
            </div>

            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "0.4rem",
                border: "1px solid rgba(255,69,0,0.25)",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "0.78rem",
                letterSpacing: "0.06em",
                color: copied ? "var(--lava-hot)" : "var(--stone-dark)",
                transition: "color 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Balances ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginBottom: "1.5rem" }}
        >
          <p
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: "0.68rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--stone-dark)",
              marginBottom: "1rem",
            }}
          >
            Asset Balances
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
            }}
          >
            {CURRENCIES.map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.08 }}
                whileHover={{
                  y: -3,
                  boxShadow: `0 0 28px ${c.glow}, 0 8px 32px rgba(0,0,0,0.4)`,
                }}
                style={{
                  background: "rgba(26,20,16,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "1rem",
                  padding: "1.4rem 1.25rem",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                  transition: "box-shadow 0.3s, transform 0.3s",
                  cursor: "default",
                }}
              >
                {/* subtle tint */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: c.color,
                    opacity: 0.04,
                    pointerEvents: "none",
                  }}
                />

                {/* icon */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: c.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#fff",
                    boxShadow: `0 0 14px ${c.glow}`,
                    marginBottom: "0.9rem",
                  }}
                >
                  {c.icon}
                </div>

                <p
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--stone-dark)",
                    marginBottom: "0.3rem",
                  }}
                >
                  {c.label}
                </p>
                <p
                  style={{
                    fontFamily: "\"Courier New\", monospace",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--stone-light)",
                  }}
                >
                  {formatBalance(balances[c.key])}
                </p>
                <p
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontSize: "0.72rem",
                    color: "var(--stone-dark)",
                    marginTop: "0.1rem",
                  }}
                >
                  {c.key}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ─── Deposit modal ───────────────────────────────────────────── */}
      {depositOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDepositOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: "rgba(20,15,12,0.95)",
              border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "1.25rem",
              boxShadow:
                "0 0 0 1px rgba(255,107,0,0.08), 0 24px 80px rgba(0,0,0,0.6), 0 0 80px rgba(255,69,0,0.08)",
              backdropFilter: "blur(20px)",
              padding: "2.25rem 2rem",
              position: "relative",
            }}
          >
            {/* top glow line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "20%",
                right: "20%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,107,0,0.65), transparent)",
              }}
            />

            <h2
              style={{
                fontFamily: "Outfit, sans-serif",
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "var(--stone-light)",
                marginBottom: "0.4rem",
              }}
            >
              Deposit Funds
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.82rem",
                color: "var(--stone-dark)",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              Send assets to your wallet address on the supported network.
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.75rem",
                padding: "1rem 1.1rem",
                marginBottom: "1.25rem",
              }}
            >
              <p
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--stone-dark)",
                  marginBottom: "0.5rem",
                }}
              >
                Your Wallet Address
              </p>
              <p
                style={{
                  fontFamily: "\"Courier New\", monospace",
                  fontSize: "0.82rem",
                  color: "var(--stone-mid)",
                  wordBreak: "break-all",
                  lineHeight: 1.6,
                }}
              >
                {user.wallet}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "0.55rem",
                  border: "1px solid rgba(255,69,0,0.3)",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: copied ? "var(--lava-hot)" : "var(--stone-mid)",
                  transition: "color 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Address"}
              </motion.button>
              <motion.button
                onClick={() => {
                  setDepositOpen(false);
                  window.location.reload();
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "0.55rem",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  background: "linear-gradient(135deg, var(--lava-core), var(--lava-glow))",
                  color: "#fff",
                  boxShadow: "0 0 16px rgba(255,69,0,0.35)",
                }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
