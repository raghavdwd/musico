import { motion } from "motion/react";
import { bestThumb } from "../../lib/format";
import { TrefoilLoader } from "../ui/Loaders";

interface Props {
  thumbnails?: { url: string; width: number; height: number }[];
  size?: number;
  spinning?: boolean;
  loading?: boolean;
  rounded?: boolean;
  alt?: string;
}

export default function VinylArt({
  thumbnails,
  size = 48,
  spinning = false,
  loading = false,
  rounded = true,
  alt = "",
}: Props) {
  const thumb = bestThumb(thumbnails, size);
  const radius = rounded ? "rounded-full" : "rounded-md";

  if (!thumb) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`${radius} bg-bark flex items-center justify-center text-mist`}
      >
        <span style={{ fontSize: size * 0.3 }}>♪</span>
      </div>
    );
  }

  return (
    <motion.div
      animate={{
        rotate: spinning ? 360 : 0,
        scale: loading ? 1.04 : 1,
      }}
      transition={
        spinning
          ? { duration: 8, repeat: Infinity, ease: "linear" }
          : { duration: 0.3 }
      }
      style={{ width: size, height: size }}
      className={`${radius} relative overflow-hidden bg-bark shadow-[0_0_0_1px_rgba(0,0,0,0.4)] ${loading ? "ring-2 ring-ember/60" : ""}`}
    >
      <img
        src={thumb.url}
        alt={alt}
        className={`h-full w-full object-cover transition-all duration-300 ${loading ? "scale-110 blur-[2px] brightness-75" : ""}`}
        loading="lazy"
        draggable={false}
      />
      {loading && (
        <>
          <motion.div
            className="absolute inset-0 bg-ember/20"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <TrefoilLoader size={Math.max(14, size * 0.4)} />
          </div>
          {/* scanning ring effect */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-ember to-transparent"
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            style={{ boxShadow: "0 0 8px 2px var(--color-ember)" }}
          />
        </>
      )}
    </motion.div>
  );
}
