import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { RiSearch2Line } from "react-icons/ri";
import Sidebar from "./Sidebar";
import PlayerBar from "../player/PlayerBar";
import FullPlayer from "../player/FullPlayer";
import QueuePanel from "../player/QueuePanel";
import { Toaster } from "sonner";
import AddToPlaylist from "../ui/AddToPlaylist";

function TopSearchBar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="mb-6 hidden md:block"
    >
      <div className="relative">
        <RiSearch2Line className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search songs, albums, artists, playlists"
          className="w-full rounded-full border border-bark/60 bg-ash py-2.5 pl-12 pr-12 text-sm text-snow placeholder:text-mist focus:border-ember focus:outline-none"
        />
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-bark bg-bark/60 px-1.5 py-0.5 font-mono text-[10px] text-mist">
          ⌘K
        </kbd>
      </div>
    </form>
  );
}

export default function Layout() {
  const location = useLocation();
  const isSearchPage = location.pathname === "/search";

  return (
    <div className="flex h-screen min-w-0 flex-col bg-void text-snow">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-full px-4 pb-32 pt-4 md:px-8 md:pt-6">
            {!isSearchPage && <TopSearchBar />}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="min-w-0"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <PlayerBar />
      <FullPlayer />
      <QueuePanel />
      <AddToPlaylist />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--color-ash)",
            color: "var(--color-snow)",
            border: "1px solid var(--color-bark)",
          },
        }}
      />
    </div>
  );
}
