# Phase 9: Micro-Interactions + Animation Polish - Research

**Researched:** 2026-04-16
**Domain:** React UI Animation with framer-motion
**Confidence:** HIGH

## Summary

Phase 9 adds final animation polish to the UI/UX overhaul, focusing on high-value micro-interactions that make the interface feel responsive and premium. The core library is **framer-motion** (now branded as **Motion**), lazy-loaded to minimize bundle impact. This phase prioritizes performance (60fps target), accessibility (prefers-reduced-motion support), and restraint (subtle, functional animations only).

**Key findings:**
1. framer-motion has rebranded to "Motion" — both npm packages coexist, but new projects should use `motion` with imports from `motion/react` (this project currently uses `framer-motion@^12.38.0` already installed)
2. LazyMotion + `m` component reduces bundle from 34KB to 4.6KB initial render, with features loaded on demand
3. GPU-accelerated properties (x, y, scale, opacity) are critical — avoid width/height/top/left to prevent layout thrashing
4. Radix Dialog/Sheet primitives already provide basic animations via `data-[state=open]` CSS — we enhance, not replace
5. CSS-only fallbacks are viable for button hover/card lift using transform + opacity + pseudo-element shadows

**Primary recommendation:** Use LazyMotion with domAnimation features (15KB), lazy-load on routes with heavy animations (modals, notification center), stick to GPU-composited properties, and provide CSS-only fallback patterns for critical interactions.

## Standard Stack

