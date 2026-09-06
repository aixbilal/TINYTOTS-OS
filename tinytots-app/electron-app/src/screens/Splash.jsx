import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shirt } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const toExit = setTimeout(() => setLeaving(true), 1400);
    const toNext = setTimeout(() => navigate("/dashboard"), 1800);
    return () => {
      clearTimeout(toExit);
      clearTimeout(toNext);
    };
  }, [navigate]);

  return (
    <div
      className={`tt-warm h-screen w-screen flex items-center justify-center bg-surface-app transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <span className="w-14 h-14 rounded-2xl bg-brand/15 text-brand flex items-center justify-center mb-4">
          <Shirt size={28} strokeWidth={2} />
        </span>
        <p className="text-[26px] font-bold tracking-tight text-text-primary">
          TinyTots<span className="text-brand"> OS</span>
        </p>
        <p className="type-caption text-text-muted mt-1 tracking-[0.18em] uppercase">
          Manage · Sell · Grow
        </p>

        <div className="mt-6 h-0.5 w-40 rounded-full bg-border-default overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-brand animate-[loadbar_1.1s_ease-in-out_infinite]" />
        </div>

        <p className="type-tiny text-text-muted mt-6">Powered by Vantixis</p>
      </div>

      <style>{`
        @keyframes loadbar {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
      `}</style>
    </div>
  );
}
