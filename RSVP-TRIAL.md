Household RSVP trial

The live preview currently uses sample invitations only:

- Full name: Alex Example or Jamie Example (two guests)
- Full name: Taylor Example, Casey Example, Rowan Example or Ellis Example (four guests)

Buttons on the form also load these examples directly. Each guest has individual attendance, meal choices, wines and dietary/accessibility notes. A contact email and optional song are shared by the invitation. The review step supports editing before finishing.

Finishing the trial makes no network request and saves no RSVP data. Responses exist only in the current page until reloaded. There is no active RSVP email submission in this trial.

Guests find their household by full name; no invitation code is required. The website preview password is separate from RSVP lookup.

Before accepting real replies, replace the sample lookup with private server-side full-name lookup and durable response storage. Supply the invitation groups, named guests, plus-one allowances, day/evening invitations, and any children's menus. Do not place the real guest list in public JavaScript or the repository. Handle duplicate names without guessing a household. Add confirmation and amendment handling, then verify an end-to-end real response.

Local checks: npm install, then npm test. Regenerate encrypted index.html after editing _preview/index.html as described in PREVIEW.md.
