# RAH-W14 — Public Product Alignment

Status: In progress
Baseline: main@171a200225fe9fcbb68b39236eaae2acbd78f268

## Objective
Align Rahjo's public website, landing experience, entry points and product narrative with the live server-backed operational product without reopening W7/W11/W12 or changing the W13 backend contract.

## Product contract
Rahjo is an operational system for service businesses that carries one customer journey through a shared commercial and operational memory:

`Intake → Account → Opportunity/Case → Service → Approval → Action → Receipt → Outcome`

AI is optional. The core product must remain useful and understandable with all model providers disabled.

## Public experience principles
1. Lead with the operational outcome, not modules, AI or CRM jargon.
2. Use the same nouns publicly and inside the console: Account/Customer, Case/Request, Service, Approval, Action, Outcome.
3. Product proof should resemble the real operational product, not a disconnected marketing mock.
4. Primary CTA is starting/evaluating Rahjo; authenticated users get a direct workspace CTA; Golden Demo is secondary and explicitly labeled.
5. Public intake must eventually create server records through the existing Rahjo BFF. No silent browser-local fallback in server mode.
6. Do not claim live Relaticle, MCP, payment, messaging or production-ready disaster recovery until their W13 gates pass.
7. Legacy public paths may redirect for compatibility but must not define the current information architecture.

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
A new visitor can understand what Rahjo does, see a product representation consistent with the live console, start the correct journey, and reach either the live operational workspace or a clearly separated Golden Demo without encountering legacy terminology or false capability claims.
