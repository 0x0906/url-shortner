export function parseUserAgent(ua: string | null | undefined) {
  if (!ua) {
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  }

  let browser = "Unknown";
  if (ua.includes("Edg/") || ua.includes("Edge/")) {
    browser = "Edge";
  } else if (ua.includes("OPR/") || ua.includes("Opera/")) {
    browser = "Opera";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("Chrome/")) {
    browser = "Chrome";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    browser = "Safari";
  }

  let os = "Unknown";
  if (ua.includes("Windows")) {
    os = "Windows";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS")) {
    os = "macOS";
  } else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) {
    os = "iOS";
  } else if (ua.includes("Android")) {
    os = "Android";
  } else if (ua.includes("Linux")) {
    os = "Linux";
  }

  let device = "Desktop";
  if (ua.includes("Mobile") || ua.includes("iPhone") || (ua.includes("Android") && !ua.includes("Tablet"))) {
    device = "Mobile";
  } else if (ua.includes("Tablet") || ua.includes("iPad")) {
    device = "Tablet";
  }

  return { browser, os, device };
}

export function getDeviceName(ua: string | null | undefined): string {
  if (!ua) return "Unknown OS (Unknown Browser)";

  let os: string;
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";
  else os = "Unknown OS";

  let browser: string;
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome") || ua.includes("Chromium")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else browser = "Unknown Browser";

  return `${os} (${browser})`;
}
