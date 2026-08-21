import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import type { Finding } from "@/lib/types";

export async function runBrowserAudit(url: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });

    const [title, description, screenshot] = await Promise.all([
      page.title(),
      page.locator('meta[name="description"]').getAttribute("content"),
      page.screenshot({ fullPage: true, type: "jpeg", quality: 55 })
    ]);

    const axe = await new AxeBuilder({ page }).analyze();
    const findings: Finding[] = axe.violations.slice(0, 15).map((violation) => ({
      id: `axe-${violation.id}`,
      category: "accessibility",
      title: violation.help,
      summary: violation.description,
      recommendation: violation.helpUrl
        ? `Resolve the affected elements and verify against the rule guidance: ${violation.helpUrl}`
        : "Resolve the affected elements and re-run accessibility testing.",
      severity: violation.impact === "critical" ? "critical" : violation.impact === "serious" ? "high" : violation.impact === "moderate" ? "medium" : "low",
      evidence: { affectedNodes: violation.nodes.length, tags: violation.tags }
    }));

    const accessibilityScore = Math.max(0, 100 - findings.reduce((total, finding) => {
      const penalty = finding.severity === "critical" ? 12 : finding.severity === "high" ? 8 : finding.severity === "medium" ? 4 : 2;
      return total + penalty;
    }, 0));

    return {
      metadata: {
        title,
        description: description ?? undefined,
        screenshotDataUrl: `data:image/jpeg;base64,${screenshot.toString("base64")}`
      },
      accessibilityScore,
      findings
    };
  } finally {
    await browser.close();
  }
}
