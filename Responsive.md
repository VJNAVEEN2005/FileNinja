---
name: mobile-frontend-design
description: Design and build production-grade, mobile-first frontend interfaces with exceptional UX for small screens. Use this skill whenever the user asks to build a mobile view, mobile layout, responsive design, mobile UI, phone-friendly interface, or when they want their website or app to look great on phones and tablets. Also trigger when the user mentions "mobile version", "responsive", "looks bad on phone", "fix mobile layout", or wants to make any UI work well on small screens. Always use this skill in combination with frontend-design for any mobile-related UI work.
---

# Mobile-First Frontend Design Skill

This skill produces **production-grade mobile UIs** that feel native, fast, and delightful on phones and tablets. Every decision — layout, touch targets, typography, spacing, animation — is optimized for small screens first.

---

## Core Mobile Design Philosophy

**Mobile-first means designing for constraints, then enhancing:**
- Start with the smallest screen (320px) and scale up
- Every element must work with one thumb
- Performance matters more on mobile (slow networks, weak CPUs)
- Touch is imprecise — generous tap targets prevent frustration
- Vertical scroll is natural — horizontal scroll is a UX crime

---

## Layout Rules

### Breakpoints (Tailwind)
```css
/* Mobile first — no prefix = mobile */
/* sm: = 640px+ (large phones, small tablets) */
/* md: = 768px+ (tablets) */
/* lg: = 1024px+ (desktop) */
```

### Grid System for Mobile
```jsx
// Single column on mobile, expand on larger screens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Full width cards on mobile
<div className="w-full sm:w-auto">

// Stack vertically on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">
```

### Safe Areas (Notch / Home Bar)
```css
/* Always account for notch and home indicator */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```
```jsx
// Tailwind equivalent
<div className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
```

---

## Touch Target Rules

**CRITICAL: Every tappable element must be at least 44×44px (Apple HIG standard)**

```jsx
// ❌ WRONG — too small
<button className="p-1 text-sm">Click</button>

// ✅ CORRECT — minimum 44px tap target
<button className="min-h-[44px] min-w-[44px] px-4 py-3">Tap</button>

// ✅ Icon buttons — add padding to increase hit area
<button className="p-3">
  <Icon size={20} /> {/* icon is 20px but tap area is 44px+ */}
</button>
```

**Spacing between tap targets:** At least 8px gap to prevent mis-taps.

---

## Typography for Mobile

```jsx
// Minimum readable font sizes
// Body text: 16px minimum (prevents iOS zoom on inputs)
// Caption/label: 14px minimum
// Never go below 12px

// Scale that works on mobile
<h1 className="text-2xl sm:text-4xl font-bold">    // 24px mobile, 36px desktop
<h2 className="text-xl sm:text-2xl font-semibold"> // 20px mobile, 24px desktop
<p className="text-base leading-relaxed">           // 16px, good line height
<span className="text-sm">                          // 14px minimum for labels
```

**Line length on mobile:** Max 70–75 characters per line. Use `max-w-prose` or `max-w-sm`.

---

## Navigation Patterns

### Bottom Navigation Bar (Best for Mobile)
```jsx
const BottomNav = ({ items, active, onChange }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100
                  pb-[env(safe-area-inset-bottom)]">
    <div className="flex justify-around items-center h-16">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1
                      min-h-[44px] transition-colors
                      ${active === item.id ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <item.icon size={22} />
          <span className="text-[11px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  </nav>
);
```

### Hamburger Menu / Drawer
```jsx
// Slide-in drawer from left or bottom
// Bottom sheet is more mobile-native than side drawer
const BottomSheet = ({ open, onClose, children }) => (
  <>
    {/* Backdrop */}
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-black/50 z-40 transition-opacity
                  ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    />
    {/* Sheet */}
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl
                     pb-[env(safe-area-inset-bottom)] transition-transform duration-300
                     ${open ? 'translate-y-0' : 'translate-y-full'}`}>
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>
      {children}
    </div>
  </>
);
```

---

## Mobile Input Design

**CRITICAL: Input font-size must be 16px minimum to prevent iOS auto-zoom**

```jsx
// ✅ Correct mobile input
<input
  className="w-full text-base px-4 py-3 rounded-xl border border-gray-200
             focus:outline-none focus:ring-2 focus:ring-blue-500
             min-h-[48px]"  // 48px height feels natural on mobile
  type="text"
