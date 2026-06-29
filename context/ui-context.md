# Shahkar.store — UI Context & Design System
### The Document That Decides Everything
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**Rule:** Every design decision made on this project must reference this document first. If it's not in here, discuss before implementing.

---

## 0. The North Star

Before touching a single color or font — understand who you are designing for:

**She** is a Pakistani woman, 25–45 years old.  
**She** is browsing on a mid-range Android phone — Samsung A series, Tecno, Infinix.  
**She** has a 4G connection that drops to 3G.  
**She** makes decisions emotionally and fast — impulse is your friend.  
**She** doesn't trust easily — COD exists because of her.  
**She** will leave in 3 seconds if the page feels shady, slow, or confusing.  
**She** responds to warmth, relatability, and feeling understood — not corporate polish.

Every design decision must pass this test:  
> **"Would she trust this? Would she understand this instantly? Would she buy?"**

---

## 1. Brand Personality

| Attribute | Description |
|---|---|
| Voice | Warm big sister / helpful neighbor — not corporate |
| Tone | Confident, friendly, slightly playful |
| Language | Roman Urdu dominant — English only for technical labels |
| Feel | Premium but approachable — not cheap, not intimidating |
| Trust signals | Everywhere — she needs constant reassurance |

**What Shahkar feels like:** Walking into a clean, well-organized dukaan where the owner knows you and speaks your language. Not a mall. Not Amazon. Something between.

**What Shahkar must NOT feel like:** A Chinese dropshipping website. Generic. Spammy. Cold.

---

## 2. Color System

### 2.1 Philosophy
Colors are psychological triggers, not decoration. Every color on this site has a job. 62–90% of first impressions about a digital product are based on color alone. Consistent color systems increase brand recognition by up to 80%.

**Core rule:** Maximum 3 brand colors + neutrals + status colors. No more. Every extra color added dilutes trust.

---

### 2.2 Primary Palette

| Role | Color Name | Hex | Usage |
|---|---|---|---|
| **Primary** | Shahkar Green | `#1B6B3A` | Logo, primary CTA buttons, active states, trust badges |
| **Primary Light** | Mint Glow | `#E8F5EE` | Section backgrounds, card hover, subtle highlights |
| **Accent** | Saffron Gold | `#D4820A` | Sale banners, countdown timers, urgency elements, badges |
| **Accent Light** | Warm Cream | `#FFF8ED` | Sale section backgrounds, promotional areas |

**Why this palette:**
- **Green** — trust, growth, balance. Websites using green tones report a 20% increase in trust scores. Green is also deeply associated with Pakistan (flag, Islam, nature). Subconscious recognition.
- **Saffron/Gold** — urgency without aggression. Red creates urgency but also anxiety. Gold creates urgency with warmth — perfect for a desi brand. Culturally, gold signals value and celebration in Pakistani culture.
- Together they feel: **Pakistani, trustworthy, warm, and real.**

---

### 2.3 Neutral Palette

| Role | Color Name | Hex | Usage |
|---|---|---|---|
| **Background** | Off White | `#FAFAF8` | Page background — never pure white, too harsh on mobile |
| **Surface** | Pure White | `#FFFFFF` | Cards, modals, input fields |
| **Border** | Light Gray | `#E5E7EB` | Card borders, dividers, input borders |
| **Subtle** | Muted Gray | `#9CA3AF` | Placeholder text, secondary labels, helper text |
| **Body Text** | Dark Slate | `#1F2937` | All body text — high contrast, easy to read |
| **Heading** | Near Black | `#111827` | All headings — maximum contrast |

---

### 2.4 Status Colors

| Status | Hex | Usage |
|---|---|---|
| **Success** | `#16A34A` | Order confirmed, payment success, checkmarks |
| **Warning** | `#D97706` | Low stock alert, pending status |
| **Error** | `#DC2626` | Form errors, failed actions |
| **Info** | `#2563EB` | Tracking info, neutral notices |

