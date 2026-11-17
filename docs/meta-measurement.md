# Local business facts and Meta eligibility

Verified against official documentation on 2026-11-14:

- [Server event parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event): event time is the actual fact time, action_source represents the real customer channel, website events require their real source URL. Events outside the current seven-day window remain local and must not receive a fabricated new timestamp.
- [Customer information](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters): normalize and SHA-256 hash contact identifiers; phone matching needs country code. Missing permission or matching context keeps an event ineligible.
- [Deduplication](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events): browser eventID and server event_id, plus their event names, must match for the same fact. Browser eventID is the fourth fbq argument.

Proposed mapping: an actual customer request is Lead; an accepted customer offer confirmed as an order by CEJ is Purchase (commercial fact, independent of collection/delivery). Confirm this business mapping and the actual per-company dataset, API version, allowed sources and account permissions in the destination before enabling anything outside the local rehearsal. No claim of destination acceptance or campaign attribution is made here.

The panel loads no advertising Pixel. Calculation, quote persistence, copying, exporting, manual share preparation, import and payments create no Lead/Purchase. Requests and first order confirmation transactionally create stable outbox intentions. Unknown origins remain null; employee cookies, IP, UA and identity are not matching inputs. Imported orders have no automatic conversion eligibility.

The initial outbox status is pending_eligibility. There is deliberately no production dispatcher or browser context fallback. The test dispatcher requires an enabled, verified, test-only per-company destination, explicit test code and supplied transport. Synthetic integration tests exercise that transport without contacting Meta. It leases rows with SKIP LOCKED, records attempts, uses bounded backoff and guards stale receipts. HTTP success alone is insufficient: events_received must confirm one accepted event. Acceptance is distinct from attribution.

Real event eligibility still needs explicit customer permission and legitimate matching/channel evidence. The current UI does not collect marketing consent or browser identity for internally captured customers: those events remain pending rather than inventing data. This restriction does not block the sale. No external test event has been sent from this work.
