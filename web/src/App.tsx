import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Album from "./pages/Album";
import Artist from "./pages/Artist";
import Playlist from "./pages/Playlist";
import Song from "./pages/Song";
import Liked from "./pages/Liked";
import Recent from "./pages/Recent";
import LocalPlaylist from "./pages/LocalPlaylist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="album/:id" element={<Album />} />
            <Route path="artist/:id" element={<Artist />} />
            <Route path="playlist/:id" element={<Playlist />} />
            <Route path="playlist/local/:id" element={<LocalPlaylist />} />
            <Route path="song/:id" element={<Song />} />
            <Route path="liked" element={<Liked />} />
            <Route path="recent" element={<Recent />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