---

### 2.5 Color Rules — Non Negotiable

1. **Primary Green** is ONLY used for the main CTA button and trust elements. Never decorative.
2. **Saffron/Gold** is ONLY used for urgency — sale banners, timers, limited stock. Never use it casually.
3. **Never put text on Saffron** without checking contrast ratio first (minimum 4.5:1)
4. **Never use pure black** (`#000000`) — use Near Black (`#111827`) for softer, more readable text
5. **Never use pure white** (`#FFFFFF`) as a page background — use Off White (`#FAFAF8`)
6. **Red is reserved for errors only** — never use red for CTAs or promotions. Red creates anxiety in a COD context.

---

## 3. Typography

### 3.1 Philosophy
Typography in 2026 must be mobile-first. Base font sizes of 16px or above, comfortable line heights, and scannable heading hierarchies are non-negotiable. Bold hero headlines, clean body text, scannable structure.

---

### 3.2 Font Stack

| Role | Font | Weight | Usage |
|---|---|---|---|
| **Primary Font** | Plus Jakarta Sans | 400, 600, 700 | All English text, UI labels, prices, buttons |
| **Display Font** | Plus Jakarta Sans | 800 | Hero headings, section titles |
| **Urdu/Roman Urdu** | System default with Plus Jakarta Sans fallback | 400, 600 | All Roman Urdu copy |

**Why Plus Jakarta Sans:**
- Modern, clean, highly readable at small sizes
- Excellent on Android screens (your primary audience device)
- Free on Google Fonts
- Feels premium without being cold

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
```

---

### 3.3 Type Scale (Mobile First)

| Element | Size | Weight | Line Height | Color |
|---|---|---|---|---|
| Hero Heading (H1) | 28px mobile / 48px desktop | 800 | 1.2 | Near Black `#111827` |
| Section Heading (H2) | 22px mobile / 36px desktop | 700 | 1.3 | Near Black `#111827` |
| Card Heading (H3) | 18px mobile / 24px desktop | 600 | 1.4 | Near Black `#111827` |
| Body Text | 16px | 400 | 1.6 | Dark Slate `#1F2937` |
| Small / Label | 14px | 400 | 1.5 | Muted Gray `#9CA3AF` |
| Price Display | 24px mobile / 32px desktop | 700 | 1.2 | Primary Green `#1B6B3A` |
| Strikethrough Price | 16px | 400 | 1.2 | Muted Gray `#9CA3AF` |
| Button Text | 16px | 600 | 1 | White `#FFFFFF` |
| Badge/Tag Text | 12px | 600 | 1 | Varies by badge |

---

### 3.4 Typography Rules

1. **Never go below 14px** for any visible text — she's on a small screen
2. **Headings in Urdu/Roman Urdu** should be slightly larger (+2px) than English equivalents for readability
3. **Price must always be the most visually prominent** element on product cards — bigger than the product name
4. **CTA button text** is always 16px, never smaller
5. **Line height minimum 1.5** for any body paragraph — cramped text kills trust
6. **Bold (700+) is reserved** for headings, prices, and CTA text only

---

## 4. Spacing System

Based on a 4px base unit. Everything is a multiple of 4.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Micro gaps, icon padding |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard padding, card inner spacing |
| `space-6` | 24px | Section element gaps |
| `space-8` | 32px | Card padding, large gaps |
| `space-12` | 48px | Section padding top/bottom |
| `space-16` | 64px | Major section breaks |
| `space-24` | 96px | Hero section spacing |

**Tailwind mapping:**
```
p-1=4px, p-2=8px, p-3=12px, p-4=16px, p-6=24px, p-8=32px, p-12=48px, p-16=64px, p-24=96px
```

---

## 5. Component Library

### 5.1 Buttons