/>

// Input types that trigger correct mobile keyboard
type="email"    // @ symbol prominent
type="tel"      // Number pad
type="number"   // Numeric keyboard
type="search"   // Search keyboard with return key labeled "Search"
type="url"      // URL keyboard with .com button

// Autocomplete for faster mobile filling
autoComplete="email"
autoComplete="name"
autoComplete="tel"
```

---

## Scroll & Overflow

```jsx
// Horizontal scroll list (tool grid, category tabs)
<div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide
                -mx-4 px-4">  // bleed to edges for full-width feel
  {items.map(item => (
    <div className="flex-shrink-0 w-32">...</div>
  ))}
</div>

// Smooth momentum scrolling on iOS
<div style={{ WebkitOverflowScrolling: 'touch', overflowY: 'scroll' }}>

// Hide scrollbar but keep functionality
/* In CSS */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## Cards & List Items on Mobile

```jsx
// Full-width card — standard mobile pattern
<div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4
                active:scale-[0.98] transition-transform cursor-pointer">

// List item with large tap target
<div className="flex items-center gap-3 px-4 py-3 min-h-[56px]
                hover:bg-gray-50 active:bg-gray-100 transition-colors">
  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
    <Icon size={20} className="text-blue-600" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
    <p className="text-xs text-gray-500 truncate">{subtitle}</p>
  </div>
  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
</div>
```

---

## File Upload on Mobile

```jsx
// Mobile-optimized drag-and-drop + tap to upload
const MobileFileUpload = ({ onFile }) => (
  <label className="flex flex-col items-center justify-center w-full
                    min-h-[160px] rounded-3xl border-2 border-dashed border-gray-300
                    bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer
                    p-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
      <Upload size={24} className="text-blue-600" />
    </div>
    <p className="text-base font-semibold text-gray-700">Tap to upload</p>
    <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
    <p className="text-xs text-gray-300 mt-2">PDF, DOC, JPG up to 100MB</p>
    <input
      type="file"
      className="hidden"
      onChange={e => onFile(e.target.files[0])}
      // Allow camera on mobile
      capture="environment"  // or "user" for front camera
      accept=".pdf,.doc,.docx,image/*"
    />
  </label>
);
```

---

## Modals & Dialogs on Mobile

```jsx
// On mobile, modals should slide up from bottom (bottom sheet pattern)
// NOT appear as centered overlays — those feel unnatural on phones

const MobileModal = ({ open, onClose, title, children }) => (
  <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
    {/* Backdrop */}
    <div
      className={`absolute inset-0 bg-black transition-opacity duration-300
                  ${open ? 'opacity-50' : 'opacity-0'}`}
      onClick={onClose}
    />
    {/* Bottom sheet */}
    <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl
                     max-h-[90vh] overflow-y-auto
                     pb-[env(safe-area-inset-bottom)]
                     transition-transform duration-300 ease-out
                     ${open ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="sticky top-0 bg-white pt-3 pb-4 px-4 border-b border-gray-100">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);
```

---

## Mobile Animations

**Keep animations short and purposeful on mobile — battery and performance matter**

```jsx
// Page transition (slide in from right — native app feel)
const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { x: '-30%', opacity: 0, transition: { duration: 0.2 } }
};

// Bottom sheet spring animation
const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } }
};

// Tap feedback (scale down on press)
<motion.button whileTap={{ scale: 0.96 }} className="...">

// List item stagger (fast on mobile — 0.05s not 0.1s)
{items.map((item, i) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05, duration: 0.2 }}
  />
))}
```

---

## Performance on Mobile

