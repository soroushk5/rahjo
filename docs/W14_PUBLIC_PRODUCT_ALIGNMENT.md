# RAH-W14 — Public Product Alignment

Status: In progress
Baseline: server-backed W13 + compact W14 public alignment

## Objective
Align Rahjo's public website, landing experience, entry points and product narrative with the live server-backed operational product without reopening W7/W11/W12 or changing the W13 backend contract.

## Product contract
Rahjo is a CRM and operational workspace for teams that need to keep customer relationship, sales follow-up and work execution connected. The public category is intentionally broader than one industry: B2B sales, trading, service/project work, consulting/education and growing teams can use the same product core.

The full operational domain remains:

`Intake → Account → Opportunity/Case → Service → Approval → Action → Receipt → Outcome`

The public site is allowed to compress that model for comprehension; the compact public schematic is:

`Lead / Intake → Customer → Opportunity → Case → Outcome`

That compression is presentation-only and does not change the first-class backend entities or acceptance gates.

## Canonical public information architecture
The canonical public surface is intentionally small:

- Home
- Product
- Login / Workspace as the single header action

The Rahjo logo is the Home affordance. The header has no public tabs.

`/contact`, `/pilot` and older marketing URLs are compatibility-only. Until W14-005 delivers a real public acquisition/intake flow, they must not be presented as a working Start flow; `/contact` and `/pilot` resolve to Login instead of a dead-end marketing page.

## Public experience principles
1. Make the category clear early: Rahjo is CRM for customer, sales and work execution. Then explain concrete jobs and outcomes in plain language.
2. Do not narrow the product to one industry. Industry/use-case fit appears as secondary examples, not as the product definition.
3. Use the same nouns publicly and inside the console where helpful: Customer, Opportunity, Case, next action and Outcome.
4. Product proof must be compact and believable. Prefer one small product preview plus micro-UI fragments over a gallery of large screenshots.
5. Home should have a short narrative: **clear promise → compact product signal → schematic journey → three product pillars → final CTA**.
6. Every CTA must describe the destination that actually exists. Public canonical CTAs may go to Product, Login/Workspace or Home. Do not label a dead-end page as Start.
7. Workspace availability is an authentication fact, not a backend-readiness fact. A healthy server must never make a signed-out visitor look signed in.
8. Public intake must eventually create server records through the existing Rahjo BFF. No silent browser-local fallback in server mode.
9. Do not claim live Relaticle, MCP, payment, messaging or production-ready disaster recovery until their W13 gates pass.

## Compact visual contract
The public experience and operational console are one product and should look related, but the public site must be simpler than the console.

- **First viewport:** one concise promise, one supporting sentence, at most two entry actions, broad-fit chips and one compact product preview. No billboard-scale headline and no ornamental dashboard collage.
- **Product preview:** show only enough UI to establish that the product is real. The hero preview should remain materially smaller than the content column and must not dominate the page.
- **Schematic journey:** use a small connected flow for `Lead / Intake → Customer → Opportunity → Case → Outcome`. On narrow mobile screens the five states remain a compact single-row schematic with secondary descriptions hidden, instead of becoming five tall cards.
- **Three product pillars:** Home and Product focus on `Customer memory`, `Sales & follow-up`, and `Case & execution`. Each pillar gets concise copy and a micro-UI snippet rather than a full screenshot.
- **Container model:** use open editorial layouts, thin separators and compact cards. Avoid repeated full-width product frames, nested bento grids and large dark storytelling blocks.
- **Palette:** true white surfaces, Rahjo navy for depth, teal for action/status, cool neutral borders. Decorative gradients should not become the visual identity.
- **Typography:** Vazirmatn with restrained heading scale. Controls and metadata use deliberate smaller UI sizes.
- **Geometry:** modest radii, thin borders and restrained shadow. Product UI is flat and legible, not tilted or pseudo-3D.
- **Responsive:** no horizontal overflow; CTA hierarchy and schematic meaning remain obvious on mobile.
- **Motion:** subtle only and never required to understand meaning.
- **Evidence gate:** build/test success is not visual acceptance. W14 visual tasks close only after desktop + mobile rendered screenshots are inspected and the live origin reports the accepted source SHA.

## CTA behavior contract
Public Site QA must exercise the controls, not only inspect their markup:

- Header signed out → `/login`
- Header signed in → `/dashboard`
- Home `دیدن محصول` → `/product`
- Home Login actions → `/login`
- Product Login → `/login`
- Product back action → `/`
- Logo → `/`
- Legacy `/contact` → `/login` while W14-005 remains open

The canonical Home/Product surfaces must not contain links to `/contact` until that route represents a real acquisition/intake capability.

## W14 work packages
- W14-001 Product/message contract and public IA
- W14-002 Landing alignment
- W14-003 Header/footer and CTA hierarchy
- W14-004 Public content consolidation and Product alignment
- W14-005 Public intake → live BFF with provenance/idempotency
- W14-006 Login/entry mode clarity: Workspace vs Golden Demo
- W14-007 Shared visual language and responsive/accessibility pass
- W14-008 Claims, README, Architecture, SEO and go-live documentation cleanup
- W14-009 End-to-end acceptance from landing/intake to operational outcome

## Acceptance gate
A new visitor can quickly understand what Rahjo is, see a compact product representation consistent with the live console, understand the customer-to-outcome schematic, recognize whether the product fits their kind of team, and reach the correct Product or Login/Workspace destination. Public acceptance fails if a CTA lands on a misleading/dead-end route, a signed-out visitor is presented as workspace-ready merely because the server is healthy, old screenshot galleries return, or mobile becomes unnecessarily tall or horizontally broken.
