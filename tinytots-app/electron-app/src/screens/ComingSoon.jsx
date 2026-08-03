import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Temporary stand-in so every dashboard card is clickable and testable
// as soon as this phase lands, even before its real screen is built.
export default function ComingSoon({ title }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <p className="type-label uppercase tracking-[0.12em] text-gold-700 mb-3">
        Coming next
      </p>
      <h1 className="font-display type-heading-md text-ink-900 mb-6">{title}</h1>
      <button
        onClick={() => navigate("/dashboard")}
        className="type-btn inline-flex items-center gap-2 text-maroon-700 hover:underline"
      >
        <ArrowLeft size={16} /> Back to dashboard
      </button>
    </div>
  );
}