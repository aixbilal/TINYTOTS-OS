import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlipText } from "../components/FlipText";
import loginBg from "../assets/login-bg.png";

export default function Splash() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("enter"); // enter -> hold -> exit

  useEffect(() => {
    const toHold = setTimeout(() => setStage("hold"), 900);
    const toExit = setTimeout(() => setStage("exit"), 3200);
    const toDashboard = setTimeout(() => navigate("/dashboard"), 3800);
    return () => {
      clearTimeout(toHold);
      clearTimeout(toExit);
      clearTimeout(toDashboard);
    };
  }, [navigate]);

  return (
    <div
      className={`relative h-screen w-screen flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        stage === "exit" ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#F2F1ED" }} // Soft Pearl Base
    >
      {/* Background with initial 00:00 fade-in and subtle blend into the Soft Pearl background */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-[bgFadeIn_1s_ease-out_forwards,bgPan_14s_ease-in-out_infinite] mix-blend-multiply opacity-30"
        style={{
          backgroundImage: `url(${loginBg})`,
          transform: "scale(1.15)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(242,241,237,0.4), transparent 70%)",
        }}
      />

      <style>{`
        @keyframes bgFadeIn {
          0% { opacity: 0; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes bgPan {
          0% { transform: scale(1.15) translate(0, 0); }
          50% { transform: scale(1.22) translate(-1.5%, -1%); }
          100% { transform: scale(1.15) translate(0, 0); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div
          className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) ${
            stage === "enter"
              ? "opacity-0 translate-y-4 scale-95"
              : "opacity-100 translate-y-0 scale-100"
          }`}
          style={{ transitionDuration: "900ms" }}
        >
          {/* Main Title 3D Entrance */}
          <FlipText 
            delay={0.1} 
            className="font-sans font-black tracking-tight text-5xl md:text-7xl mb-2"
          >
            <span style={{ color: "#710014" }}>TINYTOTS OS</span>
          </FlipText>

          {/* Subtitle 3D Entrance */}
          <FlipText 
            delay={0.4} 
            className="mt-2 text-sm md:text-base font-bold tracking-[0.25em] uppercase"
          >
            <span style={{ color: "#161616" }}>Powered by </span>
            <span style={{ color: "#B38F6F" }}>VANTIXIS</span>
          </FlipText>
        </div>

        {/* Loading Indicator Dots */}
        <div
          className={`mt-12 flex gap-2 transition-opacity duration-700 ${
            stage === "hold" ? "opacity-100" : "opacity-0"
          }`}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ 
                backgroundColor: "#710014", // Crimson Depth
                opacity: 0.6,
                animationDelay: `${i * 150}ms` 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}