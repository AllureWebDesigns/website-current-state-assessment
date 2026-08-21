# Website Current State Assessment

A client-facing website assessment platform for performance, SEO, accessibility, security posture, and UX review.

The application combines automated evidence collection with a normalized scoring and recommendation layer so technical findings can be translated into prioritized business actions.

## Current MVP

The assessment currently includes:

- Lighthouse performance, SEO, accessibility, and best-practices scoring
- axe-core accessibility findings
- Playwright browser inspection and homepage screenshot capture
- Conversion-oriented UX heuristics such as H1 structure, navigation, CTA presence, responsive viewport configuration, and basic content depth
- Passive security posture checks for HTTPS and common response security headers
- Weighted overall website health score
- Severity-based prioritization of findings
- Graceful partial results when one audit component fails
- Public-target validation to reject obvious private and loopback destinations

Active vulnerability scanning is intentionally disabled by default. Nuclei can be added later as an explicitly authorized assessment mode. A deeper sitespeed.io adapter is also reserved for the next phase.

## Local setup

Requirements:

- Node.js 20+
- npm

Install dependencies and Chromium:

```bash
npm install
npx playwright install --with-deps chromium
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`, enter a public website URL, and run the assessment.

## Container

A Dockerfile is included so Chromium and its system dependencies are installed consistently.

```bash
docker build -t website-assessment .
docker run --rm -p 3000:3000 website-assessment
```

## Production hardening before public exposure

This MVP should not be exposed as an unrestricted public scanner without additional controls. Before production use, add authentication, rate limiting, job queuing, persistent assessment storage, network-level egress restrictions against private address space, observability, and an authorization workflow for any active security scanning.

For prospecting or client work, only assess domains you are authorized to test.

## Planned next phase

- Multi-page crawl and page sampling
- Structured technology detection
- Deeper Core Web Vitals and waterfall analysis
- Authorized Nuclei integration
- AI-assisted screenshot and conversion review
- Finding-to-service mapping and effort estimates
- Branded PDF/client report export
- Historical comparisons and before/after scoring
- Assessment persistence and client dashboard
