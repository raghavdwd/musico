import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { RiPlayFill, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import * as api from "../api";
import { useLibrary } from "../lib/library";
import Section from "../components/home/Section";
import { bestThumb } from "../lib/format";
import { usePlayer } from "../lib/store";
import { MirageLoader, CenteredLoader } from "../components/ui/Loaders";
import { buildRecommendedSongs } from "../lib/recommendations";
import { useTaste } from "../lib/taste";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["home"],
    queryFn: api.getRecommendations,
  });
  const { liked, recent, playlists, getPlaylistSongs } = useLibrary();
  const { profile } = useTaste();
  const navigate = useNavigate();
  const load = usePlayer((s) => s.load);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const sections = useMemo(
    () =>
      (data || []).map((s) => ({
        ...s,
        contents: s.contents.filter((c) => c.type !== "PLAYLIST"),
      })),
    [data],
  );

  const { allSongs, recommendedSongs } = useMemo(
    () =>
      buildRecommendedSongs({
        sections,
        liked,
        recent,
        playlists,
        getPlaylistSongs,
        profile,
      }),
    [sections, liked, recent, playlists, getPlaylistSongs, profile],
  );

  const hasTasteSignals =
    !!profile?.favoriteArtists.length ||
    !!profile?.favoriteSongs.length ||
    liked.length > 0 ||
    recent.length > 0 ||
    playlists.length > 0;
  const heroQueue = hasTasteSignals && recommendedSongs.length > 0 ? recommendedSongs : allSongs;
  const heroQueueSignature = useMemo(
    () => heroQueue.map((song) => song.videoId).join("|"),
    [heroQueue],
  );
  useEffect(() => {
    setHeroIndex(0);
  }, [heroQueueSignature]);

  useEffect(() => {
    if (heroQueue.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroQueue.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [heroQueue.length, heroQueueSignature]);

  const heroSong = heroQueue[heroIndex] ?? heroQueue[0];
  const nextHeroSong = heroQueue.length > 1 ? heroQueue[(heroIndex + 1) % heroQueue.length] : null;
  const heroThumb = bestThumb(heroSong?.thumbnails, 600);
  const nextHeroThumb = bestThumb(nextHeroSong?.thumbnails, 360);
  const recommendationRailSongs = useMemo(
    () => (hasTasteSignals ? recommendedSongs : allSongs).slice(0, 10),
    [hasTasteSignals, recommendedSongs, allSongs],
  );
  const showRecommendationRail = hasTasteSignals && recommendationRailSongs.length > 0;

  useEffect(() => {
    console.debug("[DEBUG-taste] Home state", {
      hasProfile: !!profile,
      seenArtists: profile?.favoriteArtists.length ?? 0,
      seenSongs: profile?.favoriteSongs.length ?? 0,
      liked: liked.length,
      recent: recent.length,
      playlists: playlists.length,
      allSongs: allSongs.length,
      recommendedSongs: recommendedSongs.length,
      heroSong: heroSong?.videoId ?? null,
      showRecommendationRail,
    });
  }, [
    profile,
    liked.length,
    recent.length,
    playlists.length,
    allSongs.length,
    recommendedSongs.length,
    heroSong?.videoId,
    showRecommendationRail,
  ]);

  if (isLoading) {
    return (
      <CenteredLoader>
        <MirageLoader size={64} />
      </CenteredLoader>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      {!profile && !bannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-2xl border border-ember/40 bg-ember/10 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-ember">
              Personalize your home
            </div>
            <p className="mt-1 text-sm text-snow/90">
              Pick a few artists and songs so we can tune recommendations to your taste.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(`/taste-setup?returnTo=${encodeURIComponent("/")}`)}
              className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-void transition-transform hover:scale-[1.02]"
            >
              Set up taste
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="rounded-full border border-bark bg-bark/40 px-4 py-2 text-sm text-snow transition-colors hover:bg-bark/70"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

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
          <div className="relative">
            <div className="absolute right-6 top-6 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setHeroIndex((current) => (current - 1 + heroQueue.length) % heroQueue.length)}
                className="rounded-full border border-bark bg-ash/70 p-2 text-snow transition-colors hover:bg-bark/70"
                aria-label="Previous hero song"
                disabled={heroQueue.length <= 1}
              >
                <RiArrowLeftSLine className="text-xl" />
              </button>
              <button
                type="button"
                onClick={() => setHeroIndex((current) => (current + 1) % heroQueue.length)}
                className="rounded-full border border-bark bg-ash/70 p-2 text-snow transition-colors hover:bg-bark/70"
                aria-label="Next hero song"
                disabled={heroQueue.length <= 1}
              >
                <RiArrowRightSLine className="text-xl" />
              </button>
            </div>
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSong.videoId}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:p-12"
                >
                  <motion.img
                    src={heroThumb?.url}
                    alt={heroSong.name}
                    className="h-48 w-48 rounded-lg object-cover shadow-2xl md:h-64 md:w-64"
                    whileHover={{ scale: 1.02 }}
                  />
                  <div className="flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ember">
                      {hasTasteSignals ? "Recommended for you" : "Featured today"}
                    </div>
                    <h1 className="mt-2 font-display text-4xl font-medium text-snow md:text-6xl">
                      {heroSong.name}
                    </h1>
                    <div className="mt-2 text-lg text-mist">{heroSong.artist.name}</div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        onClick={() => load(heroSong, heroQueue)}
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
                </motion.div>
              </AnimatePresence>

              {nextHeroSong && (
                <button
                  type="button"
                  onClick={() => setHeroIndex((heroIndex + 1) % heroQueue.length)}
                  className="group hidden h-full border-l border-bark/40 bg-void/20 p-4 text-left transition-colors hover:bg-void/35 md:block"
                  aria-label={`Preview next song: ${nextHeroSong.name}`}
                >
                  <div className="mb-3 font-mono text-[10px] uppercase tracking-widest text-mist">
                    Up next
                  </div>
                  <div className="overflow-hidden rounded-xl border border-bark/50 bg-bark">
                    <motion.img
                      src={nextHeroThumb?.url}
                      alt={nextHeroSong.name}
                      className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 truncate text-sm font-medium text-snow">
                    {nextHeroSong.name}
                  </div>
                  <div className="truncate text-xs text-mist">
                    {nextHeroSong.artist.name}
                  </div>
                </button>
              )}
            </div>
            {heroQueue.length > 1 && (
              <div className="flex items-center gap-2 px-6 pb-6 md:px-12">
                {heroQueue.slice(0, 5).map((song, index) => (
                  <button
                    key={song.videoId}
                    type="button"
                    onClick={() => setHeroIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === heroIndex ? "w-8 bg-ember" : "w-3 bg-bark hover:bg-bark/80"
                    }`}
                    aria-label={`Go to ${song.name}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {showRecommendationRail && (
        <Section
          title="Recommended for you"
          items={recommendationRailSongs}
          type="songs"
          queue={hasTasteSignals ? recommendedSongs : allSongs}
        />
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
