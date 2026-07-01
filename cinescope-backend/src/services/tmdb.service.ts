import axios, { AxiosRequestConfig } from "axios";
import dns from "dns";
import https from "https";
import { ENV } from "../config/env";
import { AppError } from "../utils/appError";

const tmdbResolver = new dns.Resolver();
tmdbResolver.setServers(["1.1.1.1", "8.8.8.8"]);

const tmdbHttpsAgent = new https.Agent({
  lookup: (hostname, options, callback) => {
    const lookupOptions = typeof options === "object" ? options : {};
    tmdbResolver.resolve4(hostname, (error, addresses) => {
      if (error || !addresses[0]) {
        return dns.lookup(hostname, { ...lookupOptions, family: 4 }, callback);
      }
      if (lookupOptions.all) {
        return callback(
          null,
          addresses.map((address) => ({ address, family: 4 })),
        );
      }
      callback(null, addresses[0], 4);
    });
  },
});

const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  httpsAgent: tmdbHttpsAgent,
  timeout: 12000, // Slightly expanded boundary window for heavy batch loads
});

type TmdbResultsResponse<T> = {
  results: T[];
};

const getTmdb = async <T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
): Promise<T> => {
  try {
    const res = await tmdbClient.get<T>(endpoint, {
      ...config,
      params: {
        api_key: ENV.TMDB_API_KEY,
        ...config.params,
      },
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new AppError(
          "TMDB data resolution timed out during batch operations.",
          504,
        );
      }
      if (!error.response) {
        throw new AppError(
          `Unable to bridge connectivity to TMDB nodes: ${error.code}`,
          503,
        );
      }
      if (statusCode === 401) {
        throw new AppError("TMDB connection credentials rejected.", 502);
      }
      throw new AppError(`Upstream discovery exception: ${statusCode}`, 502);
    }
    throw error;
  }
};

export const TmdbService = {
  rawGet: getTmdb,
  
  getTrending: async (
    type: "movie" | "tv" = "movie",
    timeWindow: "day" | "week" = "week",
  ) => {
    const data = await getTmdb<TmdbResultsResponse<any>>(
      `/trending/${type}/${timeWindow}`,
    );
    return data.results;
  },

  discoverMedia: async (
    mediaTypeOrParams: "movie" | "tv" | (Record<string, any> & { mediaType?: "movie" | "tv" }),
    params: Record<string, any> = {},
  ) => {
    const mediaType =
      typeof mediaTypeOrParams === "string"
        ? mediaTypeOrParams
        : mediaTypeOrParams.mediaType || "movie";
    const queryParams =
      typeof mediaTypeOrParams === "string"
        ? params
        : (({ mediaType, ...rest }) => rest)(mediaTypeOrParams);
    const endpoint = mediaType === "tv" ? "/discover/tv" : "/discover/movie";
    const data = await getTmdb<TmdbResultsResponse<any>>(endpoint, {
      params: queryParams,
    });
    return data.results.map((item) => ({ ...item, media_type: mediaType }));
  },

  getMovieDetails: async (id: string | number) => {
    return getTmdb(`/movie/${id}`, {
      params: { append_to_response: "videos,credits,similar" },
    });
  },

  getTvDetails: async (id: string | number) => {
    return getTmdb(`/tv/${id}`, {
      params: { append_to_response: "videos,credits,similar" },
    });
  },

  getWatchProviders: async (id: string | number, mediaType: "movie" | "tv") => {
    return getTmdb(`/${mediaType}/${id}/watch/providers`);
  },

  searchMulti: async (query: string) => {
    const data = await getTmdb<TmdbResultsResponse<any>>("/search/multi", {
      params: { query },
    });
    return data.results;
  },
};
