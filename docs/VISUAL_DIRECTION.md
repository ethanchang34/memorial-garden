# Visual direction (draft for review)

Status: **direction chosen (2026-11-10): B, layered paper garden**, with composable objects. Decisions are in DESIGN §7.0, §6.3, and §7.2; this file keeps the research and reasoning. Palette: **honeyed orchard**. Art source: **code-drawn SVG**, with packs or AI-assisted vectors for complex subjects.

DESIGN §7.0 already sets the goal: a quiet country churchyard at golden hour, painterly and smooth, never pixelated. This document tests that goal against real products and research and turns it into rules for the garden scene and the interface.

## 1. What other memorial sites do

Reviewed November 2026. Screenshots were taken locally for study and are not stored in the repo (they are other companies' copyrighted pages). Find a Grave, Legacy.com, and Everloved block automated browsers, so their rows come from general knowledge of the sites, not current screenshots; check them by hand before relying on details.

| Site                                            | What it does                                                                                                              | Take                                                   | Avoid                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| [ForeverMissed](https://www.forevermissed.com/) | Sky, clouds, and doves; spaced all-caps text; gold gradient button; asks for the person's name before explaining anything | A single clear first action                            | "Heaven" clichés, all-caps, shiny gold, form-first  |
| [MuchLoved](https://www.muchloved.com/)         | Stock photo of a person on a phone; thin all-caps headings; charity purple; an advertising-cookie banner over the content | Plain, warm wording ("your place to remember")         | Stock photos, ad tracking, banners over content     |
| Find a Grave                                    | Search-first database of real graves; visitors leave virtual flowers                                                      | Virtual flowers are an established, understood gesture | Database feel; graves as rows, not places           |
| Legacy.com, Everloved                           | Obituary and funeral-planning sites with memorial pages                                                                   | Clear structure for life story and photos              | Commerce next to grief (flowers, services for sale) |

**The gap:** every one of these is a document or a list. None makes the memorial a _place_ you would want to stay in. That is the garden's job, and the reason the scene matters more than any other screen.

## 2. Cozy and calm references

| Reference                                                 | Lesson for us                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [A Short Hike](https://ashorthike.com/)                   | Depth from a few **flat, layered silhouettes** in a tight warm palette, with a hand-lettered logo. Cheap to build as SVG, sharp at every size, and easy to re-light for time of day. Too cartoonish and outlined for grief; take the layering, not the line work.                                                                                                                                                                                                                                                                        |
| [Finch](https://finchcare.com/)                           | A self-care product can be warm and friendly: rounded type, soft clouds. But it is bright, saturated, and childlike. Take the friendliness, not the volume.                                                                                                                                                                                                                                                                                                                                                                              |
| [Stardew Valley](https://www.stardewvalley.net/)          | Cozy depth and a night sky with stars. Pixel art, which DESIGN §7.0 rules out.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [Spiritfarer](https://thunderlotusgames.com/spiritfarer/) | A "cozy management sim about dying" ([Red Bull interview](https://www.redbull.com/int-en/spiritfarer-developer-thunder-lotus-games-interview)): hand-drawn, warm, and sincere, built around small physical rituals of care such as hugging ([Game Developer](https://www.gamedeveloper.com/design/inside-the-thoughtful-design-of-thunder-lotus-i-spiritfarer-i-)). Proof that cozy and grief can coexist when the warmth is sincere and the rituals are tactile. Our equivalents: wiping the stone, lighting a candle, placing flowers. |

## 3. What makes something feel cozy

The game-design think tank Project Horseshoe defined coziness as **safety, abundance, and softness** ([Lostgarden write-up](https://lostgarden.com/2018/01/24/cozy-games/), [Game Developer](https://www.gamedeveloper.com/design/designing-for-coziness)). Their report lists concrete ingredients; here is how each applies to a memorial garden.

| Ingredient (paraphrased from the report)                      | In Memorial Garden                                                                                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Safety:** no danger, no impending loss                      | Weathering and fading are the only "loss" mechanics, so keep them gentle: moss is soft growth, never decay or dirt; a fading decoration lets petals fall slowly; no countdowns, red warnings, or "expiring soon" pressure (Tenet 1). |
| **Abundance:** needs are met; evidence of plenty              | A new memorial must not look empty or neglected: the garden itself is lush (grass, a branch, wildflowers) before anyone places anything.                                                                                             |
| **Softness:** gentle stimuli, low arousal                     | Warm, low-contrast palette; rounded shapes; slow, soft motion; no sudden sounds (sound stays off by default).                                                                                                                        |
| **Warm light of clear origin, softened**                      | Light comes from somewhere you can see (low sun, a candle, a lantern) and falls as dappled or diffused light with soft shadows. This is the time-of-day system's core.                                                               |
| **Natural, hand-made materials**                              | Stone, moss, wood, linen, paper, wax. Stationery-like interface surfaces (§7.0).                                                                                                                                                     |
| **Enclosure and intimate framing; partly hidden horizon**     | Each grave sits in a small nook: a hedge or wall behind, a branch overhead, the distance fading into haze. Never a wide, empty field or an endless sky.                                                                              |
| **Mundanity:** familiar beats fantastical                     | A real-feeling garden or churchyard, **not** heaven, clouds, or doves. This is the clearest break from ForeverMissed and its peers.                                                                                                  |
| **Protection and support:** a relaxed guardian signals safety | A small living presence: a cat asleep on the wall, a robin on the stone. Optional and ambient.                                                                                                                                       |
| **Refuge and contrast**                                       | Evening and rain can be cozy if the garden is the warm refuge: candles glowing in dusk blue, soft rain while the lantern stays lit.                                                                                                  |
| **No intrusive pop-ups**                                      | The report singles out pop-up notifications as breaking coziness. Matches DESIGN §6.17 (no pop-ups; one dismissible invite link).                                                                                                    |
| **Seasons**                                                   | Seasonal decorations and light are already planned (ROADMAP "Later"); they are a strong cozy signal.                                                                                                                                 |

**Calm technology** ([calmtech.com](https://calmtech.com/)): technology should need the smallest possible amount of attention and live in the periphery, moving to the center only when needed. For us: the scene itself shows state (moss shows how long since the stone was tended, decorations show who visited) instead of badges, counters, or alerts.

## 4. Readability for the people who will visit

Many visitors will be older relatives. Nielsen Norman Group found users aged 65 and older are 43% slower using websites than users aged 21–55, and that small text and small targets are common problems ([NN/g](https://www.nngroup.com/articles/usability-seniors-improvements/), [NN/g on legibility](https://www.nngroup.com/articles/legibility-readability-comprehension/)). Rules:

- Memorial content (bio, notes) at **18px** body text, 1.6 line height, at most about 65 characters per line. Interface text stays at 16px minimum.
- Handwriting fonts (e.g. Caveat) only for short decorative text such as a note's signature, never for the note body.
- Keep the 44px touch targets and WCAG AA contrast already in place; avoid dropdowns and sliders for important choices.
- One primary action per screen; plain words, sentence case (no all-caps headings).

## 5. Candidate directions

All three keep the existing palette and tokens as a starting point and differ mainly in how the **garden scene** is drawn, which is the expensive, hard-to-change part (DESIGN §4 slot templates are tied to the art).

### A. Painted golden hour

Soft, hand-painted storybook scenes (watercolor or gouache feel), warm amber light, dappled shadows. Closest to DESIGN §7.0 as written.

- Strongest emotional impact and most "cozy game" feeling.
- Needs painted art: a licensed painterly pack or a commissioned illustrator. Hardest to keep consistent across many stone styles, decorations, and four times of day.
- Raster backgrounds (WebP/AVIF) plus SVG props; heavier downloads.

### B. Layered paper garden

The scene is built from a few flat, layered shapes (hedge, wall, branch, stone, ground), each with a subtle paper or watercolor grain and soft gradient shading; no outlines. Light is a set of color layers, so the four times of day are palette changes, not new art.

- Cheapest to produce and extend (new stones and decorations are SVG shapes); crisp at every size; light and fast.
- Gentle parallax and motion are easy (Motion/Rive).
- Risk: can look flat or "graphic" if the textures and light are not done well.

### C. Pressed-flower stationery

The interface leads: botanical line drawings and watercolor washes on paper, with the garden shown as a framed illustration card rather than a full scene.

- Elegant, calm, very readable; suits an older audience.
- Least "place-like"; weaker on the cozy-game feeling that sets us apart.

### Recommendation

**B for the scene, with A's lighting and C's stationery for the interface.** Build the garden from layered SVG shapes with paper grain and painterly gradient light (dappled sun, candle glow), and keep notes, dialogs, and cards in the stationery style already started in the UI kit. It delivers the cozy, place-like feeling at a cost a solo project can sustain, and it fits the time-of-day system and slot templates. Painted backgrounds (A) can be layered in later for premium scenes.

## 6. Avoid list

- Heaven imagery: clouds, doves, light rays, angels.
- Stock photos of people.
- All-caps or thin, spaced-out headings.
- Shiny gold gradients, glossy buttons.
- Pop-ups, banners over content, ad trackers.
- Red or urgent states for anything time-based.
- Pixel art, neon, harsh black, high-contrast saturated color.
- Empty-looking new memorials.

## Sketches

Rough sketches of A, B, and C live at `/dev/directions` (dev and test builds only): the same garden in each style, a companion on/off switch, and B at all four times of day. CI attaches them as screenshots (`ui-screenshots` artifact). A imitates painting with SVG filters; real A art would be hand-painted.

## Companion (owner's direction)

A small ambient companion (e.g. a sleeping cat or a robin) is liked. Proposal: an optional coin purchase, permanent for that memorial, bought by the owner or caretakers (like premium stone styles, DESIGN §6.10), so visitors can't add one without the family. Keep free ambient life (birds, a butterfly) in every garden so unpaid gardens still feel alive. Record in DESIGN when the M4 coin catalog is designed.

## Decision

- **Direction B, layered paper garden.** Painted (A) is ruled out. Stationery (C) is not used for the scene; its paper feel stays in the interface (notes, dialogs, cards), as already started in the UI kit.
- **Composable objects:** objects with attachment points and parts that snap into them (DESIGN §6.3, §7.0).
- **Art source:** code-drawn SVG for the garden and most decorations, proven by the still life at `/dev/art` (form shading, rim light, contact shadows, depth of field, seeded variation, grain, and animation). Animals and figures come from a licensed vector pack or AI-assisted art converted to vectors. No illustrator.
- **Palette:** honeyed orchard (§ Color study). **Time of day:** computed at page load and blended between keyframes; a refresh updates it.
- Moss only on and around the memorial stone.
- Memorial body text starts at 18px (a token; easy to change).

## Color study

The sketch palette was a quick tint of the UI tokens. A proper study compares several complete palettes on the same scene at golden hour and evening at `/dev/palettes`, captured in CI's `ui-screenshots` artifact. Once one is picked, it becomes the scene palette for all four times of day, and the UI tokens are adjusted to harmonize with it.

## Next steps

1. Build the slot and object system, starting from the still life's vase, flowers, and candle.
2. Derive morning and day keyframes for honeyed orchard; blend by local time at page load; adjust UI tokens to harmonize.
3. Refresh the home page hero to match.
4. Find a licensed vector pack or AI-assisted route for the companion animals.
