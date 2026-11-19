"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Filter each event rather than the mounted route: SDKs survive client navigation.
function publicEvent<T extends { url: string }>(event: T): T | null {
  try {
    const path = decodeURIComponent(
      new URL(event.url, "https://cej.invalid").pathname,
    );
    return path === "/panel" || path.startsWith("/panel/") ? null : event;
  } catch {
    return null;
  }
}

export default function Telemetry() {
  return (
    <>
      <SpeedInsights beforeSend={publicEvent} />
      <Analytics beforeSend={publicEvent} />
    </>
  );
}
