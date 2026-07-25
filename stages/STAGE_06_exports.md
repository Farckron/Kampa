# STAGE 06 — Exports + polish

Goal: the plan leaves the site as files the owner owns.

- [ ] `exports.ts`: campaign → single markdown doc (structured, dated);
      Blob download; vitest on structure
- [ ] .ics generator: user picks start date, one VEVENT per calendar item
      (summary, description with copy reference, duration from time
      estimate); vitest validates RFC 5545 basics; test import into Google
      Calendar manually
- [ ] Print stylesheet for Result view → clean PDF via window.print()
- [ ] "Copy to clipboard" per asset in Copy tab
- [ ] Draft persistence across reload; Start-over with confirm
- [ ] Empty/error/loading states audit across wizard
- [ ] Mobile pass on wizard (360px)
- [ ] Accessibility pass: keyboard nav, focus states, labels, contrast

Done when: md/ics/PDF exports verified with a real generated campaign.
