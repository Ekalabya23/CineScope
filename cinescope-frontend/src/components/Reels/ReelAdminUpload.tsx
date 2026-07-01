import React, { useEffect, useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import { apiClient } from "../../api/client";

type ReelAdminUploadProps = {
  onUploaded: () => void;
};

type TitleSuggestion = {
  id: string;
  title: string;
  year: string;
  poster: string;
  type: "movie" | "tv";
  rating: string;
  franchise: string;
};

type ReelMetadata = {
  title?: string;
  posterPath?: string;
  genreIds?: number[];
  actorIds?: number[];
  actorNames?: string[];
  originalLanguage?: string;
  originCountries?: string[];
  regionTags?: string[];
  moodTags?: string[];
  vibeLabel?: string;
};

export const ReelAdminUpload: React.FC<ReelAdminUploadProps> = ({ onUploaded }) => {
  const [open, setOpen] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [titleQuery, setTitleQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<TitleSuggestion | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<ReelMetadata | null>(null);
  const [tmdbId, setTmdbId] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [moodTags, setMoodTags] = useState("mind-bending");
  const [autoTagging, setAutoTagging] = useState(false);
  const [vibeLabel, setVibeLabel] = useState("");
  const [vibeLabelEdited, setVibeLabelEdited] = useState(false);
  const [priority, setPriority] = useState("50");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadDetail, setUploadDetail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const selectedLabel = selectedTitle
      ? `${selectedTitle.title}${selectedTitle.year ? ` (${selectedTitle.year})` : ""}`
      : "";

    if (!open || titleQuery.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSearching(false);
      return;
    }

    if (selectedTitle && titleQuery === selectedLabel) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSearching(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setSearching(true);
      setSuggestionsOpen(true);
      apiClient
        .get("/search/suggestions", { params: { q: titleQuery.trim() } })
        .then((res) => setSuggestions(res.data.results || []))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false));
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [open, selectedTitle, titleQuery]);

  const chooseSuggestion = (suggestion: TitleSuggestion) => {
    setSelectedTitle(suggestion);
    setTitleQuery(`${suggestion.title}${suggestion.year ? ` (${suggestion.year})` : ""}`);
    setTmdbId(suggestion.id);
    setMediaType(suggestion.type);
    setSelectedMetadata(null);
    setVibeLabelEdited(false);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setSearching(false);
    setAutoTagging(true);
    apiClient
      .get("/reels/mood-tags", {
        params: { tmdbId: suggestion.id, mediaType: suggestion.type },
      })
      .then((res) => {
        setSelectedMetadata(res.data.data || null);
        const tags = res.data.data?.moodTags || [];
        if (tags.length > 0) setMoodTags(tags.slice(0, 3).join(", "));
        if (!vibeLabelEdited && res.data.data?.vibeLabel) {
          setVibeLabel(res.data.data.vibeLabel);
        }
      })
      .finally(() => setAutoTagging(false));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!video) {
      setError("Choose a reel video first.");
      return;
    }
    if (!tmdbId) {
      setError("Search and select a movie or show first.");
      return;
    }
    if (autoTagging) {
      setError("Wait for title metadata to finish loading, then upload.");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadStage("Preparing upload");
    setUploadDetail("");
    setError("");
    try {
      const signatureRes = await apiClient.get("/reels/upload-signature");
      const signature = signatureRes.data.data;
      const cloudinaryFormData = new FormData();
      cloudinaryFormData.append("file", video);
      cloudinaryFormData.append("api_key", signature.apiKey);
      cloudinaryFormData.append("timestamp", String(signature.timestamp));
      cloudinaryFormData.append("folder", signature.folder);
      cloudinaryFormData.append("media_metadata", String(signature.mediaMetadata));
      cloudinaryFormData.append("signature", signature.signature);
      const startedAt = Date.now();
      setUploadStage("Uploading to Cloudinary");

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`,
        cloudinaryFormData,
        {
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.1);
            const loadedMb = progressEvent.loaded / (1024 * 1024);
            const totalMb = progressEvent.total / (1024 * 1024);
            const speedMBps = loadedMb / elapsedSeconds;
            const speedMbps = speedMBps * 8;
            const remainingMb = Math.max(totalMb - loadedMb, 0);
            const etaSeconds = speedMBps > 0 ? Math.round(remainingMb / speedMBps) : 0;
            setUploadProgress(percent);
            setUploadDetail(
              `${loadedMb.toFixed(1)} / ${totalMb.toFixed(1)} MB · ${speedMbps.toFixed(2)} Mbps · ETA ${etaSeconds}s`,
            );
          },
        },
      );
      setUploadProgress(100);
      setUploadStage("Saving reel");
      setUploadDetail("Cloudinary upload complete");

      await apiClient.post("/reels", {
        videoUrl: uploadRes.data.secure_url,
        cloudinaryPublicId: uploadRes.data.public_id,
        durationMs: uploadRes.data.duration
          ? Math.round(Number(uploadRes.data.duration) * 1000)
          : Math.max(Math.round(video.size / 1024), 1000),
        tmdbId,
        mediaType,
        title: selectedMetadata?.title || selectedTitle?.title || titleQuery,
        posterPath: selectedMetadata?.posterPath,
        genreIds: selectedMetadata?.genreIds || [],
        actorIds: selectedMetadata?.actorIds || [],
        actorNames: selectedMetadata?.actorNames || [],
        originalLanguage: selectedMetadata?.originalLanguage,
        originCountries: selectedMetadata?.originCountries || [],
        regionTags: selectedMetadata?.regionTags || [],
        moodTags: moodTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        vibeLabel: vibeLabel || selectedMetadata?.vibeLabel,
        priority: Number(priority || 0),
      }, {
        timeout: 300000,
      });
      setUploadProgress(100);
      setOpen(false);
      onUploaded();
    } catch (err: any) {
      setError(
        err.code === "ECONNABORTED"
          ? "Upload timed out. Check Cloudinary/network and try again."
          : err.response?.data?.message || "Upload failed.",
      );
    } finally {
      setSubmitting(false);
      setUploadStage("");
      setUploadDetail("");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-24 z-[60] inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-black shadow-2xl transition hover:scale-105"
      >
        <Upload size={15} strokeWidth={2.5} />
        Upload Reel
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center py-8">
            <form
              onSubmit={submit}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#08090d] p-5 text-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
                  Admin curation
                </p>
                <h2 className="mt-1 text-2xl font-black">Upload Reel</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-black"
                aria-label="Close upload panel"
              >
                x
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                Reel video
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => setVideo(event.target.files?.[0] || null)}
                  className="rounded-xl border border-white/10 bg-black/35 p-3 text-sm normal-case tracking-normal text-white file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-black file:text-black"
                />
              </label>

              <div className="relative">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Movie or show name
                  <input
                    value={titleQuery}
                    onFocus={() => {
                      if (!selectedTitle && suggestions.length > 0) setSuggestionsOpen(true);
                    }}
                    onChange={(event) => {
                      setTitleQuery(event.target.value);
                      setSelectedTitle(null);
                      setSuggestionsOpen(true);
                    }}
                    placeholder="Type Interstellar, Breaking Bad..."
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  />
                </label>
                {suggestionsOpen && (suggestions.length > 0 || searching) && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#101116] p-2 shadow-2xl">
                    {searching && (
                      <p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
                        Searching TMDB
                      </p>
                    )}
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        type="button"
                        onClick={() => chooseSuggestion(suggestion)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/10"
                      >
                        {suggestion.poster ? (
                          <img
                            src={suggestion.poster}
                            alt=""
                            className="h-14 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-14 w-10 rounded-md bg-white/10" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-white">
                            {suggestion.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-zinc-500">
                            {suggestion.type.toUpperCase()} {suggestion.year ? `· ${suggestion.year}` : ""} · TMDB {suggestion.id}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTitle && (
                  <p className="mt-2 text-xs font-semibold text-emerald-300">
                    Selected {selectedTitle.title} · TMDB {selectedTitle.id} · {selectedTitle.type.toUpperCase()}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  TMDB ID
                  <input
                    value={tmdbId}
                    onChange={(event) => setTmdbId(event.target.value)}
                    required
                    inputMode="numeric"
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  />
                </label>
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Type
                  <select
                    value={mediaType}
                    onChange={(event) => setMediaType(event.target.value as "movie" | "tv")}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  >
                    <option value="movie">Movie</option>
                    <option value="tv">TV</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                Mood tags {autoTagging ? "(auto selecting...)" : ""}
                <input
                  value={moodTags}
                  onChange={(event) => setMoodTags(event.target.value)}
                  placeholder="dark, slow-burn"
                  className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Vibe label
                  <input
                    value={vibeLabel}
                    onChange={(event) => {
                      setVibeLabel(event.target.value);
                      setVibeLabelEdited(true);
                    }}
                    required
                    maxLength={80}
                    placeholder={autoTagging ? "Generating vibe label..." : "Quiet revenge energy"}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  />
                  {selectedMetadata?.vibeLabel && !vibeLabelEdited && (
                    <span className="text-[10px] font-semibold normal-case tracking-normal text-emerald-300">
                      Auto-generated from the selected title
                    </span>
                  )}
                </label>
                <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Priority
                  <input
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    type="number"
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm normal-case tracking-normal text-white outline-none"
                  />
                </label>
              </div>
            </div>

            {error && <p className="mt-4 text-sm font-bold text-red-300">{error}</p>}

            {submitting && (
              <div className="mt-5 space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  <span>{uploadStage}</span>
                  <span>{uploadProgress}%</span>
                </div>
                {uploadDetail && (
                  <p className="text-xs font-semibold text-zinc-500">{uploadDetail}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || autoTagging}
              className={`${submitting ? "mt-3" : "mt-5"} w-full rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-black disabled:opacity-60`}
            >
              {submitting
                ? uploadStage || "Uploading..."
                : autoTagging
                  ? "Preparing metadata..."
                  : "Upload to Cloudinary"}
            </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
