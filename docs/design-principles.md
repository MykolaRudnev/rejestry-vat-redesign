# Design principles: notes from the course "AI and Design Systems"

Source: all 177 transcripts in `~/Downloads/bftj-aianddscourse/transcripts/`, plus the top-level files. Tags like `[91]` point to the transcript `91. <title>.txt`.

What the top-level files are:
- `lesson1.pdf` and `lesson3.pdf` are the same file: a tool-installation cheat sheet.
- `lesson2.htm` is a page of links to tools and resources.
- `PDF.txt` and `AI and Design Systems.txt` are only lists of lesson titles.

None of these five files has design content.

> **How to read this document.** The course is about *design systems + AI tooling*: tokens, documentation, keeping design and code in sync, MCP servers and agents. It says almost nothing about typography, grids, motion, or empty/error states. Each section says when coverage is thin. Where Saldo needs a decision on those topics, `docs/design-system.md` marks it as *craft decision (not from the course)*.

---

## 1. What a design system is and why it matters
- A DS is "the official story of how your organization designs and builds digital products" [14][164][165][167]. It is "critical UI infrastructure" [14], and it is living: it evolves with the product [91][165].
- Ingredients [15]:
  - UI standards (colors, typography);
  - three assets: a design library, a code library and documentation;
  - people and processes, which matter most.
- Value [16]:
  - one source of truth;
  - consistency and accessibility;
  - no rebuilding "the button for the 70th time";
  - cheaper rebrands.
- Without a DS "everything's a first draft" [16].
- What's hard [17]:
  - drift between design, code and docs;
  - inconsistent APIs and tokens;
  - nobody reads the docs;
  - governance.
- The central question is **"is it good?"**: visually, in UX and in code, and also for users [7][151]. Humans are the tastemakers [7].
- The DS gives AI "thoughtful constraints" so that AI "isn't just making a giant mess" [173]. AI on its own conjures "arbitrary materials" [3].
- Generated or third-party systems cause a **"lookalike problem"**: they lack your product's context. Deciding what a system must do is "a human endeavor" [90].
- **Context-based design systems.** Purpose and intent, not only aesthetics, cascade through every stage. "Flaws cascade, but beautiful context also cascades" [162][163]. The goal is "consistency, intent and value" [162].
- "Design is the rendering of intent" (Jared Spool, quoted in [164]).
- Not everything belongs in the core system. Product-specific compositions are **recipes** [91][163]. Keep solved problems in the core: "don't reinvent the checkbox" [167].

## 2. Rules: components, documentation, drift, audits
- **Check engine light** [92]:
  - small: inconsistent layer names and off-token colors;
  - medium: detached instances, hard-coded values, missing properties;
  - large: no semantic structure or metadata, no link to code. This "makes AI tools generate garbage".
- **Hard-coded values are the main defect.** They break theming and modes [97]. Map raw paddings and radii (8, 12 / 4, 6) to tokens [96]. Flag "magic numbers" such as a line-height of 20 or a min-height of 48 [134].
- **Variants and states belong together** in one component set [30]. Property values must be consistent across all variants [105].
- **Descriptions carry intent.** A component description states purpose, behavior, composition and usage [97][131]. Behavior that isn't written down can't be known, for example whether an accordion allows one open panel or many [155][163].
- **Names matter.** Name things by purpose, for example "bookmark button" rather than "Frame 22" [95][141][162]. Namespace CSS with the system name plus the element's purpose [162].
- **Design and code must stay aligned**, which "has become essential" in the AI era [32]. Catch drift upstream, before it travels "all the way back up the chain" [105].
- **Considerations file** (Story UI `considerations.md`) [155][163][167]:
  - It is the "last line of defense": do's and don'ts for generated UI.
  - Examples: no inline styles; no emojis as icons; grid vs flex rules; deprecated components.
  - Add a rule every time the AI repeats a mistake.
  - Docs are split into components, guidelines, patterns, tokens and governance.
- **DESIGN.md** (Google Stitch) [167]:
  - It is a lightweight visual and token reference, a "board book" next to a full system.
  - Markdown "isn't meant for structured data". Keep the tokens themselves in code or JSON, and use the Markdown as a glossary of where things live.
  - Risk: confusing a brand style guide with a design system.
- **"Design system cosplay"**: output that looks like the system but doesn't actually use it [167].
- **Build order** for a new system: icons, then badges, chips and avatars; buttons later, because they are among the most complex [155][162].
- **Assessments** are regular, like a yearly car inspection, and part of daily work. They are shared learning, not tick-boxes [99]. Run accessibility and lint first, then the parity check [128].
- Tools listed for assessment [98]: Design Lint, Stark, axe-core, Lighthouse, the Storybook a11y addon, Chromatic/Percy, ESLint/Stylelint.

