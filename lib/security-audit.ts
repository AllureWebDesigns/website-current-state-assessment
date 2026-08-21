import type { Finding } from "@/lib/types";

const CHECKS = [
  ["content-security-policy", "Content Security Policy", 15],
  ["strict-transport-security", "HTTP Strict Transport Security", 15],
  ["x-content-type-options", "MIME type protection", 8],
  ["x-frame-options", "Clickjacking protection", 8],
  ["referrer-policy", "Referrer Policy", 5],
  ["permissions-policy", "Permissions Policy", 5]
] as const;

export async function runSecurityAudit(url: string) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "WebsiteCurrentStateAssessment/1.0" }
  });

  const findings: Finding[] = [];
  let penalty = 0;

  for (const [header, label, points] of CHECKS) {
    if (!response.headers.get(header)) {
      penalty += points;
      findings.push({
        id: `security-${header}`,
        category: "security",
        title: `${label} is missing`,
        summary: `The response did not include the ${header} header.`,
        recommendation: `Configure ${header} with a policy appropriate for the site's application and third-party dependencies.`,
        severity: points >= 15 ? "high" : "medium",
        scoreImpact: points
      });
    }
  }

  if (new URL(response.url).protocol !== "https:") {
    penalty += 30;
    findings.push({
      id: "security-https",
      category: "security",
      title: "HTTPS is not enforced",
      summary: "The final page response is not served over HTTPS.",
      recommendation: "Enable HTTPS and redirect all HTTP traffic to HTTPS.",
      severity: "critical",
      scoreImpact: 30
    });
  }

  return { score: Math.max(0, 100 - penalty), findings };
}