**Primary Button (Main CTA)**
```
Background: #1B6B3A (Primary Green)
Text: #FFFFFF, 16px, weight 600
Padding: 14px 28px
Border radius: 10px
Width: Full width on mobile, auto on desktop
Min height: 52px (thumb friendly)
Hover: #145530 (darker green)
Active: scale(0.98) — satisfying press feel
Shadow: 0 4px 14px rgba(27, 107, 58, 0.3)
```

**Secondary Button**
```
Background: transparent
Border: 2px solid #1B6B3A
Text: #1B6B3A, 16px, weight 600
Padding: 12px 26px
Border radius: 10px
Hover: #E8F5EE background
```

**Urgency/Sale Button**
```
Background: #D4820A (Saffron Gold)
Text: #FFFFFF, 16px, weight 700
Same sizing as primary
Shadow: 0 4px 14px rgba(212, 130, 10, 0.3)
```

**Button Rules:**
- Primary green CTA is always the most dominant button on screen
- Never put two primary buttons next to each other
- Minimum touch target 52px height — finger friendly
- Always full width on mobile screens below 480px

---

### 5.2 Product Cards

```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border radius: 16px
Shadow: 0 2px 8px rgba(0,0,0,0.06)
Hover shadow: 0 8px 24px rgba(0,0,0,0.12)
Hover transform: translateY(-2px)
Padding: 12px
```

**Card Structure (top to bottom):**
1. Product image — aspect ratio 1:1, object-fit cover, border-radius 12px
2. Sale badge (if on sale) — top-left overlay on image
3. Product name — H3, 2 lines max, ellipsis overflow
4. Star rating (when available)
5. Price row — sale price (green, bold) + original price (strikethrough, gray)
6. "Cart Mein Daalo" button — full width, primary green

**Sale Badge:**
```
Background: #D4820A
Text: #FFFFFF, 11px, weight 700, uppercase
Padding: 4px 8px
Border radius: 6px
Position: absolute top-2 left-2
```

---

### 5.3 Trust Badges

Displayed in a horizontal row, always visible on homepage hero and product pages.

**Individual Badge:**
```
Icon: 20px, Primary Green
Text: 13px, weight 600, Dark Slate
Gap between icon and text: 6px
Background: #E8F5EE
Border radius: 8px
Padding: 10px 14px
```

**4 Badges:**
- 📦 Cash on Delivery
- 🚚 2–3 Din Delivery  
- 🔄 Easy Returns
- ✅ 100% Genuine

---

### 5.4 Sale Banner

Displayed at the very top of the page — above navigation.

```
Background: #D4820A (Saffron Gold)
Text: #FFFFFF
Height: 48px mobile / 52px desktop
Font size: 14px mobile / 16px desktop
Font weight: 600
Padding: 0 16px
```

**Contents:**
- Sale name left
- Countdown timer center (DD:HH:MM:SS) — monospace font for timer digits
- Coupon code right (if applicable)

**Timer digits style:**
```
Font: monospace
Background: rgba(0,0,0,0.2)
Padding: 2px 6px
Border radius: 4px
Letter spacing: 2px
```

---

### 5.5 Input Fields

```
Background: #FFFFFF
Border: 1.5px solid #E5E7EB
Border radius: 10px
Padding: 14px 16px
Font size: 16px (prevents iOS zoom on focus)
Color: #1F2937
Placeholder color: #9CA3AF
Focus border: 2px solid #1B6B3A
Focus shadow: 0 0 0 3px rgba(27, 107, 58, 0.1)
Error border: 2px solid #DC2626
Height: min 52px
Width: 100%
```

**Critical:** Font size 16px minimum on inputs — iOS will zoom in on anything below 16px, breaking the mobile experience.

---

### 5.6 Navigation Bar

```
Background: #FFFFFF
Border bottom: 1px solid #E5E7EB
Height: 60px mobile / 70px desktop
Position: sticky top-0
Z-index: 50
Shadow: 0 1px 4px rgba(0,0,0,0.08)
```

