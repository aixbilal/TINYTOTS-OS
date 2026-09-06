import { useState } from "react";
import { Target } from "lucide-react";
import { apiFetch } from "../../services/api";
import Button from "../ui/Button";
import { Select } from "../ui/Input";

const FIELD =
  "w-full rounded-md border border-border-default bg-surface-panel px-3 py-2 type-input text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45";

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
    <div className="rounded-lg border border-border-default bg-surface-panel p-5">
      <h3 className="type-section text-text-primary mb-4">Set New Goal</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Select
          label="Goal type"
          value={goalType}
          onChange={(e) => setGoalType(e.target.value)}
        >
          <option value="monthly_sales">Monthly Sales</option>
          <option value="weekly_sales">Weekly Sales</option>
          <option value="daily_sales">Daily Sales</option>
          <option value="units_sold">Units Sold</option>
        </Select>
        <div className="flex flex-col gap-1.5">
          <label className="type-field-label text-text-secondary">Target amount</label>
          <div className="flex items-center rounded-md border border-border-default bg-surface-panel px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/45 transition-[border-color,box-shadow]">
            <span className="text-text-muted type-body-sm mr-1">Rs.</span>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Enter target amount"
              className="w-full type-input outline-none bg-transparent text-text-primary placeholder:text-text-muted"
            />
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label className="type-field-label text-text-secondary">Duration</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={FIELD}
        />
      </div>

      <Button onClick={handleSetGoal} disabled={busy || !targetAmount} loading={busy} className="w-full">
        <Target size={16} /> {busy ? "Saving…" : "Set Goal"}
      </Button>
    </div>
  );
}
