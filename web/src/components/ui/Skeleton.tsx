interface Props {
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({ className = "", rounded = true }: Props) {
  const radius = rounded ? "rounded-md" : "";
  return (
    <div
      className={`${radius} bg-bark/60 ${className} relative overflow-hidden`}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-mist/10 to-transparent"
        style={{ animationName: "shimmer" }}
      />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
