# Public Homepage Design

Date: 2026-09-08. Extends the existing green workspace design in the same Figma file.

## Deliverables

- `11-public-home.svg` / `.png`: 1440 x 3720 desktop homepage, with four 820 px sections below the 80 px header and a compact 360 px footer.
- `12-public-home-mobile.svg` / `.png`: 390 x 3290 mobile homepage.
- Figma frames: `11 · Public Homepage` at X=4680, Y=0; `12 · Public Homepage Mobile` at X=6280, Y=0.
- Main green: #006233. White and neutral-gray section backgrounds, mint notices, amber coming-later status.

## Content And Behavior

The five screenshots supplied on 2026-09-08 are the content baseline. These are design boards, not production changes or working prototypes.

| Existing item | Revised placement and implementation behavior |
|---|---|
| Brand, Home, Services, Membership, Contact | Compact header; preserve existing destinations and anchors. |
| Language selector | Header globe and English dropdown; mobile globe opens the same language choices. Preserve the site's existing supported languages. |
| Workspace, Sign in, Create account | Desktop header; mobile menu must expose all three with the same authentication destinations. |
| Explore services, View membership | Hero actions, retaining their destinations. |
| Hellocarcar AI and sign-in prompt | Full-width query area immediately below the hero; prompt and arrow open the existing sign-in flow. |
| Vehicle price lookup, Shipping price lookup, Supplier recommendation report | Three active query entries; retain authentication and original destinations. |
| Chinese automotive supplier lookup | Remains Coming later, visually muted and non-actionable. |
| Five service areas | Aligned three-column list on desktop, stacked list on mobile. Same service scope. |
| Five trade stages | All five remain selectable; show current stage, previous, next, and 1 / 5 counter. Disable previous at stage one and next at stage five. |
| Stage detail content | First-stage content is shown from the supplied screenshot. Reuse existing live content for stages 2-5; do not infer new requirements from this design. Mobile stage buttons need accessible stage-name labels. |
| Trade responsibility notice | Retained beneath stage content. |
| Footer navigation and policies | Home, Services, Membership, Contact, Payment policy, Refund policy, Privacy policy, Terms of service, Disclaimer all retained. |
| Public-site limitation | Online payment and messaging-channel delivery remain unavailable. |

## Responsive Implementation

The desktop header condenses to brand, language control and menu when links no longer fit. The menu must contain Home, Services, Membership, Contact, Workspace, Sign in and Create account; opening it must not lose the current language or destination. Use a 1280 px maximum content width, 24 px minimum outer padding, and stacked service/query rows on mobile. Preserve RTL support and keyboard focus states.

Desktop uses an 80 px header plus four 820 px sections (hero, AI query, services, purchase steps). The footer is content-height, 360 px on this board, following the user's correction; do not apply viewport-height styling to it. The purchase section and preceding sections retain their prior layout. Mobile remains a continuous 3290 px page.

## Image Source

`homepage-port.jpg` is cropped from the user's supplied screenshot `codex-clipboard-7c279b11-ab40-4343-beb1-8269cacfec39.png`, retaining the existing vehicle-loading image. It is a design reference asset. For production use the original full-resolution asset already used by the site to avoid screenshot compression. No new supplier, price, customer or performance claims were added.

## Figma And Validation

The new boards use the established SVG import workflow: editable text and vector icons with embedded raster photos. They do not provide Auto Layout, shared component instances or wired interactions. Existing workspace boards are retained. Both generated PNGs were visually inspected; the Figma import was checked for image rendering, dimensions and text layers.