```jsx
// Lazy load images
<img loading="lazy" src={url} alt={alt} />

// Use next/image or similar for automatic optimization

// Virtualize long lists (react-window or react-virtual)
import { FixedSizeList } from 'react-window';

// Avoid layout thrash — use transform instead of top/left for animations
// ❌ Bad: animating top/left (causes reflow)
// ✅ Good: animating transform: translateX/Y (GPU composited)

// Debounce scroll handlers
const handleScroll = useMemo(
  () => debounce(() => { /* ... */ }, 100),
  []
);
```

---

## PWA Mobile Enhancements

```json
// manifest.json
{
  "name": "FileNinja",
  "short_name": "FileNinja",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<!-- index.html meta tags for mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="theme-color" content="#6366f1" />
```

---

## Mobile-Specific Utility Classes (Add to CSS)

```css
/* Prevent text selection on tap (for buttons/interactive elements) */
.no-select { -webkit-user-select: none; user-select: none; }

/* Smooth scrolling with momentum on iOS */
.scroll-smooth-ios { -webkit-overflow-scrolling: touch; }

/* Remove tap highlight on mobile */
* { -webkit-tap-highlight-color: transparent; }

/* Hide scrollbar */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Full height accounting for mobile browser chrome */
.full-height { height: 100dvh; } /* dvh = dynamic viewport height */
```

---

## Common Mobile Layout Templates

### Tool Page Layout (for FileNinja tools)
```jsx
const ToolPageMobile = ({ title, icon, children }) => (
  <div className="min-h-[100dvh] flex flex-col bg-gray-50">
    {/* Header */}
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100
                       pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 px-4 h-14">
        <button className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{icon}</span>
          <h1 className="text-base font-semibold truncate">{title}</h1>
        </div>
      </div>
    </header>

    {/* Scrollable content */}
    <main className="flex-1 overflow-y-auto px-4 py-6 pb-24">
      {children}
    </main>

    {/* Fixed bottom action button */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100
                    px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <button className="w-full bg-blue-600 text-white font-semibold py-4
                         rounded-2xl text-base active:scale-[0.98] transition-transform">
        Process File
      </button>
    </div>
  </div>
);
```

### Home / Tool Grid Layout
```jsx
const HomeLayout = ({ tools }) => (
  <div className="min-h-[100dvh] bg-gray-50">
    {/* Hero - compact on mobile */}
    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-4 pt-14 pb-8
                    pt-[calc(env(safe-area-inset-top)+56px)]">
      <h1 className="text-2xl font-bold text-white">FileNinja</h1>
      <p className="text-blue-200 text-sm mt-1">50+ tools. Free. Private.</p>
    </div>

    {/* Search bar */}
    <div className="px-4 -mt-5">
      <div className="bg-white rounded-2xl shadow-md flex items-center gap-3 px-4 h-12">
        <Search size={18} className="text-gray-400" />
        <input
          type="search"
          placeholder="Search tools..."
          className="flex-1 text-base outline-none bg-transparent"
        />
      </div>
    </div>

    {/* Category filter - horizontal scroll */}
    <div className="flex gap-2 overflow-x-auto px-4 py-4 no-scrollbar">
      {categories.map(cat => (
        <button key={cat}
          className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
                     bg-white border border-gray-200 whitespace-nowrap">
          {cat}
        </button>
      ))}
    </div>

    {/* Tool grid - 2 columns on mobile */}
    <div className="grid grid-cols-2 gap-3 px-4 pb-24">
      {tools.map(tool => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  </div>
);
```

---

## Checklist Before Shipping Mobile UI

- [ ] All tap targets ≥ 44×44px
- [ ] Input font-size ≥ 16px (no iOS zoom)
- [ ] Safe area insets applied (notch + home bar)
- [ ] No horizontal overflow / scroll
- [ ] Bottom navigation or accessible hamburger menu
- [ ] Tested at 320px width (smallest phones)
- [ ] Tested at 375px (iPhone SE), 390px (iPhone 14), 414px (Plus models)
- [ ] Bottom sheets instead of centered modals
- [ ] `100dvh` used instead of `100vh`
- [ ] `-webkit-tap-highlight-color: transparent` applied
- [ ] Animations under 300ms
- [ ] PWA meta tags in index.html
- [ ] Lighthouse mobile score 90+