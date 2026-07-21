# Payloud Design System

## Ownership

- **Storefront:** existing Tailwind utilities plus the semantic `--server-*` / `--payloud-*` tokens in `apps/storefront/src/styles/globals.css`.
- **Medusa Admin:** `@medusajs/ui` primitives and Admin route layout conventions.
- **Focused interaction primitives:** existing Headless UI/Radix dependencies only where already required.
- Do not introduce a second Button, Dialog, Table or Toast system without a measured accessibility or product need.

## Tokens

### Typography

- Body: `--payloud-font-body` (`Inter`, system fallback).
- Display: `--payloud-font-display` (`Onest`, body fallback).
- Existing Tailwind text roles remain canonical: xsmall, small, base, large, xl, 2xl and 3xl.
- Body copy and controls should default to readable base/small roles; muted text is supporting context, not essential state.

### Spacing

Use the existing 4 px Tailwind scale. Preferred component spacing:

- compact inline gap: 8 px;
- control/card internal gap: 12–16 px;
- section gap: 24 px;
- page section separation: 32–48 px.

### Semantic colors

- page background: `--server-bg`;
- surface: `--server-surface`;
- muted surface: `--server-surface-muted`;
- border: `--server-border`;
- strong border: `--server-border-strong`;
- text: `--server-text`;
- secondary text: `--server-muted`;
- primary action: `--server-primary` / `--server-primary-hover`;
- danger: `--server-danger`;
- warning: `--server-warning`;
- success: `--server-success`.

Never communicate warning/error/success by color alone; pair color with a label, icon or status text.

### Radius and shadows

- Canonical storefront radius: `--server-radius`.
- Elevated overlays may use `--payloud-shadow`.
- Routine cards and tables should prefer borders over decorative shadows.

## Responsive rules

- Design from 320 px upward.
- Primary actions remain visible without horizontal page scrolling.
- Dense comparison tables may use a local horizontal scroller while headings and controls remain outside it.
- Filters collapse into a dedicated mobile action; selected filters and result count stay visible.
- Configurator/cart summaries stack on mobile and become sticky only where viewport height and focus order remain usable.

## Canonical component inventory

### Button

- Storefront: existing `server-primary`, `server-secondary`, icon-button and semantic variants.
- Admin: `@medusajs/ui` `Button`.
- Every icon-only action requires an accessible name.
- Destructive and mass actions require impact text and explicit confirmation.

### Input and Select

- Storefront uses native form controls or existing accessible wrappers.
- Admin uses Medusa UI `Input`, `Select`, `Checkbox` and shared field wrappers.
- Labels remain visible; placeholder text is not a label.

### Dialog / Drawer / Focus modal

- Admin uses Medusa UI `Drawer` and `FocusModal`.
- Storefront uses existing Headless UI/Radix primitives where present.
- Focus is trapped, Escape closes non-destructive overlays and close controls are named.

### Table

- Admin uses Medusa UI `Table`.
- Storefront comparison/cart tables use semantic `table`, `th` scopes and local responsive overflow.
- Mobile alternatives must not remove data or actions.

### Card

- Server/product cards use the existing server surface, border and radius tokens.
- Cards are not used to hide dense technical tables; grouped specs use headings and definition lists.

### Tabs

- Admin uses Medusa UI `ProgressTabs` for ordered workflows.
- A tab must represent peer content, not navigation that should be a link.

### Badge

- Status badges always include text: complete, warning, blocking error or optional improvement.
- Admin uses Medusa UI `Badge`; storefront uses existing semantic status classes.

### Toast

- Admin uses Medusa UI `toast` for confirmed mutations and recoverable errors.
- Critical blockers remain in-page and are not toast-only.

### Skeleton / loading

- Preserve layout dimensions while loading.
- Use explicit loading labels for data-heavy Admin/readiness operations.
- Never show stale optimistic readiness as a successful publication decision.

## Light and dark behavior

The current storefront ships a light semantic token set. New components must consume semantic tokens rather than literal surface/text colors so a future dark token override can be introduced without component rewrites. Medusa Admin follows its own theme-aware UI tokens. Stage 13 does not force a partial dark mode that would leave commerce surfaces inconsistent.

## Critical flow patterns

### B2B configured cart

- Show the server model first.
- Group CPU, memory, storage, RAID, network and power.
- Keep effective specs and technical auto-added items available through disclosure.
- Display warnings in-page.
- Quantity/edit/delete actions remain adjacent to the configured line.

### Compare

- URL is the source of truth.
- Differences-only is an explicit checkbox.
- Specs are grouped.
- Share and remove actions are keyboard accessible.
- Use local horizontal scrolling on narrow screens.

### Publishing Assistant

- Never publishes automatically.
- Uses four statuses: complete, warning, blocking error and optional improvement.
- Every non-complete finding contains explanation, affected entity, repair action, deep link and revalidation requirement.
- Guided Manual is the default repair mode.
