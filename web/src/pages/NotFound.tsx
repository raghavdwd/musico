import { Link } from "react-router-dom";
import { RiArrowLeftLine } from "react-icons/ri";

export default function NotFound() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
      <div className="font-display text-6xl text-snow">404</div>
      <p className="text-mist">Couldn't find that page.</p>
      <Link
        to="/"
        className="flex items-center gap-2 rounded-full border border-bark bg-ash/60 px-4 py-2 text-sm text-snow transition-colors hover:bg-bark/60"
      >
        <RiArrowLeftLine /> Back home
      </Link>
    </div>
  );
}
