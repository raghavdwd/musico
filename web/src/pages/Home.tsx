import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { RiPlayFill } from "react-icons/ri";
import * as api from "../api";
import { useLibrary } from "../lib/library";
import Section from "../components/home/Section";
import { bestThumb } from "../lib/format";
import { usePlayer } from "../lib/store";
import { MirageLoader, CenteredLoader } from "../components/ui/Loaders";
import type { SongDetailed } from "../types";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: api.getRecommendations,
  });
  const { liked } = useLibrary();
  const navigate = useNavigate();
  const load = usePlayer((s) => s.load);

  if (isLoading) {
    return (
      <CenteredLoader>
        <MirageLoader size={64} />
      </CenteredLoader>
    );
  }

  const sections = data || [];
  const allSongs: SongDetailed[] = sections.flatMap((s) => s.contents.filter((c): c is SongDetailed => c.type === "SONG"));
  const heroSong = allSongs[0];
  const heroThumb = bestThumb(heroSong?.thumbnails, 600);

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      {heroSong && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-bark/40 bg-ash"
        >
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `url(${heroThumb?.url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(40px) saturate(120%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-void/95 via-void/60 to-transparent" />
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:p-12">
            <motion.img
              src={heroThumb?.url}
              alt={heroSong.name}
              className="h-48 w-48 rounded-lg object-cover shadow-2xl md:h-64 md:w-64"
              whileHover={{ scale: 1.02 }}
            />
            <div className="flex-1">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
                Featured today
              </div>
              <h1 className="mt-2 font-display text-4xl font-medium text-snow md:text-6xl">
                {heroSong.name}
              </h1>
              <div className="mt-2 text-lg text-mist">{heroSong.artist.name}</div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => load(heroSong, allSongs)}
                  className="flex items-center gap-2 rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-105 active:scale-95"
                >
                  <RiPlayFill className="text-lg" /> Play
                </button>
                <button
                  onClick={() => navigate(`/song/${heroSong.videoId}`)}
                  className="rounded-full border border-bark bg-ash/60 px-6 py-2.5 text-sm font-medium text-snow transition-colors hover:bg-bark/60"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {liked.length > 0 && (
        <Section title="Liked songs" items={liked.slice(0, 10)} type="songs" queue={liked} />
      )}

      {sections.map((section, i) => (
        <Section
          key={`${section.title}-${i}`}
          title={section.title}
          items={section.contents}
          type={section.contents[0]?.type === "SONG" ? "songs" : "mixed"}
          queue={allSongs}
        />
      ))}
    </div>
  );
}
