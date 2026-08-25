import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import type { Finding } from "@/lib/types";

export async function runBrowserAudit(url: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

    // Real production sites often keep analytics, chat, or streaming requests open,
    // so waiting for networkidle can time out even when the page is fully usable.
    // Give the page a short opportunity to finish loading, then continue the audit.
    await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(1_500);

    const [title, description, screenshot, uxSignals] = await Promise.all([
      page.title(),
      page.locator('meta[name="description"]').getAttribute("content"),
      page.screenshot({ fullPage: true, type: "jpeg", quality: 55 }),
      page.evaluate(() => ({
        h1Count: document.querySelectorAll("h1").length,
        navCount: document.querySelectorAll("nav").length,
        formCount: document.querySelectorAll("form").length,
        ctaCount: Array.from(document.querySelectorAll("a,button")).filter((el) =>
          /contact|book|schedule|get started|request|quote|buy|shop|learn more/i.test(el.textContent || "")
        ).length,
        viewportMeta: Boolean(document.querySelector('meta[name="viewport"]')),
        bodyTextLength: (document.body?.innerText || "").trim().length
      }))
    ]);

    let accessibilityFindings: Finding[] = [];
    let accessibilityScore: number | null = null;
    let accessibilityMessage: string | undefined;

    try {
      const axe = await new AxeBuilder({ page }).analyze();
      accessibilityFindings = axe.violations.slice(0, 15).map((violation) => ({
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

      accessibilityScore = Math.max(0, 100 - accessibilityFindings.reduce((total, finding) => {
        const penalty = finding.severity === "critical" ? 12 : finding.severity === "high" ? 8 : finding.severity === "medium" ? 4 : 2;
        return total + penalty;
      }, 0));
    } catch (error) {
      accessibilityMessage = error instanceof Error ? error.message : "Accessibility audit failed.";
    }

    const uxFindings: Finding[] = [];
    let uxPenalty = 0;

    if (uxSignals.h1Count !== 1) {
      uxPenalty += 12;
      uxFindings.push({ id: "ux-h1", category: "ux", title: "Unclear primary page hierarchy", summary: `The page has ${uxSignals.h1Count} H1 elements.`, recommendation: "Use one clear H1 that states the page's primary value proposition.", severity: "medium", scoreImpact: 12 });
    }
    if (uxSignals.ctaCount === 0) {
      uxPenalty += 18;
      uxFindings.push({ id: "ux-cta", category: "ux", title: "No obvious conversion action detected", summary: "The page does not expose a clear action using common conversion language.", recommendation: "Add a prominent, specific primary CTA aligned to the page goal.", severity: "high", scoreImpact: 18 });
    }
    if (uxSignals.navCount === 0) {
      uxPenalty += 10;
      uxFindings.push({ id: "ux-nav", category: "ux", title: "Primary navigation not detected", summary: "No semantic navigation element was found.", recommendation: "Provide a clear primary navigation structure and use semantic nav markup.", severity: "medium", scoreImpact: 10 });
    }
    if (!uxSignals.viewportMeta) {
      uxPenalty += 20;
      uxFindings.push({ id: "ux-viewport", category: "ux", title: "Mobile viewport configuration missing", summary: "The page is missing a viewport meta tag.", recommendation: "Add a responsive viewport declaration and verify mobile layouts.", severity: "high", scoreImpact: 20 });
    }
    if (uxSignals.bodyTextLength < 250) {
      uxPenalty += 8;
      uxFindings.push({ id: "ux-content-depth", category: "ux", title: "Very limited page content", summary: "The page contains little visible text, which may weaken clarity and conversion context.", recommendation: "Add concise supporting copy that explains the offer, credibility, and next step.", severity: "low", scoreImpact: 8 });
    }

    return {
      metadata: {
        title,
        description: description ?? undefined,
        screenshotDataUrl: `data:image/jpeg;base64,${screenshot.toString("base64")}`
      },
      accessibilityScore,
      accessibilityOk: accessibilityScore !== null,
      accessibilityMessage,
      uxScore: Math.max(0, 100 - uxPenalty),
      findings: [...accessibilityFindings, ...uxFindings]
    };
  } finally {
    await context.close();
    await browser.close();
  }
}