## 3. Design tokens
- **Tiers** [31][33][91]:
  - **Core:** values shared across themes.
  - **Tier 1:** theme primitives (color ramps, typography).
  - **Tier 2:** semantic names. This tier enables multi-theming and dark mode.
  - **Tier 3:** component tokens, only "in case Tier 2 doesn't get that accomplished".
  - The tiers also apply to border width, radius, shadow and spacing [91].
  - The full MVP set covers color, typography, spacing, border, shadow and **animation** [140].
- Components consume semantic tokens, for example `ds-theme-button-color-background-default`, so swapping the token values re-themes everything without code changes [33]. Tokens live as JSON and become CSS custom properties (via Style Dictionary) [33].
- **Naming examples** [97][102][103]:
  - `color-border-utility-error`;
  - `color-content-utility-error`;
  - `color-content-knockout` (content placed on a dark or colored fill).
- **Missing-token workflow** [107–109]:
  1. Notice that a state is illegible.
  2. Add Tier-2 `knockout` content and border tokens for error, warning, success and info.
  3. Rebind the components to them.
  4. Update the code and the stories.
- **Refactor hard-coded values in steps** [163]:
  1. Find the raw hex values.
  2. Replace them with existing tokens where possible.
  3. Flag the rest.
  Don't try to do it in one shot.
- **Test mode** [162]: map a loud palette, such as all-pink, to the semantic tokens. Any component that doesn't change color isn't using the tokens.
- What the course is missing: real guidance on token naming conventions and on the DTCG structure. DTCG is only mentioned by name [167].

## 4. Color and palettes
- Utility ramps run from 100 to 900 for error, warning, info and success [107].
- Knockout content uses *lighter* steps. Knockout borders can be a bit darker, around step 400, because they don't need to be as legible as content [107].
- **Dimitri's calculated system** [165]:
  - Each brand intent sets only **hue and chroma in OKLCH**. Lightness is calculated from a target contrast.
  - Foreground, background and border pairs are APCA-checked, so they never become inaccessible.
  - It defines surface elevation steps.
  - Presets: light, dark, dimmed and high-contrast.
- Anti-patterns:
  - "5 million shades of gray" [165];
  - a background with no matching text color, which breaks contrast. The fix was to reuse the primary button [152];
  - AI getting text colors wrong [20].
- Coverage of palette aesthetics (harmony, how many accents) is **thin**.

## 5. Typography: thin coverage
- Typography is a Tier-1 primitive with Tier-2 typography tokens on top [91]. Hard-coded type is a defect [126].
- Be explicit with AI about sizes. Lee asked for "fonts no bigger than 20 pixels" after the AI produced 40px headings [162].
- AI theme swaps "butchered" typography [151][167].
- Make the Figma file AI-ready with a defined type scale and spacing system, and decide px vs rem [162].
- Dimitri's system has no type-scale tokens; a base-rem setting handles scaling for accessibility [165].
- There is **no guidance on type scales, pairing or hierarchy**.

## 6. Grid, layout, spacing: thin coverage
- Spacing tokens exist and raw paddings get mapped to them [91][96].
- An AI layout felt "smushed and cramped" in small cards, and switching to full-width content fixed legibility [80].
- Prompt layouts precisely, for example "fixed full-height left nav, content max-width 960", and add "do not break the layout", because AI tends to break it [162].
- A system needs default vertical and horizontal spacing rules. Without layout primitives the AI improvises, for example by putting content inside an accordion [155].
- Make small spacing fixes in a visual editor or by hand rather than re-prompting, which changes other things [155][158].
- Density can be relative to the parent instead of using fixed size tokens [165].

## 7. States
- Variants and states are shown together [30]. A text field has states none, error, success, disabled and inverted [97][103][106].
- Real bugs found by the course:
  - error and success styles never reached the input in code;
  - the inverted variant had no focus ring [105][106].
  Every state needs its own focus treatment.
- FigmaLint checks interactive states and recommends loading, disabled, icon and full-width props [95][154].
- A generated form came with loading, error and success versions [148]. Templates can be stress-tested in dense, sparse, no-results and filtered versions [155][162]. A progress bar needs value, min, max, indeterminate and buffering [165].
- Empty, error and loading *patterns* are **not discussed in depth**.

## 8. Micro-interactions and motion: essentially absent
- Animation is listed as a token category [140]. There is an `animations.md` docs file [167], and the Eddy audit found a missing scroll-trigger motion primitive [86].
- Demos: GSAP-animated SVG explainers that were "bouncy" [77][167], and a hover glow [20][151].
- There are **no motion principles** in the course.

