import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Telemetry from "./Telemetry";

type Event = { type: "pageview" | "event" | "vital"; url: string };
type Props = { beforeSend: (event: Event) => Event | null };
const sinks = vi.hoisted(() => ({ analytics: vi.fn(), speed: vi.fn() }));
vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: Props) => {
    sinks.analytics(props);
    return null;
  },
}));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: (props: Props) => {
    sinks.speed(props);
    return null;
  },
}));

describe("telemetry privacy boundary", () => {
  it("drops panel pageviews, custom events and vitals before sending, including after public navigation", () => {
    render(<Telemetry />);
    for (const sink of [sinks.analytics, sinks.speed]) {
      const { beforeSend } = sink.mock.lastCall![0] as Props;
      for (const type of ["pageview", "event", "vital"] as const) {
        const publicPage = {
          type,
          url: "https://cej.invalid/cotizador?utm_source=test",
        };
        expect(beforeSend(publicPage)).toBe(publicPage);
        for (const path of [
          "/panel",
          "/panel/",
          "/panel/pedidos?q=4567",
          "/panel/clientes?q=Cliente%20Sintetico",
          "/panel/cotizar?customer=synthetic&lead=123",
          "/%70anel/clientes?q=6560000000",
        ]) {
          expect(
            beforeSend({ type, url: `https://cej.invalid${path}` }),
          ).toBeNull();
          expect(beforeSend({ type, url: path })).toBeNull();
        }
        expect(beforeSend(publicPage)).toBe(publicPage);
      }
      expect(
        beforeSend({ type: "pageview", url: "http://[invalid" }),
      ).toBeNull();
      const other = {
        type: "pageview" as const,
        url: "https://cej.invalid/panel-publico",
      };
      expect(beforeSend(other)).toBe(other);
    }
  });
});
