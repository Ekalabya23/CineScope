import { CanonicalRoadmap } from "./franchiseGraphEngine";
import { CanonicalEntry } from "./canonicalUniverseDatabase";

export type ContinuityValidation = {
  isValid: boolean;
  warnings: string[];
  canonAccuracy: number;
  continuityConfidence: number;
  franchiseAccuracy: number;
};

export const ContinuityValidator = {
  validate: (roadmap: CanonicalRoadmap): ContinuityValidation => {
    const warnings: string[] = [];
    const requiredIds = new Set(roadmap.required.map((entry) => entry.id));

    roadmap.target.requiredBefore.forEach((id) => {
      if (!requiredIds.has(id)) {
        warnings.push(`Missing required dependency: ${id}`);
      }
    });

    const ordered = roadmap.required.every((entry, index, entries) => {
      if (index === 0) return true;
      return entries[index - 1].chronologyIndex <= entry.chronologyIndex;
    });

    if (!ordered) {
      warnings.push("Required roadmap was not chronology-safe.");
    }

    const crossUniverse = roadmap.fullExperience.some(
      (entry) => entry.universe !== roadmap.target.universe,
    );
    if (crossUniverse) {
      warnings.push("Roadmap contains cross-universe entries.");
    }

    const penalty = warnings.length * 8;

    return {
      isValid: warnings.length === 0,
      warnings,
      canonAccuracy: Math.max(70, 98 - penalty),
      continuityConfidence: Math.max(68, 96 - penalty),
      franchiseAccuracy: Math.max(72, crossUniverse ? 80 : 97 - penalty),
    };
  },

  validateGeneratedRoadmap: (
    roadmap: any,
    allowedEntries: CanonicalEntry[],
    target: CanonicalEntry,
  ): ContinuityValidation => {
    const warnings: string[] = [];
    const allowedById = new Map(allowedEntries.map((entry) => [entry.id, entry]));
    const sections = [
      ...(Array.isArray(roadmap?.essentialViewing) ? roadmap.essentialViewing : []),
      ...(Array.isArray(roadmap?.recommendedViewing) ? roadmap.recommendedViewing : []),
      ...(Array.isArray(roadmap?.optionalViewing) ? roadmap.optionalViewing : []),
    ];
    const ids = sections.map((item: any) => item?.id).filter(Boolean);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      warnings.push("Gemini returned duplicate roadmap entries.");
    }

    ids.forEach((id) => {
      if (!allowedById.has(id)) warnings.push(`Gemini returned a non-canonical entry: ${id}`);
    });

    if (!uniqueIds.has(target.id)) {
      warnings.push("Gemini omitted the detected target title.");
    }

    target.requiredBefore.forEach((dependencyId) => {
      if (!uniqueIds.has(dependencyId)) {
        warnings.push(`Gemini omitted required dependency: ${dependencyId}`);
      }
    });

    const orderedCanonEntries = ids
      .map((id) => allowedById.get(id))
      .filter((entry): entry is CanonicalEntry => Boolean(entry));
    const chronologySafe = orderedCanonEntries.every((entry, index, list) => {
      if (index === 0) return true;
      return list[index - 1].chronologyIndex <= entry.chronologyIndex;
    });

    if (!chronologySafe) {
      warnings.push("Gemini returned a chronology violation.");
    }

    const crossUniverse = orderedCanonEntries.some((entry) => entry.universe !== target.universe);
    if (crossUniverse) {
      warnings.push("Gemini mixed franchise universes.");
    }

    const penalty = warnings.length * 10;

    return {
      isValid: warnings.length === 0,
      warnings,
      canonAccuracy: Math.max(50, Math.min(99, Number(roadmap?.canonAccuracy || 94) - penalty)),
      continuityConfidence: Math.max(
        45,
        Math.min(99, Number(roadmap?.continuityConfidence || 92) - penalty),
      ),
      franchiseAccuracy: Math.max(
        45,
        Math.min(99, Number(roadmap?.franchiseMatchScore || 92) - penalty),
      ),
    };
  },
};
