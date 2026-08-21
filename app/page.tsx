"use client";

import { FormEvent, useState } from "react";
import type { AssessmentResult, Severity } from "@/lib/types";

const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info"
};

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Assessment failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assessment failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Website Current State Assessment</p>
        <h1>Turn a website URL into a prioritized client assessment.</h1>
        <p className="lede">Performance, SEO, accessibility, security posture, and conversion-oriented UX signals in one report.</p>

        <form onSubmit={submit} className="auditForm">
          <input
            aria-label="Website URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://clientwebsite.com"
            required
          />
          <button disabled={loading}>{loading ? "Running assessment…" : "Assess website"}</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="results">
          <div className="summaryCard">
            <div>
              <p className="muted">Overall website health</p>
              <div className="overallScore">{result.overallScore}<span>/100</span></div>
            </div>
            <div>
              <strong>{result.metadata.title || new URL(result.url).hostname}</strong>
              <p className="muted">{result.url}</p>
            </div>
          </div>

          <div className="scoreGrid">
            {result.categoryScores.map((item) => (
              <article className="scoreCard" key={item.category}>
                <p>{item.category.replace("-", " ")}</p>
                <strong>{item.score === null ? "N/A" : `${item.score}/100`}</strong>
              </article>
            ))}
          </div>

          {result.metadata.screenshotDataUrl && (
            <article className="panel screenshotPanel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Visual evidence</p>
                  <h2>Current homepage</h2>
                </div>
              </div>
              <img src={result.metadata.screenshotDataUrl} alt={`Screenshot of ${result.url}`} />
            </article>
          )}

          <article className="panel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Prioritized findings</p>
                <h2>What should be fixed first</h2>
              </div>
              <span className="count">{result.findings.length} findings</span>
            </div>

            <div className="findingList">
              {result.findings.length === 0 && <p className="muted">No material automated findings were returned.</p>}
              {result.findings.map((finding) => (
                <section className="finding" key={finding.id}>
                  <div className="findingMeta">
                    <span className={`severity severity-${finding.severity}`}>{severityLabel[finding.severity]}</span>
                    <span>{finding.category}</span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.summary}</p>
                  <div className="recommendation"><strong>Recommended action:</strong> {finding.recommendation}</div>
                </section>
              ))}
            </div>
          </article>

          <article className="panel compact">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Coverage</p>
                <h2>Assessment tools</h2>
              </div>
            </div>
            <div className="toolGrid">
              {Object.entries(result.toolStatus).map(([name, status]) => (
                <div className="tool" key={name}>
                  <strong>{name}</strong>
                  <span>{status.enabled ? (status.ok ? "Complete" : "Unavailable") : "Optional"}</span>
                  {status.message && <small>{status.message}</small>}
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
