import type { AssessmentResult, CategoryScore, Finding } from "@/lib/types";

const WEIGHTS: Record<string, number> = {
  performance: 0.25,
  seo: 0.2,
  accessibility: 0.2,
  security: 0.15,
  "best-practices": 0.1,
  ux: 0.1
};

export function calculateOverallScore(scores: CategoryScore[]) {
  const usable = scores.filter((item) => item.score !== null);
  const weightSum = usable.reduce((sum, item) => sum + (WEIGHTS[item.category] ?? 0), 0);
  if (!weightSum) return 0;

  return Math.round(
    usable.reduce((sum, item) => sum + (item.score ?? 0) * (WEIGHTS[item.category] ?? 0), 0) / weightSum
  );
}

export function prioritizeFindings(findings: Finding[]) {
  const severityRank = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return [...findings].sort((a, b) => {
    const severityDelta = severityRank[b.severity] - severityRank[a.severity];
    return severityDelta || (b.scoreImpact ?? 0) - (a.scoreImpact ?? 0);
  });
}

export function buildAssessment(result: Omit<AssessmentResult, "overallScore" | "findings"> & { findings: Finding[] }): AssessmentResult {
  return {
    ...result,
    overallScore: calculateOverallScore(result.categoryScores),
    findings: prioritizeFindings(result.findings)
  };
}
