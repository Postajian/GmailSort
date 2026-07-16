---
version: alpha
name: GmailView Design System
description: Newspaper-style Gmail overlay. Cream, ink and gold broadsheet look with sharp 90-degree corners, serif mastheads and hairline rules.
colors:
  primary: "#1a1a1a"
  on-primary: "#ffffff"
  secondary: "#c9a84c"
  on-secondary: "#1a1a1a"
  surface: "#ffffff"
  on-surface: "#1a1a1a"
  neutral: "#f4f0e7"
  on-neutral: "#191919"
  muted: "#9a9a9a"
  divider: "#ededed"
  hairline: "#e4e1d6"
  hover: "#f6f2e6"
  rule: "#000000"
  button-ink: "#171717"
  gold-deep: "#b58a22"
  gold-eyebrow: "#8a6818"
  gold-border: "#c9b77f"
  gold-subrule: "#d8c99a"
  success: "#42733d"
  danger: "#b00020"
  on-danger: "#ffffff"
  warning-surface: "#fff8e1"
  warning-ink: "#5f4b00"
  warning-border: "#e0c200"
  dark-paper: "#1b1814"
  dark-outer: "#141210"
  dark-ink: "#ece4d2"
  dark-muted: "#a79e8b"
  dark-rule: "#d9cfb8"
  sepia-paper: "#f7efe0"
  sepia-outer: "#efe3cc"
  sepia-ink: "#43321f"
  sepia-muted: "#8a755a"
  sepia-rule: "#7a5c3a"
typography:
  masthead:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 24px
    fontWeight: 900
    lineHeight: 30px
    letterSpacing: 6.16px
  column-header:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 16px
    fontWeight: 1000
    lineHeight: 18px
    letterSpacing: 0.5px
  group-label:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 15px
    fontWeight: 1000
    lineHeight: 20px
    letterSpacing: 2.4px
  subject:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 14px
    fontWeight: 700
  body-row:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 14px
    fontWeight: 400
  overlay-title:
    fontFamily: '"Times New Roman", Times, serif'
    fontSize: 20px
    fontWeight: 900
    letterSpacing: 0.5px
  control-label:
    fontFamily: Arial, sans-serif
    fontSize: 10px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.8px
  options-display:
    fontFamily: '"Times New Roman", serif'
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.05
  options-legend:
    fontFamily: '"Times New Roman", serif'
    fontSize: 20px
    fontWeight: 700
  options-eyebrow:
    fontFamily: Arial, sans-serif
    fontSize: 12px
    fontWeight: 700
    letterSpacing: 2px
  options-body:
    fontFamily: Arial, sans-serif
    fontSize: 16px
    fontWeight: 400
  options-hint:
    fontFamily: Arial, sans-serif
    fontSize: 13px
    fontWeight: 400
rounded:
  none: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  row-height: 38px
  row-height-compact: 26px
  card-padding: 18px
  card-gap: 18px
  sender-col: 200px
  subject-col: 493px
  preview-col: 240px
  date-col: 170px
  content-indent: 148px
components:
  button-primary:
    backgroundColor: "{colors.button-ink}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.button-ink}"
    rounded: "{rounded.none}"
    padding: 16px
  control-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.rule}"
    typography: "{typography.control-label}"
    rounded: "{rounded.none}"
    height: 22px
  control-button-active:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.on-primary}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.none}"
    padding: 9px
  chip-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.none}"
    padding: 10px
  health-banner:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning-ink}"
    rounded: "{rounded.none}"
    padding: 14px
  row-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.on-surface}"
  button-reset-armed:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
  save-status:
    textColor: "{colors.success}"
    typography: "{typography.options-body}"
  options-eyebrow:
    textColor: "{colors.gold-eyebrow}"
    typography: "{typography.options-eyebrow}"
  metadata-caption:
    textColor: "{colors.muted}"
    typography: "{typography.options-hint}"
---

# GmailView Design System

## Overview

