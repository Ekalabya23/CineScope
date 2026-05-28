import { GeminiService } from "../ai/gemini.service";
import { CanonicalEntry } from "./canonicalUniverseDatabase";
import { EmotionalArcAnalyzer } from "./emotionalArcAnalyzer";
import { FranchiseGraphEngine } from "./franchiseGraphEngine";
import { NarrativeProgressionEngine } from "./narrativeProgressionEngine";
import { RoadmapPromptBuilder } from "./roadmapPromptBuilder";
import { RoadmapValidator } from "./roadmapValidator";
import { SemanticTitleDetector } from "./semanticTitleDetector";
import { RoadmapMode, RoadmapNode, TimelineBuilder } from "./timelineBuilder";
import { ContinuityValidator } from "./continuityValidator";

export type RoadmapPayload = {
  title: string;
  detectedTitle: string;
  franchise: string;
  normalizedQuery: string;
  matchedTitle: string;
  detectedUniverse: string;
  confidence: number;
  canonAccuracy: number;
  continuityConfidence: number;
  franchiseAccuracy: number;
  franchiseMatchScore: number;
  validationWarnings: string[];
  correctionReason?: string;
  recommendedMode: RoadmapMode;
  availableModes: RoadmapMode[];
  watchOrder: RoadmapNode[];
  essentialViewing: RoadmapViewingItem[];
  recommendedViewing: RoadmapViewingItem[];
  optionalViewing: RoadmapViewingItem[];
  emotionalArc: string[];
  continuityInsight: string;
  aiSummary: string;
  narrativeProgression: ReturnType<typeof NarrativeProgressionEngine.build>;
};

export type RoadmapViewingItem = {
  id: string;
  title: string;
  year?: string;
  importanceLevel: "Essential" | "Recommended" | "Optional";
  continuityExplanation: string;
  emotionalRelevance: string;
  required: boolean;
  posterPath?: string;
  mediaType: "movie" | "tv";
  importanceScore: number;
};

const modes: RoadmapMode[] = [
  "Essential Only",
  "Full Experience",
  "Chronological",
  "Release Order",
  "Character Journey",
  "Emotional Arc",
];

const standalonePayload = async (title: string): Promise<RoadmapPayload> => {
  const detected = await SemanticTitleDetector.detect(title);

  return {
    title: detected.detectedTitle,
    detectedTitle: detected.detectedTitle,
    franchise: detected.franchise,
    normalizedQuery: detected.originalQuery,
    matchedTitle: detected.tmdbValidatedTitle || detected.detectedTitle,
    detectedUniverse: "Standalone / Unverified Canon",
    confidence: detected.confidence,
    canonAccuracy: detected.tmdbId ? 76 : 58,
    continuityConfidence: 64,
    franchiseAccuracy: 62,
    franchiseMatchScore: detected.franchiseMatchScore,
    validationWarnings: [
      "No verified canonical franchise graph exists for this query yet, so CineScope did not invent prerequisites.",
    ],
    correctionReason: detected.correctionReason,
    recommendedMode: "Essential Only",
    availableModes: modes,
    watchOrder: [],
    essentialViewing: [],
    recommendedViewing: [],
    optionalViewing: [],
    emotionalArc: ["Standalone Context", "No Required Prerequisites"],
    continuityInsight:
      "CineScope found no verified canon dependency chain for this title, so the continuity-safe recommendation is to avoid fabricated watch orders.",
    aiSummary:
      "No canon-validated roadmap was generated because this query is not yet represented in CineScope's canonical franchise graph.",
    narrativeProgression: {
      summary: "No canon-validated prerequisite path is available yet.",
      phases: [],
    },
  };
};

const buildEmotionalArc = (nodes: RoadmapNode[], universe: string) => {
  const arc = nodes
    .filter((node) => node.requirement === "required")
    .map((node) => node.emotionalRelevance)
    .filter(Boolean)
    .slice(0, 5)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1));

  return arc.length >= 2 ? arc : EmotionalArcAnalyzer.buildArc({
    coreTitles: nodes.map((node) => node.title),
    optionalTitles: [],
    characterFocus: nodes.map((node) => node.emotionalRelevance),
    continuityThemes: nodes.map((node) => node.continuitySignificance),
  }, universe);
};

const applyGeminiExplanations = (
  nodes: RoadmapNode[],
  aiExplanation: any,
): RoadmapNode[] => {
  const nodeExplanations = aiExplanation?.nodeExplanations || {};

  return nodes.map((node) => ({
    ...node,
    aiExplanation:
      nodeExplanations[node.id]?.aiExplanation || node.aiExplanation,
    emotionalRelevance:
      nodeExplanations[node.id]?.emotionalRelevance || node.emotionalRelevance,
    continuitySignificance:
      nodeExplanations[node.id]?.continuitySignificance ||
      node.continuitySignificance,
  }));
};

