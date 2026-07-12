import { useState } from "react";
import { Target } from "lucide-react";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function SetGoalForm({ onGoalSet }) {
  const [goalType, setGoalType] = useState("monthly_sales");
  const [targetAmount, setTargetAmount] = useState("");
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [busy, setBusy] = useState(false);

  async function handleSetGoal() {
    if (!targetAmount) return;
    setBusy(true);
    try {
      const res = await fetch("http://localhost:3000/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalType, targetAmount: Number(targetAmount), month }),
      });
      const data = await res.json();
      if (data.success) {
        setTargetAmount("");
        onGoalSet?.();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`p-6 hover:scale-[1.01] ${glassCard}`} style={glassCardStyle}>
      <h3 className="font-display text-xl text-ink-900 mb-5">Set New Goal</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-medium text-ink-700 mb-1.5 block">Select Goal Type</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="w-full border border-white/40 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm"
          >
            <option value="monthly_sales">Monthly Sales</option>
            <option value="weekly_sales">Weekly Sales</option>
            <option value="daily_sales">Daily Sales</option>
            <option value="units_sold">Units Sold</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-ink-700 mb-1.5 block">Target Amount</label>
          <div className="flex items-center border border-white/40 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-ink-700 text-sm mr-1">Rs.</span>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Enter target amount"
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-xs font-medium text-ink-700 mb-1.5 block">Duration</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full border border-white/40 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={handleSetGoal}
        disabled={busy || !targetAmount}
        className="w-full flex items-center justify-center gap-2 bg-maroon-700 text-cream-50 font-medium py-3 rounded-lg hover:bg-maroon-800 hover:shadow-md disabled:opacity-50 transition-all"
      >
        <Target size={16} />
        {busy ? "Saving…" : "Set Goal"}
      </button>
    </div>
  );
}