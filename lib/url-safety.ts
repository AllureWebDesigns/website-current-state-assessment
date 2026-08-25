import dns from "node:dns/promises";
import net from "node:net";

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  return true;
}

export async function assertSafePublicUrl(raw: string) {
  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs with embedded credentials are not allowed.");
  }

  const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateIp(record.address))) {
    throw new Error("The target must resolve only to public IP addresses.");
  }

  return url;
}
