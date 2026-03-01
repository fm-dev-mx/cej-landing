import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAttributionData } from "./attribution";

// Mock next/headers
vi.mock("next/headers", () => ({
    cookies: vi.fn(),
}));

import { cookies } from "next/headers";

describe("getAttributionData", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const setupCookiesMock = (cookiesMap: Record<string, string | undefined> = {}) => {
        const mockCookies = {
            get: vi.fn().mockImplementation((name: string) => {
                const value = cookiesMap[name];
                return value ? { value } : undefined;
            }),
        };
        vi.mocked(cookies).mockResolvedValue(mockCookies as unknown as Awaited<ReturnType<typeof cookies>>);
        return mockCookies;
    };

    it("should return defaults when no cookies or payload are present", async () => {
        setupCookiesMock();


        const result = await getAttributionData();
        expect(result).toEqual({
            utm_source: "direct",
            utm_medium: "none",
            utm_campaign: undefined,
            utm_term: undefined,
            utm_content: undefined,
            fbclid: undefined,
            gclid: undefined,
        });
    });

    it("should extract data from cej_utm cookie", async () => {
        const utmData = {
            source: "facebook",
            medium: "cpc",
            campaign: "black_friday",
        };
        setupCookiesMock({ cej_utm: JSON.stringify(utmData) });


        const result = await getAttributionData();
        expect(result.utm_source).toBe("facebook");
        expect(result.utm_medium).toBe("cpc");
        expect(result.utm_campaign).toBe("black_friday");
    });

    it("should prioritize payload over cookies", async () => {
        const utmData = { source: "google", medium: "organic" };
        setupCookiesMock({ cej_utm: JSON.stringify(utmData) });


        const result = await getAttributionData({ utm_source: "email" });
        expect(result.utm_source).toBe("email");
        expect(result.utm_medium).toBe("organic");
    });

    it("should normalize strings to lowercase and trim", async () => {
        setupCookiesMock();


        const result = await getAttributionData({ utm_source: "  FACEBOOK  " });
        expect(result.utm_source).toBe("facebook");
    });

    it("should extract fbclid from _fbc cookie", async () => {
        setupCookiesMock({ _fbc: "fb.1.123456789.ABC123XYZ" });

        const result = await getAttributionData();
        expect(result.fbclid).toBe("abc123xyz");
    });
});
