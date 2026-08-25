import type { Browser } from "playwright-core";

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// chromium.executablePath() extracts a ~280MB binary into /tmp. Lighthouse and the
// browser audit launch chromium concurrently, so this is memoized to avoid two
// invocations racing to inflate the same file at once.
let executablePathPromise: Promise<string> | undefined;

async function resolveExecutablePath(): Promise<string> {
  if (!executablePathPromise) {
    executablePathPromise = (async () => {
      const chromium = (await import("@sparticuz/chromium")).default;
      return chromium.executablePath();
    })();
  }
  return executablePathPromise;
}

export async function launchChromium(): Promise<Browser> {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { chromium: playwrightChromium } = await import("playwright-core");
    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await resolveExecutablePath()
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
      chromePath: await resolveExecutablePath(),
      chromeFlags: Array.from(new Set([...baseFlags, ...chromium.args]))
    };
  }

  const { chromium: playwrightChromium } = await import("playwright");
  return { chromePath: playwrightChromium.executablePath(), chromeFlags: baseFlags };
}
