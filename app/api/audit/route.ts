import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertSafePublicUrl } from "@/lib/url-safety";
import { runLighthouse } from "@/lib/lighthouse";
import { runBrowserAudit } from "@/lib/browser-audit";
import { runSecurityAudit } from "@/lib/security-audit";
import { buildAssessment } from "@/lib/scoring";
import type { CategoryScore, Finding } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({ url: z.string().min(3).max(2048) });
type ToolStatus = Record<string, { enabled: boolean; ok: boolean; message?: string }>;

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const safeUrl = await assertSafePublicUrl(body.url);
    const target = safeUrl.toString();

    const [lighthouseResult, browserResult, securityResult] = await Promise.allSettled([
      runLighthouse(target),
      runBrowserAudit(target),
      runSecurityAudit(target)
    ]);

    const findings: Finding[] = [];
    const scores: CategoryScore[] = [
      { category: "performance", score: null },
      { category: "seo", score: null },
      { category: "accessibility", score: null },
      { category: "security", score: null },
      { category: "best-practices", score: null },
      { category: "ux", score: null }
    ];

    const browserCompleted = browserResult.status === "fulfilled";
    const accessibilityCompleted = browserCompleted && browserResult.value.accessibilityOk;

    const toolStatus: ToolStatus = {
      lighthouse: { enabled: true, ok: lighthouseResult.status === "fulfilled" },
      accessibility: { enabled: true, ok: accessibilityCompleted },
      browser: { enabled: true, ok: browserCompleted },
      securityHeaders: { enabled: true, ok: securityResult.status === "fulfilled" },
      nuclei: { enabled: false, ok: false, message: "Active vulnerability scanning is disabled by default." },
      sitespeed: { enabled: false, ok: false, message: "Optional deep performance adapter not enabled in the MVP." }
    };

    if (lighthouseResult.status === "fulfilled") {
      findings.push(...lighthouseResult.value.findings);
      scores.find((s) => s.category === "performance")!.score = lighthouseResult.value.scores.performance;
      scores.find((s) => s.category === "seo")!.score = lighthouseResult.value.scores.seo;
      scores.find((s) => s.category === "best-practices")!.score = lighthouseResult.value.scores["best-practices"];
    } else {
      toolStatus.lighthouse.message = lighthouseResult.reason instanceof Error ? lighthouseResult.reason.message : "Lighthouse failed.";
    }

    let metadata = {};
    if (browserResult.status === "fulfilled") {
      findings.push(...browserResult.value.findings);
      metadata = browserResult.value.metadata;
      scores.find((s) => s.category === "accessibility")!.score = browserResult.value.accessibilityScore;
      scores.find((s) => s.category === "ux")!.score = browserResult.value.uxScore;
      if (browserResult.value.accessibilityMessage) {
        toolStatus.accessibility.message = browserResult.value.accessibilityMessage;
      }
    } else {
      const message = browserResult.reason instanceof Error ? browserResult.reason.message : "Browser audit failed.";
      toolStatus.accessibility.message = message;
      toolStatus.browser.message = message;
    }

    if (securityResult.status === "fulfilled") {
      findings.push(...securityResult.value.findings);
      scores.find((s) => s.category === "security")!.score = securityResult.value.score;
    } else {
      toolStatus.securityHeaders.message = securityResult.reason instanceof Error ? securityResult.reason.message : "Security audit failed.";
    }

    const result = buildAssessment({
      url: target,
      scannedAt: new Date().toISOString(),
      categoryScores: scores,
      findings,
      metadata,
      toolStatus
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assessment failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
