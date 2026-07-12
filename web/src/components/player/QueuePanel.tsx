import { AnimatePresence, motion } from "motion/react";
import { RiCloseLine, RiPlayList2Fill } from "react-icons/ri";
import { usePlayer } from "../../lib/store";
import QueueList from "./QueueList";

export default function QueuePanel() {
  const { isQueueOpen, closeQueue, isExpanded } = usePlayer();

  // Don't show the bottom sheet when FullPlayer is expanded — queue is inside it
  if (isExpanded) return null;

  return (
    <AnimatePresence>
      {isQueueOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm"
            onClick={closeQueue}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 z-40 mx-auto flex max-h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-bark/40 bg-ash/95 backdrop-blur-2xl shadow-2xl md:bottom-24"
          >
            {/* Handle */}
            <div className="flex items-center justify-between border-b border-bark/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <RiPlayList2Fill className="text-lg text-ember" />
                <h2 className="font-display text-lg font-medium text-snow">Queue</h2>
              </div>
              <button
                onClick={closeQueue}
                className="rounded-full p-1.5 text-mist transition-colors hover:bg-bark/60 hover:text-snow"
                aria-label="Close queue"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-3 scrollbar-thin">
              <QueueList />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
