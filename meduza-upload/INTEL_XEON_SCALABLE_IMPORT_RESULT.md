# Intel Xeon Scalable Import Result

Date: 2026-07-13T13:34:42.324Z

## Sources

- Intel ARK/Product Specifications attempted: reachable
- Intel ARK note: Intel product specifications page was reachable, but no stable public structured ARK export was available to this script.
- Fallback used: curated TypeScript draft data in `apps/backend/src/scripts/intel-xeon`.
- All fallback rows are marked `needs_review: true` and `source_confidence: fallback`.

## Counts

- 1st Gen source rows: 20
- 2nd Gen source rows: 22
- Last run created: 0
- Last run updated: 42
- Last run unchanged: 0
- Skipped: 0
- Needs review: 42
- Total imported/managed CPU rows: 42

## Packs

- Intel Xeon Scalable 1st Gen: 20 items (0 added this run)
- Intel Xeon Scalable 2nd Gen: 22 items (0 added this run)
- Intel Xeon Scalable 1st/2nd Gen for HPE Gen10: 42 items (0 added this run)

## Fields Filled

- `type`, `brand`, `public_name`, `short_name`, `model`, `part_number`, `enabled`, `price`, `cost`, `stock_qty`.
- `specs_json`: generation, platform, code name, socket, cores, threads, frequencies, cache, TDP, memory, ECC, UPI/PCIe, scalability, launch date, source metadata, suffix flags.

## HPE Gen10 Applicability

- `Intel Xeon Scalable 1st/2nd Gen for HPE Gen10` applies CPU applicability through component `specs_json.applicability`.
- Runtime `/options` still reads components and applicability only; packs are admin tooling.

## Risks

- This run uses fallback draft data, not a full parsed Intel ARK export.
- Manual verification is required for exact SKU support, high-TDP cooling, BIOS support, and special suffix SKUs.
