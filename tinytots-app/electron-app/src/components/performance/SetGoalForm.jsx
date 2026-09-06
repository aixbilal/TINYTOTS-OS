import { useState } from "react";
import { Target } from "lucide-react";
import { apiFetch } from "../../services/api";

const panelCls = "rounded-xl border border-border-default bg-surface-panel";

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
      const res = await apiFetch("/api/goals", {
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
    <div className={`${panelCls} p-5`}>
      <h3 className="type-section text-text-primary mb-4">Set New Goal</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="type-field-label text-text-secondary mb-1.5 block">Select Goal Type</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            className="w-full border border-border-strong bg-surface-elevated rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
          >
            <option value="monthly_sales">Monthly Sales</option>
            <option value="weekly_sales">Weekly Sales</option>
            <option value="daily_sales">Daily Sales</option>
            <option value="units_sold">Units Sold</option>
          </select>
        </div>
        <div>
          <label className="type-field-label text-text-secondary mb-1.5 block">Target Amount</label>
          <div className="flex items-center border border-border-strong bg-surface-elevated rounded-lg px-3 py-2 focus-within:border-brand">
            <span className="text-text-muted text-sm mr-1">Rs.</span>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Enter target amount"
              className="w-full text-sm outline-none bg-transparent text-text-primary"
            />
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label className="type-field-label text-text-secondary mb-1.5 block">Duration</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full border border-border-strong bg-surface-elevated rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </div>

      <button
        onClick={handleSetGoal}
        disabled={busy || !targetAmount}
        className="w-full flex items-center justify-center gap-2 bg-brand text-pure-white type-btn py-2.5 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors"
      >
        <Target size={16} />
        {busy ? "Saving…" : "Set Goal"}
      </button>
    </div>
  );
}