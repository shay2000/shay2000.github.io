---
title: "The brightness range macOS won't show you"
description: "XDR displays have headroom past 100%. Here's what it takes to expose it safely, and why the slider needs a warning label."
date: 2026-08-19
tags: ['Swift', 'macOS', 'Displays', 'Menu bar']
featured: true
glyph: '◐'
tone: 'sky'
---

The brightness slider in macOS stops at 100%. On an XDR panel, 100% is not the ceiling — it is a convention. There is more light available, and macOS will let you reach it if you ask through the right private interface.

LumaControl began as a fork of MonitorControl and grew into its own project, mostly because "expose the headroom" turned out to be a much smaller problem than "expose it without letting someone cook their panel by accident."

## Two ways to dim a display

Not all brightness changes are the same operation, and the difference matters:

**Hardware brightness** goes over DDC/CI to an external monitor, or through Apple's native display control on built-in panels. The backlight actually changes. Power draw changes with it.

**Software dimming** multiplies the framebuffer. Gamma dimming and shade overlays do not touch the backlight at all — the panel still emits at full tilt, you just see less of it. It works on any display, including ones with no DDC support, but it saves no power.

A good display utility offers both and is honest about which one you are using.

```swift
// Hardware path (external displays, via DDC)
DDCWrite(service, controlID: 0x10, value: UInt16(brightness * 100))

// Software path (works everywhere, saves nothing)
CGSetDisplayTransferByFormula(display, 0, 1, 1, 0, 1, 1, 0, 1, gamma)
```

## Extended XDR range

Past the standard range, the panel enters a mode where it can sustain significantly higher output — but only for limited durations and with real thermal consequences. The controls that matter are therefore not just a slider:

- **A confirmation step** before entering the extended range, so it is never a one-pixel misdrag.
- **Quick reset and quick disable**, reachable without hunting through preferences.
- **A visible indication** that you are outside the normal range, because the screen will not tell you.

Synchronisation is the other half. If you drag one display's brightness and three others follow, the group has to respect each panel's *own* available range — the XDR laptop panel and the cheap external monitor do not share a ceiling. Naively copying the percentage across displays either under-drives the good panel or over-drives the bad one.

## Keeping up with macOS

This is the part that makes display utilities a maintenance commitment rather than a weekend project. Every macOS release rearranges something:

- Private frameworks change shape between major versions.
- Entitlements and permission requirements shift — keyboard shortcuts need Accessibility approval.
- Xcode and Swift toolchain bumps break builds that were fine three months ago.

So the project carries CI, unit tests, and a signed Sparkle update feed of its own. The build matrix covers Apple Silicon and Intel in one universal binary. None of that is glamorous, and all of it is the difference between a tool that works in a year and one that does not.

## Ad-hoc signing and the first-launch wall

The distributed build is ad-hoc signed rather than notarised, which means Gatekeeper blocks the first launch. The documented escape hatch:

```sh
xattr -d com.apple.quarantine /Applications/LumaControl.app
```

Or right-click → Open. Worth knowing before you file the bug, because the app is working exactly as intended — it is the signing chain that is not.

## What's actually hard

Not the DDC writes. Not the sliders. The hard parts are:

1. **Range negotiation.** Querying what each display can actually do, rather than assuming, and degrading gracefully when a monitor lies about its capabilities.
2. **Software vs hardware honesty.** Making it clear which mode is active, because one dims the panel and the other only dims your perception of it.
3. **Not breaking on the next OS.** Treating upstream macOS changes as a scheduled cost rather than a surprise.

A display control app looks like a solved problem. It is not — it is a small piece of software with an unusually long tail of edge cases, and the only way through is to keep at it.
