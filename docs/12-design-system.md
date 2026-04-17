# 12 — Design System

Goal: feel **elegant, editorial, and calm** — not loud, not generic Shopify.

## Typography

| Role             | Font                 | Weight   | Tracking |
| ---------------- | -------------------- | -------- | -------- |
| Display / H1, H2 | **Fraunces** (serif) | 400, 600 | -0.02em  |
| Body             | **Inter**            | 400, 500 | normal   |
| UI labels        | Inter                | 500      | 0.02em   |
| Numbers (price)  | Inter (tabular nums) | 500      | normal   |

Load via `next/font/google` with `display: "swap"`. Subset: `latin` + `bengali` (post-MVP).

Scale (rem):

```
xs   .75   12px
sm   .875  14px
base 1     16px   (body)
lg   1.125 18px
xl   1.25  20px
2xl  1.5   24px
3xl  1.875 30px
4xl  2.25  36px
5xl  3     48px   (hero)
6xl  3.75  60px
```

Line-height: body `1.7`, headings `1.2`.

## Palette

```
--bg            #FBF8F4   cream
--bg-alt        #F3ECE2   blush sand
--surface       #FFFFFF
--ink           #1A1413   near-black warm
--ink-soft      #5C504C
--muted         #A89F9A
--line          #E7DFD5
--accent        #6B1F2E   deep burgundy
--accent-soft   #B97A86
--success       #4F6F52
--warn          #B8722C
--danger        #9B2A2A
```

Dark mode deferred to post-MVP.

## Spacing

Base unit `4px`. Tailwind defaults work. Avoid arbitrary values; if you reach for `p-[13px]`, the design is wrong.

Section padding: `py-16 md:py-24` for marketing, `py-8 md:py-12` for utility pages.

## Radius

```
--radius-sm  4px    inputs, chips
--radius-md  8px    cards, buttons (pill-ish? see below)
--radius-lg  16px   modals, sheets
```

Buttons are subtly pill-shaped: `rounded-full` for primary CTAs, `rounded-md` for secondary.

## Shadows

```
--shadow-sm  0 1px 2px rgba(26,20,19,.04)
--shadow-md  0 8px 24px rgba(26,20,19,.06)
--shadow-lg  0 20px 60px rgba(26,20,19,.08)
```

Avoid harsh shadows. Use them sparingly for elevation, not as decoration.

## Components

- Buttons: `Primary` (filled accent), `Secondary` (outline ink), `Ghost`, `Link`.
- Inputs: floating label optional, thin underline border, focus ring `--accent` 2px.
- Cards: white surface, `--shadow-sm`, hover lift to `--shadow-md` over 200ms ease.
- Product card: image 4:5 aspect, name (1 line ellipsis), price, swatch row (max 5 + "+N"), wishlist heart top-right.
- Cart drawer: right slide-in, 420px wide on desktop, full sheet on mobile.

## Motion

- Default duration `200ms`, easing `cubic-bezier(0.4, 0, 0.2, 1)`.
- Hover scale `1.02` on product images, `1.0` on text — never scale text.
- Page transitions: fade-in body, no exit (Next App Router default).
- Framer Motion for cart drawer, modals, scroll reveals.
- `prefers-reduced-motion` respected — disable all transforms/transitions.

## Imagery rules

- Product photos: neutral background (`#FBF8F4` matches `--bg`), centered, even lighting.
- No filters, no overly saturated edits.
- Hero/banner images: editorial — model + product, generous negative space.
- Avoid stock cosmetic clichés (woman touching face with tip of finger, dropper close-ups).

## Iconography

- `lucide-react`. Stroke 1.5. Size matches text (use `size-4`, `size-5`).
- No mixed icon libraries.

## Accessibility

- Min contrast WCAG AA. Verify on every PR with the bundled CI check.
- Focus rings always visible (`--accent` 2px outline + 2px offset).
- All form inputs have a programmatic label.
- All interactive elements reachable via keyboard.
- Skip-to-content link on every page.
- Alt text required on every image — Cloudinary uploader has alt-text input.
- Use semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`.

## Tokens file

All tokens live in `tailwind.config.ts` `theme.extend`. CSS variables mirror in `src/app/globals.css` for runtime use. Components reference tokens, never raw hex.