const canonicalDependencyMap = (
  nodes: RoadmapNode[],
  graph: ReturnType<typeof FranchiseGraphEngine.buildRoadmap>,
) => {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const entries = [...graph.required, ...graph.optional];

  return Object.fromEntries(
    entries
      .filter((entry) => nodeIds.has(entry.id))
      .map((entry) => [
        entry.id,
        entry.requiredBefore.filter((dependencyId) => nodeIds.has(dependencyId)),
      ]),
  );
};

const uniqueById = (entries: CanonicalEntry[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
};

const buildFallbackGeminiShape = (
  target: CanonicalEntry,
  graph: ReturnType<typeof FranchiseGraphEngine.buildRoadmap>,
) => ({
  detectedTitle: target.title,
  franchise: target.universe,
  canonAccuracy: 96,
  continuityConfidence: 94,
  franchiseMatchScore: 96,
  emotionalArc: buildEmotionalArcFromEntries([...graph.required, target], target.universe),
  essentialViewing: [...graph.required, target].map((entry) => ({
    id: entry.id,
    title: entry.title,
    year: entry.releaseYear,
    importanceLevel: "Essential",
    continuityExplanation: entry.continuityRelevance,
    emotionalRelevance: entry.emotionalContext,
    required: true,
  })),
  recommendedViewing: graph.optional
    .filter((entry) => entry.importanceScore >= 75)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      year: entry.releaseYear,
      importanceLevel: "Recommended",
      continuityExplanation: entry.continuityRelevance,
      emotionalRelevance: entry.emotionalContext,
      required: false,
    })),
  optionalViewing: graph.optional
    .filter((entry) => entry.importanceScore < 75)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      year: entry.releaseYear,
      importanceLevel: "Optional",
      continuityExplanation: entry.continuityRelevance,
      emotionalRelevance: entry.emotionalContext,
      required: false,
    })),
  aiSummary: `${target.title} is mapped through verified ${target.universe} continuity, keeping hard prerequisites separate from enrichment viewing.`,
});

const buildEmotionalArcFromEntries = (entries: CanonicalEntry[], universe: string) =>
  EmotionalArcAnalyzer.buildArc({
    coreTitles: entries.map((entry) => entry.title),
    optionalTitles: [],
    characterFocus: entries.map((entry) => entry.emotionalContext),
    continuityThemes: entries.map((entry) => entry.continuityRelevance),
  }, universe).slice(0, 6);

const normalizeGeminiItems = (
  items: any,
  level: RoadmapViewingItem["importanceLevel"],
  nodeById: Map<string, RoadmapNode>,
): RoadmapViewingItem[] =>
  (Array.isArray(items) ? items : []).reduce<RoadmapViewingItem[]>((list, item) => {
      const node = nodeById.get(item?.id);
      if (!node) return list;
      list.push({
        id: node.id,
        title: node.title,
        year: item?.year || node.releaseYear,
        importanceLevel: level,
        continuityExplanation:
          item?.continuityExplanation || node.continuitySignificance || node.aiExplanation,
        emotionalRelevance: item?.emotionalRelevance || node.emotionalRelevance,
        required: level === "Essential",
        posterPath: node.posterPath,
        mediaType: node.mediaType,
        importanceScore: node.importanceScore,
      });
      return list;
    }, []);

const sectionItemsToNodes = (
  sections: RoadmapViewingItem[],
  nodeById: Map<string, RoadmapNode>,
): RoadmapNode[] =>
  sections
    .map((item) => {
      const node = nodeById.get(item.id);
      if (!node) return null;
      return {
        ...node,
        requirement: item.required ? "required" : "optional",
        aiExplanation: item.continuityExplanation,
        emotionalRelevance: item.emotionalRelevance,
        continuitySignificance: item.continuityExplanation,
      } satisfies RoadmapNode;
    })
    .filter((node): node is RoadmapNode => Boolean(node));

