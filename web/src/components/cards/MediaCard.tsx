import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { RiPlayFill } from "react-icons/ri";
import type { Thumbnail } from "../../types";
import { bestThumb } from "../../lib/format";

interface Props {
  title: string;
  subtitle?: string;
  thumbnails?: Thumbnail[];
  to: string;
  rounded?: boolean;
  size?: number;
}

export default function MediaCard({
  title,
  subtitle,
  thumbnails,
  to,
  rounded = false,
  size = 180,
}: Props) {
  const thumb = bestThumb(thumbnails, size);

  return (
    <Link
      to={to}
      className="group block"
      aria-label={title}
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative overflow-hidden bg-bark"
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? "50%" : "12px",
        }}
      >
        <motion.img
          src={thumb?.url}
          alt={title}
          loading="lazy"
          draggable={false}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.06, rotate: rounded ? 8 : 0 }}
          transition={{ duration: 0.5 }}
        />
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-void/0 opacity-0 transition-all duration-300 group-hover:bg-void/40 group-hover:opacity-100"
          style={{ borderRadius: rounded ? "50%" : "12px" }}
        >
          <RiPlayFill className="text-3xl text-snow drop-shadow-lg" />
        </div>
      </motion.div>
      <div className="mt-3 max-w-[180px]">
        <div className="truncate text-sm font-medium text-snow">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-mist">{subtitle}</div>
        )}
      </div>
    </Link>
  );
}
