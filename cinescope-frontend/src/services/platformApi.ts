import { apiClient } from "../api/client";

export const platformApi = {
  homepage: () => apiClient.get("/homepage").then((res) => res.data.data),
  continueWatching: () =>
    apiClient.get("/history/continue-watching").then((res) => res.data.data),
  tasteProfile: () => apiClient.get("/user/taste-profile").then((res) => res.data.data),
  profile: () => apiClient.get("/user/profile").then((res) => res.data.data),
  updateProfile: (payload: any) =>
    apiClient.patch("/user/profile", payload).then((res) => res.data.data),
  analytics: () => apiClient.get("/user/analytics").then((res) => res.data.data),
  history: () => apiClient.get("/history").then((res) => res.data.data),
  watchlist: () => apiClient.get("/watchlist").then((res) => res.data.data),
  moodDiscovery: (mood: string) =>
    apiClient.get(`/discovery/mood?mood=${encodeURIComponent(mood)}`).then((res) => res.data.data),
  personalized: () =>
    apiClient.get("/recommendations/personalized").then((res) => res.data.data),
  similar: (id: string | number, type = "movie") =>
    apiClient
      .get(`/recommendations/similar/${id}?type=${encodeURIComponent(type)}`)
      .then((res) => res.data.data),
  trackInteraction: (payload: any) => apiClient.post("/history/interaction", payload),
};
