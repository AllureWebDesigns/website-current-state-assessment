import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";
import type { Finding } from "@/lib/types";

const CATEGORY_MAP = {
  performance: "performance",
  seo: "seo",
  accessibility: "accessibility",
  "best-practices": "best-practices"
} as const;

export async function runLighthouse(url: string) {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"]
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
    const scores = Object.fromEntries(
      Object.keys(CATEGORY_MAP).map((key) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)])
    );

    const findings: Finding[] = Object.values(lhr.audits)
      .filter((audit) => audit.scoreDisplayMode !== "notApplicable" && typeof audit.score === "number" && audit.score < 0.9)
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 12)
      .map((audit) => ({
        id: `lh-${audit.id}`,
        category: audit.group === "seo-content" || audit.group === "seo-crawl" ? "seo" : "performance",
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
