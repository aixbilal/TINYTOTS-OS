import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  CreditCard,
  TrendingUp,
  ScrollText,
  ShoppingBag,
  ShoppingCart,
  Boxes,
  Target,
} from "lucide-react";
import FloralFlourish from "../components/FloralFlourish";
import Header from "../components/Header";
import { getSession } from "../auth";
import loginBg from "../assets/login-bg.png";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

const MODULES = [
  {
    key: "inventory",
    title: "Dynamic\nInventory",
    description: "Real-time stock updates and smart inventory control.",
    icon: Package,
    to: "/inventory",
    tone: "maroon",
  },
  {
    key: "pos",
    title: "POS",
    description: "Seamless billing, payments and in-store experience.",
    icon: CreditCard,
    to: "/pos",
    tone: "gold",
  },
  {
    key: "performance",
    title: "Performance\nx Goals",
    description: "Track performance, set goals and achieve more together.",
    icon: TrendingUp,
    to: "/performance",
    tone: "charcoal",
  },
  {
    key: "receipts",
    title: "Old\nReceipts",
    description: "View and manage all your previous transactions.",
    icon: ScrollText,
    to: "/receipts",
    tone: "cream",
  },
];

// Colored glassmorphism: each tone keeps its original hue but as a translucent,
// blurred glass tint instead of a solid fill.
const TONE_STYLES = {
  maroon: {
    card: "text-cream-50 border border-white/25 backdrop-blur-xl",
    cardStyle: {
      background: "linear-gradient(160deg, rgba(122,31,43,0.75) 0%, rgba(122,31,43,0.45) 100%)",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
    },
    desc: "text-maroon-100/80",
    iconWrap: "border-gold-300/40 text-gold-300 bg-white/5",
    arrowWrap: "border-gold-300/50 text-gold-300 group-hover:bg-gold-300 group-hover:text-maroon-800",
  },
  gold: {
    card: "text-cream-50 border border-white/25 backdrop-blur-xl",
    cardStyle: {
      background: "linear-gradient(160deg, rgba(201,162,75,0.70) 0%, rgba(201,162,75,0.40) 100%)",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
    },
    desc: "text-cream-50/85",
    iconWrap: "border-cream-50/40 text-cream-50 bg-white/5",
    arrowWrap: "border-cream-50/50 text-cream-50 group-hover:bg-cream-50 group-hover:text-gold-700",
  },
  charcoal: {
    card: "text-cream-50 border border-white/20 backdrop-blur-xl",
    cardStyle: {
      background: "linear-gradient(160deg, rgba(28,28,28,0.70) 0%, rgba(28,28,28,0.42) 100%)",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
    },
    desc: "text-cream-100/70",
    iconWrap: "border-gold-400/40 text-gold-400 bg-white/5",
    arrowWrap: "border-gold-400/50 text-gold-400 group-hover:bg-gold-400 group-hover:text-charcoal-900",
  },
  cream: {
    card: "text-ink-900 border border-white/50 backdrop-blur-xl",
    cardStyle: {
      background: "linear-gradient(160deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.20) 100%)",
      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
    },
    desc: "text-ink-700/80",
    iconWrap: "border-maroon-700/30 text-maroon-700 bg-white/10",
    arrowWrap: "border-maroon-700/40 text-maroon-700 group-hover:bg-maroon-700 group-hover:text-cream-50",
  },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [snapshot, setSnapshot] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch("http://localhost:3000/api/dashboard-summary");
        const data = await res.json();
        if (data.success) setSnapshot(data);
        else setLoadError(true);
      } catch {
        setLoadError(true);
      }
    }
    loadSummary();
  }, []);

  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="min-h-screen px-10 py-6"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Glass header — no menu/drawer */}
      <div className="mb-8">
        <Header />
      </div>

      {/* Headline */}
      <div className="relative mb-10">
        <FloralFlourish className="absolute -top-6 right-0 w-96 h-48 pointer-events-none hidden md:block" />
        <h1 className="font-display font-semibold text-4xl md:text-5xl text-ink-900 leading-tight relative">
          {timeGreeting()}
          <br />
          <span className="text-maroon-700">{session?.name || "Retailer"}</span>
        </h1>
        <p className="mt-3 text-ink-800 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-gold-600" />
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MODULES.map((mod) => {
          const tone = TONE_STYLES[mod.tone];
          const Icon = mod.icon;
          return (
            <button
              key={mod.key}
              onClick={() => navigate(mod.to)}
              className={`group text-left rounded-2xl p-7 h-64 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 ${tone.card}`}
              style={tone.cardStyle}
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center mb-5 ${tone.iconWrap}`}
                >
                  <Icon size={22} strokeWidth={1.6} />
                </div>
                <h2 className="font-display text-2xl font-semibold whitespace-pre-line leading-snug">
                  {mod.title}
                </h2>
              </div>

              <div>
                <p className={`text-sm mb-4 ${tone.desc}`}>{mod.description}</p>
                <span
                  className={`inline-flex w-9 h-9 rounded-full border items-center justify-center transition-colors ${tone.arrowWrap}`}
                >
                  <ArrowRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Today's Snapshot — glass bar */}
      <div
        className="mt-8 rounded-2xl px-8 py-5 flex flex-wrap items-center gap-x-10 gap-y-4 border border-white/40 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.22) 0%, rgba(120,20,30,0.18) 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.4)",
        }}
      >
        <div>
          <p className="text-sm font-semibold text-maroon-800">Today&apos;s Snapshot</p>
          <p className="text-xs text-ink-800">
            {dateLabel} • {timeLabel}
          </p>
        </div>

        <SnapshotStat
          icon={ShoppingBag}
          label="Total Sales"
          value={
            snapshot ? `₹${snapshot.totalSalesToday.toLocaleString()}` : loadError ? "—" : "…"
          }
        />
        <SnapshotStat
          icon={ShoppingCart}
          label="Transactions"
          value={snapshot ? snapshot.transactionsToday : loadError ? "—" : "…"}
        />
        <SnapshotStat
          icon={Boxes}
          label="Low Stock Items"
          value={snapshot ? snapshot.lowStockCount : loadError ? "—" : "…"}
          action={{ label: "View Now", onClick: () => navigate("/low-stock") }}
        />
        <SnapshotStat
          icon={Target}
          label="Goal Progress"
          value={
            snapshot?.goalProgressPct != null
              ? `${snapshot.goalProgressPct}%`
              : "No goal set"
          }
          action={{ label: "This Month", onClick: () => navigate("/performance") }}
        />
      </div>
    </div>
  );
}

function SnapshotStat({ icon: Icon, label, value, action }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-maroon-700">
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <div>
        <p className="text-xs text-ink-800">{label}</p>
        <p className="font-semibold text-ink-900">{value}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-maroon-700 hover:underline"
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
}