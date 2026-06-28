import { Request } from "express";

export type LocaleContext = {
  country: string;
  language: string;
  timezone?: string;
  regionLabel: string;
  preferredDubLanguages: string[];
};

const timezoneCountryHints: Record<string, string> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "Europe/London": "GB",
  "America/New_York": "US",
  "America/Los_Angeles": "US",
};

const countryLabels: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  KR: "Korea",
  JP: "Japan",
  CN: "China",
};

const dubLanguagesByCountry: Record<string, string[]> = {
  IN: ["hi", "en"],
  KR: ["ko", "en"],
  JP: ["ja", "en"],
  CN: ["zh", "en"],
  US: ["en"],
  GB: ["en"],
};

const normalizeCountry = (value?: string) => {
  const country = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : undefined;
};

const parseAcceptLanguage = (value?: string) => {
  const first = String(value || "").split(",")[0]?.trim() || "";
  const [language, country] = first.split("-");
  return {
    language: language?.toLowerCase() || "en",
    country: normalizeCountry(country),
  };
};

export const LocaleContextService = {
  fromRequest: (req: Request): LocaleContext => {
    const timezone = String(req.headers["x-cinescope-timezone"] || "");
    const acceptLanguage = parseAcceptLanguage(req.headers["accept-language"]);
    const country =
      normalizeCountry(String(req.headers["x-cinescope-country"] || "")) ||
      timezoneCountryHints[timezone] ||
      acceptLanguage.country ||
      "US";
    const language =
      String(req.headers["x-cinescope-language"] || acceptLanguage.language || "en")
        .split("-")[0]
        .toLowerCase();

    return {
      country,
      language,
      timezone: timezone || undefined,
      regionLabel: countryLabels[country] || country,
      preferredDubLanguages: dubLanguagesByCountry[country] || [language, "en"],
    };
  },
};