GmailView restyles the Gmail inbox as a broadsheet newspaper. The personality is editorial, dense and typographic: a serif masthead in full caps, hairline column rules, black 2px section rules and a single gold accent, all sitting on white "paper" (or the user's chosen theme paper). The audience is a power user who reads a high-volume inbox like a front page, so the UI should feel like print, not like a web app.

Two surfaces exist and share the identity:

- The in-Gmail overlay (content script), which paints the masthead, column headers, date-group rules and row typography over Gmail's own list.
- The options page, a cream settlement of white cards with gold borders, serif legends and black rectangular buttons.

Nearly every dimension (font sizes, row height, column widths, letter spacing) is a user-editable setting with a clamped range. The values in this file are the shipped defaults; treat them as the brand baseline, never hardcode over the user's stored settings.

## Colors

The palette is newspaper cream, ink black and a restrained gold.

- **Primary Ink (#1a1a1a):** The reading color. All row text, headers and the masthead use ink via the `--gvn-ink` CSS variable.
- **Secondary Gold (#c9a84c):** The single accent, exposed as `--gvn-gold` and user-overridable per settings (`accentColor`). Used for hover fills on chips and buttons, focus rings, bar-chart fills and highlighted keys in the help overlay. Text placed on gold is always ink (#1a1a1a).
- **Surface Paper (#ffffff):** The page. The overlay derives `--gvn-paper` and a solid `--gvn-band` (masthead and column strips always stay opaque, even when the transparent-background toggle makes the list see-through).
- **Neutral Cream (#f4f0e7):** The options-page background and the sticky action bar backing. Its text ink is #191919.
- **Rules and hairlines:** Structural black rules (#000000, `--gvn-rule`), light dividers (#ededed), warm hairlines (#e4e1d6) and the warm hover wash (#f6f2e6).
- **Options golds:** Deeper print golds for the settings page only: double masthead rule #b58a22, uppercase eyebrow #8a6818, card borders #c9b77f, subhead rule #d8c99a.
- **State colors:** Success green #42733d (save status), danger red #b00020 (armed destructive reset, white text), and the amber health banner trio #fff8e1 / #5f4b00 / #e0c200.

Theme variants replace the base trio while keeping the same structure: Dark (paper #1b1814, outer #141210, ink #ece4d2, muted #a79e8b, rule #d9cfb8), Sepia (paper #f7efe0, outer #efe3cc, ink #43321f, muted #8a755a, rule #7a5c3a) and High Contrast (pure #000000 ink and rules on #ffffff). Muted gray #9a9a9a is metadata-only (captions, counts), never body text.

## Typography

One serif voice carries the whole product: **"Times New Roman", Times, serif**. Arial appears only in tiny utilitarian control labels and on the options page body; Courier New marks monospace sender names in the override list.

- **Masthead:** 24px, weight 900, uppercase, 6.16px letter spacing, 30px line height. This is the front-page nameplate; it sits over a 2px black rule.
- **Column headers:** 16px at weight 1000, uppercase, 0.5px letter spacing, inside a 26px strip closed by another 2px rule.
- **Group labels (date sections):** 15px, weight 1000, uppercase, 2.4px letter spacing, framed by twin 2px rules above and below.
- **Rows:** Subjects are 14px bold; sender, preview and date are 14px regular. All row text is ink on paper.
- **Control labels:** Arial 600 at 10px, uppercase with 0.8px letter spacing, used for the Edit / Labels / Inspect pill buttons in the masthead.
- **Options page:** 40px serif display title, 20px serif legends, Arial 16px body, 12px eyebrow with 2px tracking, 13px hints in #666-range muted gray.

Font sizes, weights (bold toggles map to 900/1000), italics, letter spacing and word spacing are all live user settings with clamped ranges (for example inbox title 8-48px, row height 32-72px). The label rail keeps Gmail's own font family and only resizes it (default 18px).

## Layout

The overlay is column-journalism: a fixed masthead strip (34px), a column-header strip (26px), then the list. Default column metrics: sender 200px, subject 493px, preview 240px, date 170px, content indent 148px, right inset 79px. Rows are 38px tall by default; compact density clamps to 26px. Below 1100px the sender column and indent tighten automatically. An optional reading-width cap centers the list on very wide screens.

The options page is a fluid grid of white cards: `repeat(4, minmax(0, 1fr))` with 18px gaps, collapsing to `auto-fit minmax(300px, 1fr)` under 1700px. Cards use 18px internal padding and 14px control gaps. Wide cards (Layout, Senders/views/labels) span two columns. A sticky bottom action bar on cream holds the buttons.

Spacing rhythm is small and print-tight: 4 / 8 / 12 / 18 / 24px. Prefer hairline separation over whitespace inflation; this UI is intentionally dense.

## Elevation & Depth

This is a flat, print-first system. Hierarchy comes from rules and weight, not shadows:

- Structure is drawn with 2px black rules (masthead, column strip, group frames) and 1px dividers or hairlines everywhere else.
- Hover states use the warm paper wash #f6f2e6 or a gold fill, never elevation.
- Shadows exist only on true overlays: the help card (0 8px 40px rgba(0,0,0,.4)), the quick-settings popover (0 8px 30px rgba(0,0,0,.35)) over a rgba(0,0,0,.45) scrim, and the floating health banner (0 2px 12px rgba(0,0,0,.18)).
- Focus is a 2px gold ring (`box-shadow: 0 0 0 2px #c9a84c`), not a glow.
- The optional sci-fi mode adds a soft gold text-shadow (rgba(201,168,76,.55-.6)) to the masthead and stat numerals; it is the only glow in the product.

## Shapes

Sharp 90-degree corners everywhere. `border-radius: 0` is enforced with `!important` on every GmailView root (`#gmail-view-next-ui`, front page, health panel, resizer, options page `*`). Any radius you may find inline in a rule is neutralized by these resets; never rely on it. Rectangles, straight rules and square swatches are the entire shape language, echoing set newspaper type. Circles and pills are off-brand.

## Components

- **Primary button (options):** Solid #171717 rectangle, white text, 1px #171717 border, 10px vertical and 16px horizontal padding. Link-buttons share the exact same box.
- **Secondary button (options):** Same rectangle inverted: white fill, #171717 text and border.
- **Control pills (in-Gmail masthead):** 22px-tall white rectangles with 1px black border and Arial 600 10px uppercase labels. Hover and active invert to black fill with white text; toggled-on states fill with gold.
- **Chips (front-page digest and filters):** 13px bold serif, 3px by 9px padding, 1px divider border. Hover fills gold with ink text.
- **Inputs:** White fields with 1px #aaa border and 9px by 10px padding, square. Focused editor values get the 2px gold focus ring. Number inputs in the Layout card align right in a 96px column.
- **Checkboxes:** Square 14px custom boxes, #777 border, filling #555 with a white tick when checked.
- **Group headers:** An uppercase serif label between two full-width 2px rules; this double-rule frame is the signature list divider.
- **Health banner:** Amber #fff8e1 strip, #5f4b00 text, 1px #e0c200 border, centered at top with a small shadow; its buttons are white with a #b58900 border.
- **Destructive reset:** Two-click pattern. The armed state turns #b00020 with white text so the confirming click is unmistakable (Warning Insurance).
- **Print:** `@media print` recolors everything to black on white via the CSS variables and hides all controls, rails and tabs.

## Do's and Don'ts

- Do keep every corner square: `border-radius: 0 !important` on all GmailView and options-page elements (G9 standing rule, user preference).
- Don't render a visible scrollbar in any G9 surface; keep scrolling functional but chromeless (G9 standing rule).
- Don't use the em dash character in any UI copy, code comment or doc for this project; use a comma or hyphen (G9 standing rule).
- Do drive all colors through the `--gvn-*` CSS variables so themes, transparency and print restyling keep working; never hardcode a hex into a row style.
- Do respect user-edited settings: sizes, spacing and columns come from clamped settings, so read them, clamp them, and never overwrite the stored value with a "brand" constant.
- Do keep gold as the only accent, used for hover fills, focus rings and highlights, with ink text on top; never set gold body text on white paper (fails contrast).
- Don't put translucent backing behind the masthead or column strips; they must always use the solid `--gvn-band` so scrolled rows cannot show through.
- Do use Times New Roman for anything editorial and Arial only for tiny utility controls; never introduce a third UI font.
- Do apply Warning Insurance to destructive or critical actions: two-click arming, red #b00020 armed state, validation and clamping on every editable value.
- Don't add drop shadows to in-flow content; shadows are reserved for true overlays (help, quick settings, health banner).
- Do keep uppercase plus letter spacing for mastheads, column headers and group labels; row text stays sentence case.
- Do maintain WCAG AA (4.5:1) for text: ink on paper, white on #171717, ink on gold and #5f4b00 on amber all pass; muted #9a9a9a is for decorative metadata only.
