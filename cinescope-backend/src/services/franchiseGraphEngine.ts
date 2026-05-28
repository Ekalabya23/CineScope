import {
  CanonicalEntry,
  getCanonicalEntryById,
  getCanonicalUniverseByName,
} from "./canonicalUniverseDatabase";

export type CanonicalRoadmap = {
  target: CanonicalEntry;
  required: CanonicalEntry[];
  optional: CanonicalEntry[];
  fullExperience: CanonicalEntry[];
  universeEntryCount: number;
};

const collectDependencies = (
  entry: CanonicalEntry,
  field: "requiredBefore" | "optionalBefore",
  seen = new Set<string>(),
): CanonicalEntry[] => {
  const result: CanonicalEntry[] = [];

  entry[field].forEach((id) => {
    if (seen.has(id)) return;
    const dependency = getCanonicalEntryById(id);
    if (!dependency) return;
    seen.add(id);
    result.push(...collectDependencies(dependency, "requiredBefore", seen));
    result.push(dependency);
  });

  return result;
};

const uniqueById = (entries: CanonicalEntry[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
};

export const FranchiseGraphEngine = {
  buildRoadmap: (target: CanonicalEntry): CanonicalRoadmap => {
    const required = uniqueById([
      ...collectDependencies(target, "requiredBefore"),
      ...target.requiredBefore
        .map((id) => getCanonicalEntryById(id))
        .filter((entry): entry is CanonicalEntry => Boolean(entry)),
    ]).sort((a, b) => a.chronologyIndex - b.chronologyIndex);

    const optional = uniqueById([
      ...target.optionalBefore
        .map((id) => getCanonicalEntryById(id))
        .filter((entry): entry is CanonicalEntry => Boolean(entry)),
      ...required.flatMap((entry) => collectDependencies(entry, "optionalBefore")),
    ])
      .filter((entry) => !required.some((requiredEntry) => requiredEntry.id === entry.id))
      .sort((a, b) => a.chronologyIndex - b.chronologyIndex);

    const universe = getCanonicalUniverseByName(target.universe);

    const allEntries = [...required, ...optional];
    const isRedundantArc = (entry: CanonicalEntry) => {
      if (entry.id === target.id) return false;
      if (entry.mediaType !== "arc") return false;
      // If any of the entries in the roadmap is a dependency of this arc, the arc is covered.
      return entry.requiredBefore.some((depId) =>
        allEntries.some((other) => other.id === depId)
      );
    };

    const finalRequired = required.filter((entry) => !isRedundantArc(entry));
    const finalOptional = optional.filter((entry) => !isRedundantArc(entry));

    return {
      target,
      required: finalRequired,
      optional: finalOptional,
      fullExperience: uniqueById([...finalRequired, ...finalOptional]).sort(
        (a, b) => a.chronologyIndex - b.chronologyIndex,
      ),
      universeEntryCount: universe?.entries.length || 0,
    };
  },
};
