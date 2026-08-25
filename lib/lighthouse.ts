import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { getChromeLaunchOptions } from "@/lib/browser-runtime";
import type { Finding } from "@/lib/types";

const CATEGORY_MAP = {
  performance: "performance",
  seo: "seo",
  accessibility: "accessibility",
  "best-practices": "best-practices"
} as const;

type LighthouseCategory = keyof typeof CATEGORY_MAP;

export async function runLighthouse(url: string) {
  const { chromePath, chromeFlags } = await getChromeLaunchOptions();
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags
  });

  try {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: Object.keys(CATEGORY_MAP)
    });

    if (!result?.lhr) throw new Error("Lighthouse did not return a report.");

    const lhr = result.lhr;
    const categoryKeys = Object.keys(CATEGORY_MAP) as LighthouseCategory[];
    const scores = Object.fromEntries(
      categoryKeys.map((key) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)])
    );

    const categoryByAuditId = new Map<string, Finding["category"]>();

    for (const lighthouseCategory of categoryKeys) {
      const category = lhr.categories[lighthouseCategory];
      const findingCategory = CATEGORY_MAP[lighthouseCategory];

      for (const auditRef of category?.auditRefs ?? []) {
        if (!categoryByAuditId.has(auditRef.id)) {
          categoryByAuditId.set(auditRef.id, findingCategory);
        }
      }
    }

    const findings: Finding[] = Object.values(lhr.audits)
      .filter((audit) => audit.scoreDisplayMode !== "notApplicable" && typeof audit.score === "number" && audit.score < 0.9)
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 12)
      .map((audit) => ({
        id: `lh-${audit.id}`,
        category: categoryByAuditId.get(audit.id) ?? "performance",
        title: audit.title,
        summary: audit.description?.replace(/\[[^\]]+\]\([^\)]+\)/g, "").trim() || "Automated audit identified an issue.",
        recommendation: audit.displayValue
          ? `Address this audit finding. Current result: ${audit.displayValue}.`
          : "Address this audit finding and re-run the assessment.",
        severity: (audit.score ?? 1) < 0.5 ? "high" : "medium",
        scoreImpact: Math.round((1 - (audit.score ?? 1)) * 20),
        evidence: { displayValue: audit.displayValue, numericValue: audit.numericValue }
      }));

    return { scores, findings };
  } finally {
    await chrome.kill();
  }
}