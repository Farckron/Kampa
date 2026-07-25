# STAGE 06 — Exports + polish

Goal: the plan leaves the site as files the owner owns.

- [x] `exports.ts`: campaign → single markdown doc (structured, dated);
      Blob download; vitest on structure
- [x] .ics generator: user picks start date, one VEVENT per calendar item
      (summary, description with copy reference, duration from time
      estimate); vitest validates RFC 5545 basics; test import into Google
      Calendar manually
      → **left for you**: download `kampa-calendar.ics` from the Export tab
      and import it into Google Calendar once. RFC 5545 basics are covered by
      unit and e2e tests, but no test proves Google accepts the file.
- [x] Print stylesheet for Result view → clean PDF via window.print()
- [x] "Copy to clipboard" per asset in Copy tab
- [x] Draft persistence across reload; Start-over with confirm
- [x] Empty/error/loading states audit across wizard
- [x] Mobile pass on wizard (360px)
- [x] Accessibility pass: keyboard nav, focus states, labels, contrast

Done when: md/ics/PDF exports verified with a real generated campaign.
