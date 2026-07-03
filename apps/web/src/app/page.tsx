"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "../features/profiles/store";
import { moviesApi, MovieResponse, ReviewResponse, MovieDetailsResponse } from "../features/movies/api";
import { authApi } from "../features/auth/api";
import { ApiError } from "../services/api-client";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const clearActiveProfile = useProfileStore((state) => state.clearActiveProfile);

  // Catalogue states
  const [trending, setTrending] = useState<MovieResponse[]>([]);
  const [popular, setPopular] = useState<MovieResponse[]>([]);
  const [topRated, setTopRated] = useState<MovieResponse[]>([]);
  const [featured, setFeatured] = useState<MovieResponse | null>(null);

  // Selected item modal states
  const [selectedMovie, setSelectedMovie] = useState<MovieDetailsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<MovieResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [postingReview, setPostingReview] = useState(false);

  // UI state
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = useCallback(async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const [trendData, popData, topData] = await Promise.all([
        moviesApi.getTrending(activeProfile.id),
        moviesApi.getPopular(activeProfile.id),
        moviesApi.getTopRated(activeProfile.id),
      ]);

      setTrending(trendData);
      setPopular(popData);
      setTopRated(topData);

      // Set featured billboard movie from popular list
      if (popData.length > 0) {
        setFeatured(popData[0]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.push("/login");
        return;
      }
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile, router]);

  // Redirect to profiles if none selected
  useEffect(() => {
    if (!activeProfile) {
      router.push("/profiles");
    } else {
      fetchCatalog();
    }
  }, [activeProfile, router, fetchCatalog]);

  const handleOpenMovieDetails = async (movie: MovieResponse) => {
    if (!activeProfile) return;
    try {
      const details = await moviesApi.getMovieDetails(movie.id, activeProfile.id);
      setSelectedMovie(details);

      // Load matching recommendations and reviews
      const [recs, revs] = await Promise.all([
        moviesApi.getRecommendations(movie.id, activeProfile.id),
        moviesApi.getReviews({ movieId: movie.id }),
      ]);
      setRecommendations(recs);
      setReviews(revs);
      
      // Reset review form
      setRating(5);
      setComment("");
      setReviewError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load movie details.";
      alert(message);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !selectedMovie || !comment.trim()) return;
    setPostingReview(true);
    setReviewError(null);
    try {
      await moviesApi.createReview({
        profileId: activeProfile.id,
        rating,
        comment,
        movieId: selectedMovie.id,
      });

      // Reload reviews and detail rating
      const updatedReviews = await moviesApi.getReviews({ movieId: selectedMovie.id });
      setReviews(updatedReviews);
      
      // Update selectedMovie averageRating locally
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / updatedReviews.length;
      setSelectedMovie({
        ...selectedMovie,
        averageRating: parseFloat(avg.toFixed(1)),
      });

      setComment("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post review.";
      setReviewError(message);
    } finally {
      setPostingReview(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore - clear local state regardless
    }
    clearActiveProfile();
    router.push("/login");
  };

  if (!activeProfile || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-400 text-sm">Loading ZeroX Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white select-none overflow-x-hidden">
      
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 w-full z-40 bg-gradient-to-b from-black to-transparent px-6 py-4 flex items-center justify-between transition-colors duration-300 hover:bg-zinc-950">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-red-600 font-extrabold text-2xl md:text-3xl tracking-tighter">
            ZeroX
          </Link>
          <div className="hidden md:flex gap-5 text-sm text-zinc-300">
            <Link href="/" className="hover:text-white transition-colors font-medium">Home</Link>
            <span className="cursor-not-allowed text-zinc-600">Series</span>
            <span className="cursor-not-allowed text-zinc-600">Movies</span>
            <span className="cursor-not-allowed text-zinc-600">New & Popular</span>
          </div>
        </div>

        {/* Profile Controls */}
        <div className="relative">
          <div
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeProfile.avatarUrl}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm font-semibold hidden sm:inline">{activeProfile.name}</span>
            <span className="text-zinc-500 text-xs">▼</span>
          </div>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl py-1 text-sm z-50 animate-in fade-in slide-in-from-top-2">
              <Link
                href="/profiles"
                className="block px-4 py-2 hover:bg-zinc-800 transition-colors"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                Switch Profile
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 hover:bg-zinc-800 transition-colors"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                Profile Settings
              </Link>
              <Link
                href="/security"
                className="block px-4 py-2 hover:bg-zinc-800 transition-colors"
                onClick={() => setIsProfileDropdownOpen(false)}
              >
                Account Security
              </Link>
              <div className="border-t border-zinc-800 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Billboard Hero Section */}
      {featured && (
        <div className="relative h-[56.25vw] min-h-[400px] max-h-[800px] w-full z-0 overflow-hidden">
          {/* Billboard background picture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featured.backdropUrl}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover brightness-[0.4]"
          />
          {/* Bottom fade shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />

          {/* Featured details container */}
          <div className="absolute bottom-[20%] left-6 md:left-12 z-20 max-w-xl space-y-4">
            <h1 className="text-3xl md:text-6xl font-bold tracking-tight">{featured.title}</h1>
            <p className="text-zinc-300 text-sm md:text-base line-clamp-3 leading-relaxed shadow-sm">
              {featured.description}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleOpenMovieDetails(featured)}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-white hover:bg-zinc-200 text-black font-extrabold rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>▶</span> Play
              </button>
              <button
                onClick={() => handleOpenMovieDetails(featured)}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-zinc-650 bg-opacity-70 hover:bg-opacity-50 text-white font-extrabold rounded-lg flex items-center gap-2 border border-zinc-550 transition-all transform hover:scale-105"
              >
                ⓘ More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Lists (Rails) */}
      <div className="relative z-10 px-6 md:px-12 -mt-16 md:-mt-24 space-y-12 pb-24">
        
        {/* Rail 1: Trending Now */}
        {trending.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">Trending Now</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {trending.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleOpenMovieDetails(movie)}
                  className="flex-shrink-0 w-44 md:w-56 cursor-pointer transform hover:scale-105 transition-all shadow-md"
                >
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden relative border border-zinc-800 hover:border-zinc-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-zinc-900 bg-opacity-70 text-xs px-2 py-0.5 rounded font-bold">
                      {movie.rating}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-xs font-semibold mt-2 line-clamp-1 group-hover:text-white">
                    {movie.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rail 2: Popular on ZeroX */}
        {popular.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">Popular on ZeroX</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {popular.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleOpenMovieDetails(movie)}
                  className="flex-shrink-0 w-44 md:w-56 cursor-pointer transform hover:scale-105 transition-all shadow-md"
                >
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden relative border border-zinc-800 hover:border-zinc-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-zinc-900 bg-opacity-70 text-xs px-2 py-0.5 rounded font-bold">
                      {movie.rating}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-xs font-semibold mt-2 line-clamp-1">
                    {movie.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rail 3: Top Rated */}
        {topRated.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg md:text-2xl font-bold tracking-tight">Top Rated</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {topRated.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => handleOpenMovieDetails(movie)}
                  className="flex-shrink-0 w-44 md:w-56 cursor-pointer transform hover:scale-105 transition-all shadow-md"
                >
                  <div className="aspect-[16/9] w-full rounded-lg overflow-hidden relative border border-zinc-800 hover:border-zinc-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-zinc-900 bg-opacity-70 text-xs px-2 py-0.5 rounded font-bold">
                      ★ {movie.averageRating}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-xs font-semibold mt-2 line-clamp-1">
                    {movie.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Detail Overlay Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative my-8">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black bg-opacity-60 flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>

            {/* Banner Header */}
            <div className="relative h-64 md:h-96 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedMovie.backdropUrl}
                alt={selectedMovie.title}
                className="w-full h-full object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 md:left-12 space-y-2">
                <h2 className="text-2xl md:text-5xl font-extrabold">{selectedMovie.title}</h2>
                <div className="flex gap-4 items-center text-xs md:text-sm text-zinc-400">
                  <span className="text-emerald-500 font-bold">★ {selectedMovie.averageRating || "N/A"} Rating</span>
                  <span>{new Date(selectedMovie.releaseDate).getFullYear()}</span>
                  <span className="border border-zinc-600 px-1.5 py-0.2 rounded text-[11px] text-zinc-300 uppercase tracking-wide">
                    {selectedMovie.rating}
                  </span>
                  <span>{selectedMovie.durationMinutes}m</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Details Column */}
              <div className="md:col-span-2 space-y-6">
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
                  {selectedMovie.description}
                </p>

                {/* Cast list */}
                {selectedMovie.cast && selectedMovie.cast.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Cast</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {selectedMovie.cast.map((c) => `${c.cast.name} (${c.characterName})`).join(", ")}
                    </p>
                  </div>
                )}

                {/* Crew list */}
                {selectedMovie.crew && selectedMovie.crew.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Crew</h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {selectedMovie.crew.map((c) => `${c.crew.name} (${c.role})`).join(", ")}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-zinc-800">
                    <h4 className="font-bold text-sm tracking-wide uppercase text-zinc-400">More Like This</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          onClick={() => handleOpenMovieDetails(rec)}
                          className="cursor-pointer group space-y-2"
                        >
                          <div className="aspect-[16/9] w-full rounded overflow-hidden border border-zinc-800 group-hover:border-zinc-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rec.backdropUrl}
                              alt={rec.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <p className="text-zinc-400 text-[11px] font-semibold truncate group-hover:text-white">
                            {rec.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews & Social Column */}
              <div className="space-y-6 md:border-l md:border-zinc-800 md:pl-8">
                <h3 className="font-bold text-base tracking-wide uppercase text-zinc-400">Audience Reviews</h3>

                {/* Post review form */}
                <form onSubmit={handlePostReview} className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                  <h4 className="font-semibold text-xs text-zinc-300">Submit a Review</h4>
                  {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs"
                    >
                      <option value="5">★★★★★ (5/5)</option>
                      <option value="4">★★★★☆ (4/5)</option>
                      <option value="3">★★★☆☆ (3/5)</option>
                      <option value="2">★★☆☆☆ (2/5)</option>
                      <option value="1">★☆☆☆☆ (1/5)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Comment</label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={postingReview}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                  >
                    {postingReview ? "Posting..." : "Post Review"}
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                  {reviews.length === 0 ? (
                    <p className="text-zinc-600 text-xs">No reviews posted yet.</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="space-y-1 text-xs border-b border-zinc-850 pb-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-zinc-300">{rev.profile.name}</span>
                          <span className="text-yellow-500 font-bold">{"★".repeat(rev.rating)}</span>
                        </div>
                        <p className="text-zinc-400 italic">&ldquo;{rev.comment}&rdquo;</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