**Contents:**
- Logo left — Shahkar wordmark
- Cart icon right — with green badge showing item count
- Mobile: hamburger menu icon
- Cart badge: `#1B6B3A` background, white text, 18px circle

---

### 5.7 COD Badge (Critical Trust Element)

This badge must appear on:
- Homepage hero (above the fold)
- Every product page (near the CTA button)
- Checkout page (near the total)

```
Background: #E8F5EE
Border: 1.5px solid #1B6B3A
Border radius: 8px
Padding: 8px 14px
Icon: 💚 or lock icon
Text: "Cash on Delivery Available" — 14px, weight 600, #1B6B3A
```

---

## 6. Layout System

### 6.1 Grid

| Breakpoint | Columns | Gutter | Max Width |
|---|---|---|---|
| Mobile (< 640px) | 4 columns | 16px | 100% |
| Tablet (640–1024px) | 8 columns | 24px | 100% |
| Desktop (> 1024px) | 12 columns | 32px | 1280px centered |

**Product grid:**
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns

---

### 6.2 The Thumb Zone — Critical For Mobile

The most important rule for Pakistani mobile users: **Design for one-handed use.**

```
Safe thumb zone (right hand): bottom 60% of screen
Danger zone: top corners
Death zone: top center
```

**Apply this by:**
- CTA buttons always at bottom of viewport when possible
- "Add to Cart" and "Checkout" buttons anchored to bottom on mobile (sticky)
- Navigation cart icon top-right (reachable with right thumb stretch)
- Never put critical actions in top-left corner

---

### 6.3 Section Spacing Pattern

Every section follows this pattern:
```
padding-top: 48px mobile / 80px desktop
padding-bottom: 48px mobile / 80px desktop
padding-left/right: 16px mobile / 32px tablet / 0px desktop (max-width handles it)
```

---

## 7. Imagery Guidelines

### 7.1 Product Images
- Minimum resolution: 800x800px
- Aspect ratio: 1:1 (square) — consistent grid
- Background: White or very light gray (`#F9FAFB`)
- No busy backgrounds — product must be the hero
- Show all angles where possible — minimum 3 photos per product
- Show scale with hand/use context — Pakistani buyers want to see size

### 7.2 Lifestyle Images
- Show Pakistani homes/contexts — not Western aesthetics
- Warm, natural lighting — not studio cold
- Include people where possible — human face = trust
- Women 25–45 using products — matches target audience

### 7.3 What To Never Use
- Stock photos of Western women
- Images with English text baked in
- Dark, moody, luxury-feeling photography — this isn't that brand
- Blurry or low quality images — instant trust killer

---

## 8. Micro-Interactions

These small details build subconscious trust and make the site feel alive:

| Interaction | Behavior |
|---|---|
| Add to cart button | Brief scale pulse + cart count animates up |
| Cart icon | Bounces gently when item added |
| Product card hover | Lifts 2px + shadow deepens |
| CTA button hover | Darkens 10% + subtle scale(1.02) |
| Form focus | Green border glow appears |
| Form success | Green checkmark fades in |
| Form error | Red border + gentle shake animation |
| Page load | Skeleton screens — not blank white |
| Countdown timer | Each digit flips smoothly |
| Sale badge | Subtle pulse animation every 3 seconds |

**Rule:** All animations under 200ms. Nothing that delays or distracts. Micro-interactions confirm actions, not entertain.

---

## 9. Mobile-Specific Rules

These apply to screens below 640px ONLY:

1. **Sticky Add to Cart bar** — fixed at bottom of product page with price + button
2. **Full width buttons always** — never partial width on mobile
3. **Input font size minimum 16px** — prevents iOS auto-zoom
4. **Tap targets minimum 52px height** — nothing smaller is tappable with confidence
5. **Images lazy loaded** — above fold only loads immediately
6. **No hover states** — hover doesn't exist on touch. Use active states instead
7. **Bottom sheet for filters** — not sidebar
8. **Swipeable image gallery** on product page — not click arrows
9. **Sticky navbar** always visible — she should never hunt for navigation
10. **WhatsApp CTA** always accessible — floating button bottom-right on mobile

