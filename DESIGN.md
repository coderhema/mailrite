# MailRite Design System

## Taste-Skill Configuration

- **DESIGN_VARIANCE: 5** - Offset but not chaotic. Left-aligned content, asymmetric white space, CSS Grid where applicable.
- **MOTION_INTENSITY: 5** - Fluid CSS micro-interactions. Spring physics on toggles, fade/slide on panels, pressed states on clicks.
- **VISUAL_DENSITY: 5** - Daily app spacing. Standard section gaps, comfortable padding, clear hierarchy without crowding.

## Design Read

"SaaS outreach tool for sales professionals, with a dark-tech premium language, leaning toward Tailwind custom theme + Outfit + restrained motion."

## Typography

| Token | Value |
|---|---|
| Primary font | `Outfit` (300-700 weight) |
| Monospace | System monospace fallback |
| Scale | 10px / 11px / 12px / 13px / 14px / 15px / 16px / 18px / 20px / 24px |
| Headings | Bold, tighter tracking |
| UI labels | 10-11px, uppercase, wide tracking (`0.2em`) |

Outfit was chosen over Inter (explicitly discouraged per taste-skill). Warm geometric sans with humanist character, suitable for a premium B2B tool.

## Color Palette

### Dark Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `bg-deep` | `#050505` | App background |
| `bg-panel` | `#080808` | Sidebar panels |
| `bg-surface` | `#0f0f0f` | Cards, inputs, surfaces |
| `bg-elevated` | `#1a1a1a` | Hover/active states |
| `border` | `#1f1f1f` | Borders, dividers |
| `border-subtle` | `#141414` | Subtle borders |
| `text-primary` | `#f5f5f5` | Primary text |
| `text-secondary` | `#6b6b6b` | Secondary/meta text |
| `text-tertiary` | `#3a3a3a` | Placeholder, disabled |
| `accent` | `#FF9F1C` | CTAs, highlights, AI badges |

### Light Mode

All tokens invert via `[data-theme="light"]`. Backgrounds shift to warm grays, text to near-black, accent deepens to `#f08c00`.

## Shape & Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Small UI elements |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 12px | Cards, containers |
| `radius-xl` | 16px | Modals, large panels |

## Iconography

Using `lucide-react` (accepted per taste-skill override path since the project already heavily depends on it). Consistent 16-20px sizing. Stroke width defaults to library default.

## Motion

### Principles
1. Spring physics for toggles and transitions (`stiffness: 400-500, damping: 25-30`)
2. Fade + slide (12-24px) for entering elements
3. Scale for tactile feedback (`scale-[0.92]` to `scale-[0.98]` on active/pressed)

### Applied Patterns
| Element | Pattern |
|---|---|
| Toggle switches | Spring x-axis motion |
| Modals | Scale + fade (0.9 -> 1, y: 20 -> 0) |
| Panel transitions | Slide translateX (300ms ease) |
| Messages | Fade + slideY (12px) |
| Button pressed | `active:scale-[0.97]` or `active:translate-y-[2px]` |
| Connection lines | Infinite flow animation (3s linear) |
| Shimmer text | Gradient sweep (2s infinite) |

## Layout

### Grid Structure
- Desktop: `260px sidebar | 1fr main | 340px right panel`
- Tablet/Mobile: Full-width panels, slide-in sidebars

### Surface Stack
- `z-10`: Elevated source cards, connections
- `z-[110]`: Sidebars, modals
- `z-[120]`: Active modals

## Component Patterns

### Buttons
- Primary: `bg-accent text-bg-deep` with `active:scale-[0.98]` pressed state
- Ghost: Subtle hover background (`hover:bg-bg-elevated`)
- CTA labels kept concise, single-line at desktop

### Source Cards
- Active state: accent border with subtle gradient background
- Inactive: neutral border, hover reveals elevated bg
- Switch toggle with spring animation

### Chat Bubbles
- User: filled surface, rounded-3xl with sharp top-right corner
- AI: translucent border, rounded-3xl with sharp top-left corner
- Max width capped at 540px on desktop
- AI header: uppercase accent label

### Modals
- Centered, max-w-md, rounded-2xl
- Scale-in entry animation
- Overlay backdrop (`inset-0 z-[100]`)

## Dark Mode Protocol

- Default: dark mode
- Toggle via `data-theme` attribute on body
- No pure `#000000` or pure `#ffffff` (off-black/off-white ensure depth)
- Light mode uses warm gray neutrals with same accent family
- Theme is locked per session, no section-level inversion

## Accessibility

- WCAG AA contrast for all body text
- Form inputs use label-above pattern
- Focus rings on interactive elements
- Reduced motion: collapsed to instant transitions via Motion's `useReducedMotion` (target)
- Semantic HTML structure
