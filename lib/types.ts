export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Finding = {
  id: string;
  category: "performance" | "seo" | "accessibility" | "security" | "best-practices" | "ux";
  title: string;
  summary: string;
  recommendation: string;
  severity: Severity;
  scoreImpact?: number;
  evidence?: Record<string, unknown>;
};

export type CategoryScore = {
  category: Finding["category"];
  score: number | null;
};

export type AssessmentResult = {
  url: string;
  scannedAt: string;
  overallScore: number;
  categoryScores: CategoryScore[];
  findings: Finding[];
  metadata: {
    title?: string;
    description?: string;
    screenshotDataUrl?: string;
    technologies?: string[];
  };
  toolStatus: Record<string, { enabled: boolean; ok: boolean; message?: string }>;
};