---

## 10. Trust Architecture

This is the most important section for conversion. Pakistani COD buyers need to feel safe at every step.

### Trust Layer 1 — First Impression (0–3 seconds)
- Professional logo visible immediately
- COD badge in hero above the fold
- Clean, uncluttered design (clutter = scam)
- Green color = subconscious safety signal
- Urdu/Roman Urdu text = "they understand me"

### Trust Layer 2 — Product Page
- Multiple product images
- Detailed description in simple Urdu
- Feature bullets (concrete, specific — not vague)
- "499 in stock" or stock indicator
- Return policy clearly stated
- COD badge next to order button
- WhatsApp contact visible

### Trust Layer 3 — Checkout
- Minimal form fields (name, phone, address only)
- No forced account creation
- Price breakdown transparent — no hidden charges
- COD badge prominently shown
- "Aapka data safe hai" reassurance
- Order total confirmed before submit

### Trust Layer 4 — Post Order
- Unique order number shown immediately (SHA-XXXXXX)
- "Humari team jald contact karegi" message
- WhatsApp number for queries
- Estimated delivery date shown

**The Trust Rule:** Every time she might hesitate — put a trust signal there. Hesitation = exit.

---

## 11. Copy Guidelines

### 11.1 Voice Examples

| ❌ Don't Write | ✅ Write Instead |
|---|---|
| "Add to Cart" | "Cart Mein Daalo" |
| "Proceed to Checkout" | "Order Karein" |
| "Out of Stock" | "Abhi Available Nahi" |
| "Free Delivery" | "Free Delivery 🎉" |
| "Order Confirmed" | "Shukriya! Aapka Order Place Ho Gaya ✅" |
| "Invalid phone number" | "Phone number check karein — digits missing lag rahe hain" |
| "Apply coupon" | "Discount Code Lagao" |
| "Search products" | "Kya dhundh rahe hain?" |

### 11.2 Error Messages
Always helpful, never technical. She shouldn't need to understand code to fix a form.

### 11.3 Empty States
- Empty cart: "Abhi tak kuch nahi daala? 🛒 Products dekhein →"
- No results: "Yeh product nahi mila — WhatsApp par poochh saktay hain"
- Order placed: Full celebration moment — make her feel good

---

## 12. Performance Rules

Performance is a design decision. A beautiful page that loads in 5 seconds is a failed design.

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5 seconds |
| Largest Contentful Paint | < 2.5 seconds |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |
| Page size (mobile) | < 500KB total |

**How to hit these:**
- Next.js Image component for all images — auto WebP, lazy loading
- No external scripts unless absolutely necessary
- Google Fonts loaded with `display=swap`
- No heavy animation libraries (Framer Motion only for micro interactions)
- Product images compressed to < 80KB each before upload
- Test every page on PageSpeed Insights before shipping

---

## 13. What This Site Must Never Be

Read this before every design session:

- ❌ A generic Chinese dropship website template
- ❌ Cluttered with too many colors, banners, popups
- ❌ Cold, corporate, English-first
- ❌ Slow on mobile
- ❌ Confusing — too many choices, too many steps
- ❌ Untrustworthy — missing COD signals, unclear pricing
- ❌ Fancy over functional — 3D, heavy animations, parallax
- ❌ Hard to buy from — complicated checkout
- ❌ Forgettable — no personality, no warmth

---

## 14. The One Question

Before shipping any screen, any component, any copy — ask:

> **"Agar woh baji pehli baar aaye, kya woh 10 seconds mein samjhay gi aur trust karegi?"**

If yes — ship it.  
If no — fix it.

---

*Shahkar.store — Har Desi Masle Ka Hal*  
*UI Context v1.0 — Built with intention, designed for conversion*