export const RoadmapEngine = {
  generate: async (title: string): Promise<RoadmapPayload> => {
    const detected = await SemanticTitleDetector.detect(title);
    const target = detected.entry;

    if (!target) {
      return standalonePayload(title);
    }

    const graph = FranchiseGraphEngine.buildRoadmap(target);
    const graphValidation = ContinuityValidator.validate(graph);
    const requiredWithTarget = uniqueById([...graph.required, target]).sort(
      (a, b) => a.chronologyIndex - b.chronologyIndex,
    );
    const allowedEntries = uniqueById([...requiredWithTarget, ...graph.optional]).filter(
      (entry) => entry.universe === target.universe,
    );
    const nodes = RoadmapValidator.sanitizeNodes(
      await TimelineBuilder.buildCanonical(requiredWithTarget, graph.optional),
    );
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const dependencyMap = canonicalDependencyMap(nodes, graph);

    const promptContext = {
      userQuery: detected.originalQuery,
      detectedTitle: target.title,
      detectedFranchise: target.universe,
      targetEntryId: target.id,
      requiredDependencyIds: target.requiredBefore,
      optionalDependencyIds: target.optionalBefore,
      dependencyMap,
      allowedEntries: allowedEntries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        year: entry.releaseYear,
        universe: entry.universe,
        mediaType: entry.mediaType,
        chronologyIndex: entry.chronologyIndex,
        releaseIndex: entry.releaseIndex,
        canonStatus: entry.canonStatus,
        continuityRelevance: entry.continuityRelevance,
        emotionalContext: entry.emotionalContext,
        importanceScore: entry.importanceScore,
      })),
      correction: detected.correctionReason,
    };

    let generatedRoadmap: any;
    try {
      generatedRoadmap = await GeminiService.generateCanonicalRoadmap(
        RoadmapPromptBuilder.build(promptContext),
      );
      let generatedValidation = ContinuityValidator.validateGeneratedRoadmap(
        generatedRoadmap,
        allowedEntries,
        target,
      );

      if (!generatedValidation.isValid) {
        generatedRoadmap = await GeminiService.generateCanonicalRoadmap(
          RoadmapPromptBuilder.build({
            ...promptContext,
            previousViolations: generatedValidation.warnings,
            regenerationInstruction:
              "Regenerate with fewer entries if needed, but include all required dependencies and the target.",
          }),
        );
      }
    } catch {
      generatedRoadmap = buildFallbackGeminiShape(target, graph);
    }

    const generatedValidation = ContinuityValidator.validateGeneratedRoadmap(
      generatedRoadmap,
      allowedEntries,
      target,
    );

    if (!generatedValidation.isValid) {
      generatedRoadmap = buildFallbackGeminiShape(target, graph);
    }

    const finalValidation = ContinuityValidator.validateGeneratedRoadmap(
      generatedRoadmap,
      allowedEntries,
      target,
    );

    const essentialViewing = normalizeGeminiItems(
      generatedRoadmap.essentialViewing,
      "Essential",
      nodeById,
    );
    const recommendedViewing = normalizeGeminiItems(
      generatedRoadmap.recommendedViewing,
      "Recommended",
      nodeById,
    );
    const optionalViewing = normalizeGeminiItems(
      generatedRoadmap.optionalViewing,
      "Optional",
      nodeById,
    );
    const trustedChronology = sectionItemsToNodes(
      [...essentialViewing, ...recommendedViewing, ...optionalViewing],
      nodeById,
    ).sort(
      (left, right) =>
        Number(left.chronologyIndex || 9999) - Number(right.chronologyIndex || 9999),
    );

    const emotionalArc = buildEmotionalArc(nodes, target.universe);
    const fallbackProgression = NarrativeProgressionEngine.build(
      trustedChronology,
      target.title,
    );
    const fallbackInsight = `${target.title} belongs to ${target.universe}. This roadmap is built from verified canon dependencies and keeps Gemini restricted to continuity explanations only.`;

    let aiExplanation: any = {};
    try {
      aiExplanation = await GeminiService.explainRoadmap({
        target,
        detected,
        validation: finalValidation,
        nodes: trustedChronology,
        emotionalArc: generatedRoadmap.emotionalArc || emotionalArc,
      });
    } catch {
      aiExplanation = {};
    }

    return {
      title: target.title,
      detectedTitle: generatedRoadmap.detectedTitle || target.title,
      franchise: generatedRoadmap.franchise || target.universe,
      normalizedQuery: detected.originalQuery,
      matchedTitle: detected.detectedTitle,
      detectedUniverse: target.universe,
      confidence: Math.min(99, Math.max(detected.confidence, finalValidation.franchiseAccuracy)),
      canonAccuracy: Math.max(graphValidation.canonAccuracy - finalValidation.warnings.length * 4, finalValidation.canonAccuracy),
      continuityConfidence: finalValidation.continuityConfidence,
      franchiseAccuracy: finalValidation.franchiseAccuracy,
      franchiseMatchScore: finalValidation.franchiseAccuracy,
      validationWarnings: [...graphValidation.warnings, ...finalValidation.warnings],
      correctionReason: detected.correctionReason,
      recommendedMode: "Essential Only",
      availableModes: modes,
      watchOrder: applyGeminiExplanations(trustedChronology, aiExplanation),
      essentialViewing,
      recommendedViewing,
      optionalViewing,
      emotionalArc: Array.isArray(aiExplanation.emotionalArc)
        ? aiExplanation.emotionalArc.slice(0, 6)
        : Array.isArray(generatedRoadmap.emotionalArc)
          ? generatedRoadmap.emotionalArc.slice(0, 6)
          : emotionalArc,
      continuityInsight: aiExplanation.continuityInsight || generatedRoadmap.aiSummary || fallbackInsight,
      aiSummary: generatedRoadmap.aiSummary || aiExplanation.continuityInsight || fallbackInsight,
      narrativeProgression:
        aiExplanation.narrativeProgression || fallbackProgression,
    };
  },
};
