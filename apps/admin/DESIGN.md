# Admin Panel DESIGN.md

## Product feel
Build a dense, dark admin console for operators who manage records, users, and system state all day.
Prioritize scannability, keyboard speed, and information density over marketing polish. Use a
near-black canvas, layered graphite surfaces, and warm orange/olive accents that carry meaning.

## Color system

### Brand
- Orange: #e0752b — primary actions, active nav, selected rows
- Olive: #a69d61 — secondary emphasis, focus accents
- Teal: #a5c5c6 — chart/data highlight only

### Surfaces (dark)
- Canvas: #060909 — app background
- Surface: #001820 — panels, tables, cards
- Surface Raised: #00132c — hover rows, menus, inputs
- Border: #0e599b — separators and outlines

### Text
- Text Primary: #fafafa — headings, values, body
- Text Secondary: #a5c5c6 — labels, metadata
- Text Muted: #6b6b6b — captions, disabled, placeholders

### Semantic
- Success: #a69d61 — healthy, active, completed (olive green)
- Warning: #e0752b — degraded, pending review (orange)
- Danger: #ef4444 — errors, destructive, offline
- Info: #0e599b — informational, links (dark blue)

## Light mode

- Canvas: #f7f7f8, Surface: #ffffff, Border: #e5e5e5
- Text Primary: #060909, Text Secondary: #666666
- Keep semantic colors recognizable and test contrast in both modes.

## Typography

- Display Font: Inter
- Body Font: Inter
- Code Font: JetBrains Mono
- Use weights 400, 500, 600, 700.
- Use mono and tabular numbers for IDs, counts, and timestamps.

### Type scale
- Page Title: 20px / 28px / 600 / -0.02em
- Section Heading: 15px / 22px / 600
- Card Title: 14px / 20px / 600
- Body: 13px / 20px / 400
- Label: 11px / 16px / 500 / 0.05em
- Caption: 11px / 16px / 400
- Data / Mono: 13px / 18px / 500

## Spacing

- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40px
- Desktop page gutter: 24px
- Mobile page gutter: 12px
- Card padding: 16px
- Dense row padding: 6px 12px
- Section gap: 24px

## Border radius

- 4px: badges, tags, compact controls
- 8px: buttons, inputs, cards, table shells
- 12px: featured stat panels
- 50%: avatars
- 100px: status pills

## Elevation

- Operational surfaces are flat with a 1px border.
- Menu / popover: 0 8px 24px rgba(6, 9, 9, 0.5)
- Focus: 0 0 0 2px rgba(224, 117, 43, 0.5) — orange focus ring
- Reserve shadows for overlays, not inline cards.

## Layout

- Persistent left sidebar (240px) with grouped navigation.
- Main content max width: full-bleed with 24px gutters (admin, not marketing).
- Sticky top bar: page title left, global actions and account right.
- Dense two- or three-column grids for stat rows.

## Sidebar navigation

- Group links under compact uppercase labels.
- Nav item height: 34px.
- Default: transparent background, Text Secondary.
- Hover: Surface Raised (#00132c).
- Active: Orange accent (#e0752b) with Text Primary and a left indicator.
- Collapse to icons on tablet, drawer on mobile.

## Data table (core surface)

- Header height: 34px; row height: 36px (dense).
- Header text: 11px / 500 / Text Secondary.
- Body text: 13px / Text Primary; IDs and counts tabular.
- Support sort, filter, pagination, row selection, and inline row actions.
- Status is a semantic badge plus text, never color alone.
- Sticky header on scroll; sticky first column when useful.
- Bulk actions bar appears when rows are selected.

## Stat cards

- Anatomy: label, large value, optional trend, optional context.
- Value: 24px / 600, tabular.
- Trend uses semantic color on the delta only.
- Skeleton preserves final geometry.

## Buttons

- Primary: Orange background (#e0752b), white text, 8px radius.
- Secondary: Surface Raised, 1px Border (#0e599b), Text Primary.
- Ghost: transparent, Text Secondary, for toolbar/icons.
- Destructive: Danger text/border; filled danger only on confirm.
- Heights: 28px small, 32px medium, 36px large.
- Include hover, active, focus-visible, disabled, loading.

## Inputs and filters

- Surface Raised background (#00132c), 1px Border (#0e599b), 8px radius.
- Focus uses Orange border (#e0752b) and the defined focus ring.
- Filter bar sits above tables; chips show active filters with clear buttons.
- Error uses Danger border plus helper text.

## Badges and status

- Success (olive #a69d61), Warning (orange #e0752b), Danger (#ef4444), Info (blue #0e599b): semantic text on subtle tinted background.
- Neutral: Text Secondary on Surface Raised.
- Always pair status color with a text label.

## States

### Loading — skeleton rows match table geometry; no colored blocks.
### Empty — explain what is missing and offer one action inside the table shell.
### Error — state what failed with a retry; keep filters and selection.
### Success — confirm near the affected row or via a compact toast.
### Disabled — keep labels readable; explain why the action is unavailable.

## Responsive behavior

- Desktop above 1024px: persistent sidebar, dense multi-column grids.
- Tablet 768–1024px: sidebar collapses to icons; tables scroll horizontally.
- Mobile below 768px: drawer nav; tables become horizontally scrollable cards.
- Never wrap table cells into unreadable stacks; scroll instead.
- Bulk action bar stays reachable on all sizes.

## Accessibility

- All controls keyboard reachable with visible focus.
- Real table markup with header scope and row selection semantics.
- Maintain 4.5:1 contrast for body text on dark surfaces.
- Icon-only buttons require accessible labels.
- Status includes text or icon, never color alone.
- Respect prefers-reduced-motion.
- Announce bulk-action results and destructive confirmations.

## Motion

- 100–160ms transitions for hover, selection, and menus.
- Avoid layout-shifting animation in dense tables.
- Disable non-essential motion under prefers-reduced-motion.

## Agent implementation checklist

- Read this file before generating UI.
- Use exact tokens and keep density high.
- Preserve the 240px sidebar and 36px dense table rows.
- Make the data table the primary, fully-stated surface.
- Include loading, empty, error, success, disabled, hover, active, and focus states.
- Test desktop, tablet, mobile, light, dark, and keyboard navigation.

## Do

- Prioritize density and scannability.
- Make the data table complete: sort, filter, select, paginate.
- Use semantic colors only for meaning.
- Keep IDs, counts, and timestamps tabular.
- Show a bulk-action bar on selection.
- Use visible focus states everywhere.

## Don't

- Don't add marketing hero blocks to the admin shell.
- Don't use decorative gradients or glassmorphism.
- Don't wrap dense table cells into unreadable stacks.
- Don't communicate status with color alone.
- Don't use arbitrary colors outside the palette.
- Don't hide destructive actions behind color only.

## License

MIT — this design system template is free to use and modify.
