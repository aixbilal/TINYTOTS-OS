const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function InsightCard({ icon: Icon, iconBg, title, description }) {
  return (
    <div className={`p-5 flex items-start gap-4 flex-1 hover:-translate-y-0.5 ${glassCard}`} style={glassCardStyle}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-medium text-ink-900 mb-1">{title}</p>
        <p className="text-sm text-ink-700 leading-snug">{description}</p>
      </div>
    </div>
  );
}