### Core Animation Library

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.38.0 (already installed) | Complex UI animations | Industry standard for React animations (50KB gzipped full, 4.6KB with LazyMotion). Declarative API fits React paradigm. Hardware-accelerated via WAAPI. React 18/19 compatible. [npm: framer-motion](https://www.npmjs.com/package/framer-motion) |

**Note:** framer-motion rebranded to "Motion" in late 2024. Both packages maintained. New projects use `motion/react`, but existing `framer-motion` continues receiving updates. Migration not urgent.

### Supporting Libraries (Already Installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-countup | ^6.5.3 | Number animations for metrics | Dashboard stat cards, animated counters (already integrated in Phase 8) |
| Radix Dialog/Sheet | via shadcn/ui | Modal/drawer animations | Already provides basic fade/slide animations via Radix data attributes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion | Auto-Animate | Auto-Animate is 2KB, DOM-based, simpler API. But: less control, no spring physics, no orchestration (variants/stagger). Use if animations are trivial. |
| framer-motion | CSS-only | Zero bundle cost, 60fps guaranteed. But: no imperative control, no stagger, no gesture detection. Use for button hover, card lift (simple transforms). |
| framer-motion | GSAP | More powerful, battle-tested. But: imperative API clashes with React, commercial license required for business use, 30-40KB. framer-motion is React-first. |

**Installation (if needed — already installed):**

```bash
# Already in package.json: framer-motion@^12.38.0
# No action required
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── animated/                # Animated component wrappers
│   │   ├── AnimatedButton.tsx   # motion.button with hover/tap
│   │   ├── AnimatedCard.tsx     # motion.div with hover lift
│   │   └── AnimatedList.tsx     # AnimatePresence + stagger
│   ├── ui/                      # Existing shadcn primitives
│   │   ├── button.tsx           # Enhance with data-motion attr
│   │   ├── dialog.tsx           # Add AnimatePresence wrapper
│   │   └── sheet.tsx            # Already has slide animations
│   └── ...
├── lib/
│   ├── motion-config.ts         # Shared transition presets
│   └── use-reduced-motion.ts    # Accessibility hook
└── index.css                    # prefers-reduced-motion global
```

**Key principle:** Don't rewrite existing components. Wrap or enhance with `data-motion` attributes for progressive enhancement.

### Pattern 1: Lazy-Loading framer-motion (Bundle Optimization)

**What:** Use LazyMotion + `m` component to defer animation features until needed, reducing initial bundle.

**When to use:** All framer-motion usage. Initial bundle cost drops from 34KB to 4.6KB.

**Example:**

```typescript
// lib/motion-features.ts
import { domAnimation } from 'framer-motion';
export default domAnimation; // 15KB — animations, variants, gestures

// Component usage
import { LazyMotion, m } from 'framer-motion';
import loadFeatures from '@/lib/motion-features';

export function AnimatedButton({ children, ...props }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {children}
      </m.button>
    </LazyMotion>
  );
}
```

**Source:** [Motion.dev: Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size)

### Pattern 2: GPU-Accelerated Animations (Performance)

**What:** Only animate transform (x, y, scale, rotate) and opacity. Avoid layout-triggering properties.

**When to use:** All animations. This is the performance tier list for 60fps.

**Bad (layout thrashing):**

```typescript
// DON'T: Triggers layout recalculation on every frame
<motion.div animate={{ width: 200, top: 100 }} />
```

**Good (GPU-composited):**

```typescript
// DO: Uses compositor thread, no layout recalc
<motion.div animate={{ x: 100, scale: 1.05, opacity: 1 }} />
```

**Property tiers:**
- **Tier 1 (60fps):** x, y, scale, rotate, opacity, skew
- **Tier 2 (30-50fps):** backgroundColor, color, filter
- **Tier 3 (layout thrashing):** width, height, top, left, margin, padding

**Source:** [DEV: Framer Motion Performance Patterns](https://dev.to/whoffagents/framer-motion-animations-that-dont-kill-performance-patterns-and-pitfalls-5cki)

### Pattern 3: Accessible Animations (prefers-reduced-motion)

**What:** Disable all motion for users who request reduced motion.

**When to use:** Every animation. WCAG AAA compliance.

**Global CSS approach (already exists in index.css):**

```css
/* src/index.css — already present, extend for framer-motion */
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer,
  [class*="animate-"] {
    animation: none !important;
    transition: none !important;
  }
}
```

**framer-motion hook approach:**

```typescript
// lib/use-reduced-motion.ts
import { useReducedMotion } from 'framer-motion';

export function AnimatedCard({ children }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { y: -2, scale: 1.01 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
```

**MotionConfig provider approach (recommended):**

```typescript
// App.tsx or layout wrapper
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  {/* All motion components respect prefers-reduced-motion */}
  <App />
</MotionConfig>
```

**Source:** [Motion.dev: Accessibility](https://motion.dev/docs/react-accessibility)

### Pattern 4: Modal/Dialog Entrance Animations

**What:** Scale-in + fade for dialog entrance, with AnimatePresence for exit.

**When to use:** Dialog, Sheet, Popover components.

**Example (enhancing existing shadcn Dialog):**

```typescript
// components/ui/dialog.tsx — enhance DialogContent
import { motion, AnimatePresence } from 'framer-motion';

export const DialogContent = React.forwardRef<...>(({ children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <AnimatePresence>
      <DialogPrimitive.Content
        asChild
        ref={ref}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatePresence>
  </DialogPortal>
));
```

**Note:** Radix Dialog already animates via `data-[state=open]`. This pattern replaces CSS animation with framer-motion for consistent orchestration.

**Source:** [Medium: Modal Transition Animation with Framer Motion](https://medium.com/@joeysuberu/modal-transition-animation-made-with-react-and-framer-motion-6dd2de36e996)

### Pattern 5: Staggered List Animations (Notifications)

**What:** Delay each child element by a fixed amount for cascading entrance.

**When to use:** Notification list, dashboard stat cards on mount, data table rows (sparingly).

**Example:**

```typescript
// components/NotificationBell.tsx — enhance notification list
import { motion, AnimatePresence } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay per child
      delayChildren: 0.1,    // 100ms before first child
    },
  },
};

const item = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0 },
};

export function NotificationList({ items }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {items.map((notif) => (
        <motion.div key={notif.id} variants={item}>
          {/* Notification content */}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Source:** [Motion.dev: stagger](https://motion.dev/docs/stagger)

### Pattern 6: Button Hover/Click Feedback

**What:** Subtle scale (1.02) + shadow lift on hover, scale down (0.98) on click.

**When to use:** Primary/secondary buttons, interactive cards.

**framer-motion approach:**

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="button"
>
  Click me
</motion.button>
```

**CSS-only fallback (lighter, works without framer-motion):**

```css
/* components/ui/button.tsx — add to buttonVariants base classes */
.button {
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}

.button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.button:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
  .button:hover,
  .button:active {
    transform: none;
  }
}
```

**Source:** [CSS-Zone: CSS Animations Performance 2026](https://css-zone.com/blog/css-animations-performance)

### Pattern 7: Card Hover Lift

**What:** Lift card slightly on hover using translateY + shadow transition.

**When to use:** Role cards, submission cards, stat cards.

**CSS-only approach (recommended for cards):**

```css
/* Pseudo-element shadow technique — 60fps, no layout thrashing */
.card {
  position: relative;
  transition: transform 0.15s ease-out;
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  opacity: 0;
  transition: opacity 0.15s ease-out;
  z-index: -1;
  pointer-events: none;
}

.card:hover {
  transform: translateY(-2px);
}

.card:hover::after {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card::after {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
  .card:hover::after {
    opacity: 0;
  }
}
```

**Why pseudo-element for shadow?** Animating box-shadow directly causes expensive repaints (148ms paint time). Animating opacity of a pseudo-element with box-shadow takes only 51ms.

**Source:** [Tobias Ahlin: Animate box-shadow with performance](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)

### Anti-Patterns to Avoid

- **Over-animating:** Don't animate every element. Power users find constant motion annoying. Target high-value interactions only (buttons, modals, notifications).
- **Long durations:** Keep animations under 200ms. Anything over 300ms feels sluggish. Users perceive <100ms as instant.
- **Layout animations on large datasets:** Don't stagger 100+ table rows. Limit stagger to <10 items or use pagination.
- **will-change abuse:** Don't set `will-change: transform` globally. Apply only on :hover/:focus, remove after interaction. Overuse causes memory bloat.
- **Animating during scroll:** Avoid parallax/scroll-triggered animations unless using IntersectionObserver. Scroll listeners cause jank.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring physics | Custom easing curves with cubic-bezier | framer-motion springs (`type: 'spring'`) | Natural-feeling motion with realistic damping, stiffness, mass. Manually tuning cubic-bezier takes hours; springs "just work." |
| Staggered animations | Manual setTimeout chains | framer-motion variants with `staggerChildren` | Declarative, cleanup-safe, supports AnimatePresence. setTimeout chains leak on unmount. |
| Exit animations | CSS transition on display:none | AnimatePresence with exit prop | CSS can't animate display/mount changes. AnimatePresence keeps element in DOM during exit animation. |
| Gesture detection | Custom mouse/touch event handlers | framer-motion whileHover/whileTap/whileDrag | Cross-device, passive listeners, automatic cleanup. Touch detection is hard (300ms tap delay, pointer cancel events). |
| Reduced motion detection | Manual window.matchMedia | framer-motion useReducedMotion hook or MotionConfig | React-friendly, SSR-safe, auto-updates on preference change. matchMedia requires cleanup, doesn't trigger re-render. |

**Key insight:** Animation orchestration (sequences, stagger, exit) and gesture handling (hover, tap, drag) are deceptively complex. framer-motion solves edge cases (React StrictMode double-invoke, touch vs mouse, cleanup on unmount) that take weeks to debug manually.

## Common Pitfalls

### Pitfall 1: Animating Non-GPU Properties

**What goes wrong:** Animating width, height, top, left, margin, or padding triggers layout recalculation on every frame (60 times per second), causing jank and dropped frames.

**Why it happens:** These properties affect document flow. Browser must recalculate all descendant positions.

**How to avoid:** Only animate x, y, scale, rotate, opacity. Use transform: translateX() instead of left.

**Warning signs:** Chrome DevTools Performance tab shows purple "Layout" blocks during animation. Frame rate drops below 50fps.

**Example:**

```typescript
// BAD — 15fps, layout thrashing
<motion.div animate={{ width: 200, height: 100 }} />

// GOOD — 60fps, GPU-composited
<motion.div animate={{ scale: 1.5 }} />
```

**Source:** [StudyRaid: Leveraging GPU acceleration](https://app.studyraid.com/en/read/7850/206067/leveraging-gpu-acceleration)

### Pitfall 2: Missing AnimatePresence for Exit Animations

**What goes wrong:** Component disappears instantly instead of animating out. exit prop on motion components has no effect.

**Why it happens:** React removes component from DOM immediately on unmount. framer-motion can't animate an element that's not in the DOM.

**How to avoid:** Wrap conditionally rendered motion components in AnimatePresence with a unique key.

**Warning signs:** Entrance animations work, but exit animations don't.

**Example:**

```typescript
// BAD — no exit animation
{isOpen && <motion.div exit={{ opacity: 0 }} />}

// GOOD — exit animates before unmount
<AnimatePresence>
  {isOpen && <motion.div key="modal" exit={{ opacity: 0 }} />}
</AnimatePresence>
```

**Source:** [Motion.dev: AnimatePresence](https://motion.dev/docs/react-animate-presence)

### Pitfall 3: will-change Overuse

**What goes wrong:** Memory usage spikes, scrolling becomes janky, animations stutter.

**Why it happens:** will-change tells the browser to prepare a layer for GPU compositing. Each layer costs memory (~4MB per element on high-DPI screens). Applying to 100+ elements exhausts GPU memory.

**How to avoid:** Only apply will-change on :hover or :focus. Remove after interaction ends. Never apply globally.

**Warning signs:** DevTools Memory tab shows high GPU memory. Animations stutter on low-end devices.

**Example:**

```css
/* BAD — always active, memory leak */
.card {
  will-change: transform;
}

/* GOOD — only during interaction */
.card:hover {
  will-change: transform;
}
```

**Best practice:** framer-motion handles this automatically. Only set will-change manually for CSS-only animations, and only on hover.

**Source:** [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) | [LogRocket: When to use will-change](https://blog.logrocket.com/when-how-use-css-will-change/)

### Pitfall 4: No Cleanup in useEffect with Animations

**What goes wrong:** Animations continue running after component unmounts, causing memory leaks and React warnings ("Can't perform state update on unmounted component").

**Why it happens:** setTimeout, setInterval, or animation loops don't stop when component unmounts unless explicitly canceled.

**How to avoid:** Return cleanup function from useEffect. framer-motion's useAnimate hook auto-cleans.

**Warning signs:** Console warnings about unmounted components. Memory usage grows over time.

**Example:**

```typescript
// BAD — no cleanup
useEffect(() => {
  const timer = setTimeout(() => setAnimate(true), 1000);
}, []);

// GOOD — cleanup on unmount
useEffect(() => {
  const timer = setTimeout(() => setAnimate(true), 1000);
  return () => clearTimeout(timer);
}, []);

// BEST — framer-motion useAnimate (auto-cleanup)
import { useAnimate } from 'framer-motion';

function Component() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(scope.current, { opacity: 1 }); // Auto-canceled on unmount
  }, []);
}
```

**Source:** [React Docs: useEffect](https://react.dev/reference/react/useEffect) | [Motion.dev: useAnimate](https://motion.dev/docs/react-use-animate)

### Pitfall 5: React StrictMode Double-Invoke Issues

**What goes wrong:** Animations run twice in development, causing janky double-entrance effects or layout jumps.

**Why it happens:** React 18 StrictMode double-invokes effects in dev to surface missing cleanup logic. If animation starts in useEffect without cleanup, it runs twice.

**How to avoid:** Use useRef flag for one-shot animations, or rely on framer-motion's declarative API (initial/animate props) which handles StrictMode correctly.

**Warning signs:** Animations look correct in production but glitchy in dev.

**Example:**

```typescript
// BAD — double-animates in StrictMode
useEffect(() => {
  animate('.box', { x: 100 });
}, []);

// GOOD — useRef flag prevents double-invoke
const hasAnimated = useRef(false);

useEffect(() => {
  if (hasAnimated.current) return;
  hasAnimated.current = true;
  animate('.box', { x: 100 });
}, []);

// BEST — declarative API, StrictMode-safe
<motion.div initial={{ x: 0 }} animate={{ x: 100 }} />
```

**Note:** Recent Motion releases (March 2026) fixed opacity/layout issues in StrictMode. Update to latest version if encountering bugs.

**Source:** [React: StrictMode 2026](https://javascript.plainenglish.io/react-strict-mode-explained-for-2026-5fca1c3fa786) | [Motion Changelog](https://motion.dev/changelog)

### Pitfall 6: Forgetting prefers-reduced-motion

**What goes wrong:** Users with vestibular disorders experience motion sickness. Accessibility audit fails.

**Why it happens:** Easy to forget. Not obvious in dev environment.

**How to avoid:** Use MotionConfig with reducedMotion="user" at app root, or test with emulation in DevTools.

**Warning signs:** axe-core reports violations. Users report discomfort.

**Example:**

```typescript
// Add to App.tsx or main layout
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

**Test:** Chrome DevTools > Rendering > Emulate CSS media feature: prefers-reduced-motion: reduce

**Source:** [Motion.dev: Accessibility](https://motion.dev/docs/react-accessibility)

## Code Examples

Verified patterns from official sources:

### Button Hover + Tap (framer-motion)

```typescript
// components/animated/AnimatedButton.tsx
import { LazyMotion, m } from 'framer-motion';
import loadFeatures from '@/lib/motion-features';

export function AnimatedButton({ children, ...props }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="button-base-class"
        {...props}
      >
        {children}
      </m.button>
    </LazyMotion>
  );
}
```

**Source:** [Motion.dev: Animation examples](https://motion.dev/examples)

### Modal Scale-In Entrance (AnimatePresence)

```typescript
// components/ui/dialog.tsx — enhance existing DialogContent
import { motion, AnimatePresence } from 'framer-motion';

export function AnimatedDialog({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Root open={open} onOpenChange={onClose}>
          <DialogOverlay />
          <DialogPrimitive.Content asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
```

**Source:** [DhiWise: Framer Motion Modal](https://www.dhiwise.com/post/framer-motion-modal-a-guide-to-animated-react-modal)

### Staggered List (Notifications)

```typescript
// components/NotificationBell.tsx — enhance notification list
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export function NotificationList({ items }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {items.map((notif) => (
        <motion.div key={notif.id} variants={item}>
          {/* Notification content */}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Source:** [Medium: Staggered Animations](https://medium.com/@onifkay/creating-staggered-animations-with-framer-motion-0e7dc90eae33)

### Card Hover Lift (CSS-only fallback)

```css
/* components/custom/StatCardV2.tsx or card.tsx */
.card-hover {
  position: relative;
  transition: transform 0.15s ease-out;
}

.card-hover::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  opacity: 0;
  transition: opacity 0.15s ease-out;
  z-index: -1;
  pointer-events: none;
}

.card-hover:hover {
  transform: translateY(-2px);
}

.card-hover:hover::after {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .card-hover,
  .card-hover::after {
    transition: none !important;
  }
  .card-hover:hover {
    transform: none;
  }
}
```

**Source:** [Tobias Ahlin: Animate box-shadow](https://tobiasahlin.com/blog/how-to-animate-box-shadow/)

### Global Motion Config (Accessibility)

```typescript
// App.tsx or main layout
import { MotionConfig } from 'framer-motion';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      {/* All motion components respect prefers-reduced-motion */}
      <Routes />
    </MotionConfig>
  );
}
```

**Source:** [Motion.dev: Accessibility](https://motion.dev/docs/react-accessibility)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion library | Motion library (motion/react) | Late 2024 | Package renamed. Both maintained. New projects use motion/react. Existing framer-motion projects can continue. Migration guide available. |
| GSAP for React animations | framer-motion/Motion | 2020-2023 | React ecosystem shifted to declarative animation libraries. GSAP still viable for complex timelines, but framer-motion is React-first. |
| CSS transitions for all interactions | Hybrid: CSS for simple, framer-motion for complex | 2022-present | Performance budget awareness. CSS-only for button hover, framer-motion for orchestrated sequences. |
| box-shadow animation | Pseudo-element opacity animation | 2018-present | Direct box-shadow animation causes 148ms paint. Pseudo-element with opacity reduces to 51ms. |
| will-change everywhere | will-change only on :hover/:focus | 2021-present | Overuse causes memory bloat. Apply sparingly, remove after interaction. |

**Deprecated/outdated:**

- **react-spring:** Still maintained, but framer-motion has surpassed it in ecosystem adoption (framer-motion: 3M+ weekly downloads, react-spring: 600K).
- **Framer Motion v9 and below:** v10+ required for React 18 concurrent mode. v12 adds React 19 support.
- **Manual matchMedia for reduced motion:** useReducedMotion hook is SSR-safe and auto-updates.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected (Phase 9 is UI polish) |
| Config file | N/A — visual testing required |
| Quick run command | Manual visual inspection |
| Full suite command | Manual accessibility audit (axe-core, Lighthouse) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-18 | Button hover/click scale + shadow lift | manual (visual) | Chrome DevTools: Rendering > Frame rate overlay | N/A |
| FR-18 | Modal/dialog scale-in entrance | manual (visual) | Open dialog, verify smooth scale | N/A |
| FR-18 | Card hover lift (translateY -2px) | manual (visual) | Hover stat card, verify lift | N/A |
| FR-18 | Notification slideout with stagger | manual (visual) | Open NotificationBell, verify stagger | N/A |
| NFR-05 | Animations run at 60fps | manual (performance) | Chrome DevTools: Performance > Record during animation | N/A |
| NFR-05 | No layout thrashing | manual (performance) | Performance tab: zero purple "Layout" blocks | N/A |
| NFR-02 | prefers-reduced-motion disables motion | manual (accessibility) | DevTools Rendering > Emulate reduced motion | N/A |

**Note:** Animation testing is inherently visual and performance-based. No unit tests needed. Focus on:
1. Visual correctness (does it look good?)
2. Performance (60fps in DevTools)
3. Accessibility (reduced motion works)

### Sampling Rate

- **Per task commit:** Visual inspection of changed animations
- **Per wave merge:** Full animation pass (all buttons, modals, cards)
- **Phase gate:** Performance audit (DevTools), accessibility audit (axe-core)

### Wave 0 Gaps

None. Animation testing is manual/visual by nature. No automated test infrastructure needed for Phase 9.

## Open Questions

1. **React Compiler compatibility with framer-motion**
   - What we know: framer-motion v10+ supports React 18/19. React Compiler's auto-memoization works with modern animation libraries.
   - What's unclear: No explicit React Compiler compatibility statement in docs. framer-motion GitHub has no open issues about Compiler.
   - Recommendation: Proceed with caution. If Compiler is enabled in future, watch for animation re-render issues. CSS-only fallbacks are ready.

2. **Performance on low-end devices (2-core mobile)**
   - What we know: GPU-composited properties (x, y, scale, opacity) run at 60fps on modern devices. CSS-only animations are safer.
   - What's unclear: No testing on budget Android (<$200 phones). Stagger with 10+ items may drop frames.
   - Recommendation: Limit stagger to <10 items. Provide CSS-only fallbacks for critical interactions (button hover). Test on slow devices if accessible.

3. **Motion library migration timing**
   - What we know: Both framer-motion and motion npm packages maintained. Migration guide exists.
   - What's unclear: When will framer-motion be deprecated?
   - Recommendation: Stay on framer-motion for now. Monitor motiondivision/motion GitHub for deprecation announcements. Migration is non-urgent (both packages receive updates).

## Sources

### Primary (HIGH confidence)

- [Motion.dev: Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size) — LazyMotion, domAnimation vs domMax
- [Motion.dev: Accessibility](https://motion.dev/docs/react-accessibility) — prefers-reduced-motion, useReducedMotion
- [Motion.dev: stagger](https://motion.dev/docs/stagger) — staggerChildren, delayChildren
- [framer-motion npm](https://www.npmjs.com/package/framer-motion) — v12.38.0, React 18/19 compatibility
- [Motion GitHub](https://github.com/motiondivision/motion) — Official repository, changelog, issues
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — Best practices, memory implications

### Secondary (MEDIUM confidence)

- [DEV: Framer Motion Performance Patterns](https://dev.to/whoffagents/framer-motion-animations-that-dont-kill-performance-patterns-and-pitfalls-5cki) — GPU properties, layout thrashing
- [Medium: Modal Transition Animation](https://medium.com/@joeysuberu/modal-transition-animation-made-with-react-and-framer-motion-6dd2de36e996) — AnimatePresence, scale-in patterns
- [Medium: Staggered Animations](https://medium.com/@onifkay/creating-staggered-animations-with-framer-motion-0e7dc90eae33) — Variants, staggerChildren examples
- [Tobias Ahlin: Animate box-shadow](https://tobiasahlin.com/blog/how-to-animate-box-shadow/) — Pseudo-element technique, performance comparison
- [LogRocket: When to use will-change](https://blog.logrocket.com/when-how-use-css-will-change/) — Best practices, memory usage
- [CSS-Zone: CSS Animations Performance 2026](https://css-zone.com/blog/css-animations-performance) — GPU properties, 60fps techniques
- [Inhaq: Framer Motion Complete Guide 2026](https://inhaq.com/blog/framer-motion-complete-guide-react-nextjs-developers) — React 19 compatibility, modern patterns

### Tertiary (LOW confidence)

- [TestMU: CSS Button Hover Effects 2026](https://www.testmuai.com/blog/best-css-button-hover-effects/) — CSS-only button patterns (no framework-specific info)
- [Ripplix: UI Animation Trends 2026](https://www.ripplix.com/blog/principles-of-animation-ui-design) — General animation principles (no technical depth)

## Metadata

**Confidence breakdown:**

- **Standard stack:** HIGH — framer-motion v12.38.0 already installed, official docs verified, React 18.3.1 compatibility confirmed
- **Architecture patterns:** HIGH — LazyMotion, GPU properties, AnimatePresence patterns verified from official Motion.dev docs
- **Pitfalls:** HIGH — Layout thrashing, will-change overuse, AnimatePresence requirement verified from MDN and community best practices
- **Performance:** MEDIUM — 60fps claims verified for GPU properties, but low-end device testing not available
- **React Compiler compatibility:** LOW — No explicit statement in docs, inferred from React 19 support

**Research date:** 2026-04-16

**Valid until:** 30 days (framer-motion is stable, but watch for React Compiler announcements)