## 9. Accessibility
- Accessibility is one of the course's principles: "accessible UI for everyone" [7]. Reusable components hand out accessibility "for free" [15].
- Check contrast by pairing background, foreground and content tokens [122], or by calculating contrast with APCA [165].
- Common audit findings [128]:
  - low-contrast disabled buttons;
  - touch targets under 24px (fixed to 32);
  - missing focus indicators;
  - ARIA misuse.
- Non-visual properties such as ARIA labels and alt text need a home too: "code-only props" [123][163].
- Use an accessibility subagent after generation [44][134][155][166]. Inclusive language matters too [166].

## 10. MCP and AI tools mentioned
| Tool | What it does | Source |
|---|---|---|
| Figma MCP (official, formerly Dev Mode) | Design↔code from a selection link. Now also writes to Figma (`use_figma`, `figma-generate-design`). Biased toward React and Tailwind. | [66][100–103][138][139][141] |
| Figma Console MCP (TJ) | Full read and write access to variables, components and descriptions via the Desktop Bridge plugin. Parity checks, batch variable tools, MCP Apps (token browser, health check), cloud mode. | [104–133] |
| FigmaLint | Figma plugin that scores "AI readiness", maps hard-coded values to tokens, checks states and accessibility, writes descriptions. | [94–97][153][154] |
| Storybook MCP | Component manifest plus docs and development toolsets. React only. Add its instructions to AGENTS.md. | [145–148][152][160] |
| Story UI | Generates stories and layouts from your real components. Uses a considerations file; has a voice canvas. | [142–144][155–158][161] |
| Design Systems Assistant MCP | A knowledge base of over 1,000 design system resources, used to validate components. | [110][111][135][163] |
| Company Docs MCP | Your own docs as a vector search. | [112][131] |
| A2UI (Google) | The agent emits a JSON "recipe" that your app renders with approved components. | [149] |
| Claude Design / Figma Make | High-fidelity prototyping that defaults to shadcn, React and Tailwind. Not a handoff tool. | [162][167] |
| Chrome DevTools MCP / Playwright | Screenshots and "self-healing" visual feedback loops. | [120][126][162][165] |

## 11. Working with AI agents on design
- Specialist subagents (code review, accessibility, QA, UX/UI) beat a single generalist, but an **orchestrator must resolve their conflicts** [44][166]. "The more you can put in code to say you physically cannot do this, the better" [166].
- Agents copy broken patterns and improvise when a pattern is missing. They need **coverage** (examples and composition rules) and **validation** (tests plus human review) [159].
- Without a system, output becomes "a page full of gradients" [162], and even with one it can be "milquetoast" [159]. AI only gets "inspired by" a brand: the result "looks intentional, but it isn't on brand" [77].
- Review loop: generate → screenshot or test → feed back → human sign-off [120][121][159]. Expect to land 60–90% of the way; fix the rest by hand [117][126][162]. "You don't need to use AI for everything" [109].
- Expect overreach: AI added variants nobody asked for [102][121]. Say exactly where things go [103].
- After a miss, ask "where did you get tripped up?" and save the answer as a durable rule in the considerations file or CLAUDE.md [165]. Keep CLAUDE.md-type files to about 400 lines [166].
- Git is the safety net: work on branches, read every diff, never commit AI output unreviewed [67][77][162].

---

## What Saldo takes from this
1. **Tokens first, in tiers.**
   - Tier 1: OKLCH primitives.
   - Tier 2: semantic roles (`surface`, `ink`, `accent`, status × `fill/soft/knockout/border`).
   - Tier 3: only when unavoidable.
   - The token set also covers type, spacing, radius, shadow and **motion**.
   - Light and dark are both modes of the Tier-2 layer.
2. **No hard-coded values in components.** A token-adoption check stands in for the "pink test mode": every color, radius and duration must come from a variable.
3. **One source of truth.** The tokens live in `globals.css` (code), and `docs/design-system.md` is the DESIGN.md-style glossary next to them. Intent and usage are written for every pattern.
4. **States are designed as variants, not afterthoughts.** Filled, empty, no-results, error and loading for the screen. Default, hover, focus, disabled, loading and error for each control, including focus on dark and on colored fills.
5. **Accessibility is built in.** AA contrast across token pairs, targets of at least 32px (44px on touch), visible focus, real ARIA.
6. **Recipes stay out of the core.** Register-specific compositions (period header, KSeF line, VAT summary) live in `components/register`. Primitives live in `components/ui`.
7. **Orchestrated review.** The design-lead subagent owns visual and UX quality and gives one review per screen against this document. The main agent owns function. Repeated mistakes become rules in `docs/design-system.md` → *Considerations*.
8. **Guard against lookalikes.** Plain shadcn defaults are treated as defects (the course's "milquetoast" and "lookalike" problem). Character comes from deliberate craft decisions, which are labelled as such.
