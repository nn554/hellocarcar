# HelloCarCar Green Workspace

2026-09-08 addition: the public homepage now has desktop and mobile boards using the same #006233 palette. See [homepage-handoff.md](homepage-handoff.md) for content mapping, original feature states and responsive implementation notes.

Design date: 2026-09-07. Design-only deliverable based on the seven user-supplied production screenshots. The older local customer implementation is not the feature baseline. No production code, account settings, payment behavior, or live records are changed.

## Direction

Algerian flag-inspired green navigation and primary actions (#006233), white work surfaces, neutral gray text, mint selection, amber for uncertainty. Updated at the user's request to replace the darker forest green. Sidebar active state is #177447; secondary text is #C8E6D3 and navigation text is #E3F1E8. The chosen main hex is a common web representation, not a certified physical flag color specification. A compact 232 px sidebar keeps services, history, and account access visible without horizontal scrolling. Main titles are 28 px; body is 14 px; navigation and labels are 13 px. Controls and repeated items use 6-8 px corners. The main content remains open and unframed.

## Reference research

- https://www.flexport.com/products/flexport-platform/ : inspected the product dashboard image and product sections. Borrow compact navigation, aligned content, and operational hierarchy. Do not add shipment tracking, analytics, or maps to HelloCarCar.
- https://www.freightos.com/ : inspected its public marketplace content and the rate-comparison entry. Borrow query-first workflow and a visually prominent primary search action. Do not add booking or live-capacity claims.
- https://ship.freightos.com/ : inspected the actual public search surface: Origin, Destination, Load, Goods aligned in a horizontal query bar, followed by quieter supporting content. Applied the hierarchy to the existing four HelloCarCar shipping fields, without changing those fields.
- https://www.carwow.co.uk/ : inspected the public vehicle-finding surface with prominent model search, category access and strong neutral/accent contrast. Borrow search prominence and price emphasis; the promotional hero, bright cyan campaign palette and purchase/sale features are not part of this design.
- https://www.perplexity.ai/ : public page was attempted but initially blank; do not count as a verified visual reference.

## Feature preservation

| Original | Proposed location / treatment |
|---|---|
| New chat, restored conversation, saved messages | AI workspace with compact header, readable message column and composer |
| Four recommended query categories and prompts | Two-column quick query list under the composer |
| Economic dispute handling | Service section in navigation; retains original destination |
| China purchasing agent / single vehicle accepted | Service section in navigation with secondary note |
| Policy consultation | Service section in navigation; retains original destination |
| Vehicle search, weekly best sellers, quotations | Search at the top, compact best-seller empty state, dense quotation table |
| Vehicle columns | Vehicle, specification, FOB quotation, delivery location, observed date, validity all retained |
| Shipping fields | Loading port, destination port, original flexible date text, container type all retained |
| Shipping initial state | Results remain hidden before search; no invented shipping records |
| Reports | Type, language, company, request information, submission, report list, refresh, progress and private delivery |
| Subscription | Free, USD 99.90 monthly, USD 899.90 annual, current plan, expiry, allowances, unavailable activation |
| Account | Profile, settings, subscription, favorites and promotions coming soon, switch account, sign out, active sessions, revoke other sessions |
| History | Short recent titles plus access to all history; no horizontal scrolling |
| Notifications | Navigation retained. Screenshot does not show contents; only empty-state design supplied |

## Data boundary

Three vehicle rows and prices are transcribed from the supplied screenshot. The screenshot's 311 vehicle records and 67 shipping records are snapshot counts, not a claim of current availability. No extra quotation records or report deliveries are fabricated. The account's real email is replaced with a neutral profile label in design exports. Policy and trade disclaimers remain visible but concise. Payment activation remains unavailable. The design uses English display labels to match the existing customer navigation; bilingual report fields and RTL implementation notes are retained in the handoff.

## Responsive rules

Desktop: 232 px fixed sidebar, 64 px top bar, 40 px content inset. Chat reading width 760 px. Tables retain columns inside a dedicated horizontal scroller on narrow displays. Mobile: replace sidebar with a menu drawer, 20 px content inset, full-width composer, stacked forms. Preserve all navigation in the drawer. RTL mirrors navigation, alignment and form flow; identifiers, prices and VINs remain LTR.

## Figma handoff

Each SVG is a full design screen with vector icons and native SVG text. Import through the Figma editor to create editable vector layers. SVG imports do not provide Auto Layout, shared Figma component instances, or native prototype links; these require the Figma write integration or a later Figma-native pass. The accompanying HTML is a local page-by-page design viewer, not a replacement for the production application.

Imported into the user-provided Figma file via the browser editor: https://www.figma.com/design/f1YQZjK88gEBovlA0UmYqu/ . File title: Hellocarcar - Green Workspace UI. Ten named frames arranged on one canvas. Text layers and vector groups were verified in the Figma layer panel. The direct Figma MCP write tool is unavailable in this session; browser login and successful editor import are independently verified.
