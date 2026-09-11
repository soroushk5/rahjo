# RAH-W14 — Public Product Alignment

Status: In progress
Baseline: server-backed W13 + W14 public alignment

## Objective
Align Rahjo's public website, landing experience, entry points and product narrative with the live server-backed operational product without reopening W7/W11/W12 or changing the W13 backend contract.

## Product contract
Rahjo is an operational system for service businesses that carries one customer journey through a shared commercial and operational memory:

`Intake → Account → Opportunity/Case → Service → Approval → Action → Receipt → Outcome`

AI is optional. The core product must remain useful and understandable with all model providers disabled.

## Public experience principles
1. Lead with the operational outcome, not modules, AI or CRM jargon.
2. Use the same nouns publicly and inside the console: Account/Customer, Case/Request, Service, Approval, Action, Outcome.
3. Product proof must resemble the real operational product, not a disconnected marketing mock.
4. Primary CTA is starting/evaluating Rahjo; authenticated users get a direct workspace CTA; Golden Demo is secondary and explicitly labeled.
5. Public intake must eventually create server records through the existing Rahjo BFF. No silent browser-local fallback in server mode.
6. Do not claim live Relaticle, MCP, payment, messaging or production-ready disaster recovery until their W13 gates pass.
7. Legacy public paths may redirect for compatibility but must not define the current information architecture.

## Visual rebaseline contract
The public experience and operational console are one product and must look like one system.

- **First viewport:** one concise promise, one real product signal, one primary action. No decorative hero eyebrow, giant multi-line billboard headline, floating marketing badges, or ornamental dashboard collage.
- **Product proof:** use the same vocabulary, geometry and information hierarchy as the real console: customer, Case, next action, approval state, timeline and evidence. Do not invent a separate “marketing dashboard”.
- **Operating map:** the canonical visual is a connected spine from `Intake → Customer → Case → Service → Approval → Action → Outcome`, grouped into relationship memory, sales/service work, and control/evidence. `/map` remains compatibility-only and resolves to `/how-it-works`.
- **Container model:** default to open editorial layouts, connected rails, tables and rows. Avoid generic bento grids, nested rounded cards and repeated four-card feature sections unless the information genuinely requires them.
- **Palette:** true white public surfaces, Rahjo navy for operational depth, teal only as the action/status accent, cool neutral borders. Do not introduce cream backgrounds or decorative gradients.
- **Typography:** Vazirmatn with restrained heading scale. Desktop public H1 should read as product/editorial typography rather than an advertising billboard; controls and metadata use deliberate smaller UI sizes.
- **Geometry:** modest radii (roughly 8–18px), thin borders, restrained shadow. Product UI should be flat and legible, not tilted or pseudo-3D.
- **Responsive:** the operating spine becomes a vertical connected flow on mobile; CTA hierarchy remains obvious; no horizontal overflow.
- **Motion:** subtle entrance only when reduced-motion is not requested. Motion must not carry meaning by itself.
- **Evidence gate:** build/test success is not visual acceptance. W14 visual tasks close only after desktop + mobile rendered screenshots are inspected and the live origin reports the accepted source SHA.

## W14 work packages
- W14-001 Product/message contract and public IA
- W14-002 Landing alignment
- W14-003 Header/footer and CTA hierarchy
- W14-004 Product/Services/Use Cases/How It Works content alignment
- W14-005 Public intake → live BFF with provenance/idempotency
- W14-006 Login/entry mode clarity: Workspace vs Golden Demo
- W14-007 Shared visual language and responsive/accessibility pass
- W14-008 Claims, README, Architecture, SEO and go-live documentation cleanup
- W14-009 End-to-end acceptance from landing/intake to operational outcome

## Acceptance gate
A new visitor can understand what Rahjo does, see a product representation consistent with the live console, start the correct journey, and reach either the live operational workspace or a clearly separated Golden Demo without encountering legacy terminology, false capability claims, a disconnected marketing design language, or a broken responsive state.
