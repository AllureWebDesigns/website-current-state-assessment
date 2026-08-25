import type { Browser } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export async function launchChromium(): Promise<Browser> {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { chromium: playwrightChromium } = await import("playwright-core");
    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath()
    });
  }

  const { chromium: playwrightChromium } = await import("playwright");
  return playwrightChromium.launch({ headless: true });
}

export async function getChromeLaunchOptions(): Promise<{ chromePath: string; chromeFlags: string[] }> {
  const baseFlags = ["--headless", "--no-sandbox", "--disable-dev-shm-usage"];

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return {
      chromePath: await chromium.executablePath(),
      chromeFlags: Array.from(new Set([...baseFlags, ...chromium.args]))
    };
  }

  const { chromium: playwrightChromium } = await import("playwright");
  return { chromePath: playwrightChromium.executablePath(), chromeFlags: baseFlags };
}
