
export default function InsightCard({ icon: Icon, iconBg, title, description }) {
  return (
    <div className="p-4 flex items-start gap-3 flex-1 rounded-xl border border-border-default bg-surface-panel">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="type-body-sm font-semibold text-text-primary mb-1">{title}</p>
        <p className="type-body-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}