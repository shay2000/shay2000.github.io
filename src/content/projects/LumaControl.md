---
repo: "LumaControl"
tagline: "Display control for current macOS, including the brightness macOS hides."
status: "active"
year: "2026"
stack: ["Swift", "AppKit", "DDC/CI", "Sparkle", "CI"]
highlights:
  - label: "Controls"
    value: "Brightness · volume · contrast"
  - label: "Extras"
    value: "Extended XDR range"
  - label: "Builds"
    value: "Universal — Apple silicon + Intel"
  - label: "Updates"
    value: "Signed Sparkle feed"
order: 3
---

LumaControl started as a fork of MonitorControl and became its own project, with a focus on current macOS releases, a native-feeling interface, and display-control ideas upstream had not taken on.

## Extended XDR brightness

The brightness slider in macOS stops at 100%. On an XDR panel that is a convention, not a ceiling — there is headroom past it. LumaControl exposes that range with the guardrails the feature needs:

- A **confirmation step** before entering the extended range, so it is never an accidental drag.
- **Quick reset and quick disable**, reachable without digging through preferences.
- A clear indication you are outside the normal range, because the display will not tell you.

## Two kinds of brightness

Worth being precise about, because the difference is real:

| Mode | What happens | Saves power? |
| --- | --- | --- |
| Hardware (DDC / native) | The backlight actually changes | Yes |
| Software (gamma, shade) | The framebuffer is multiplied | No |

Software dimming works on any display, including ones with no DDC support — but the panel still emits at full power. The app offers both and does not pretend they are equivalent.

## Maintenance is the project

Display utilities are a commitment, not a weekend build. Every macOS release moves something: private frameworks shift shape, permission requirements change, and the toolchain bumps break working builds. So LumaControl carries CI, unit tests, universal binaries, and its own signed update feed.

The distributed build is ad-hoc signed, which means the first launch is blocked. The documented fix is right-click → Open, or:

```sh
xattr -d com.apple.quarantine /Applications/LumaControl.app
```

Keyboard shortcuts may also need Accessibility permission in System Settings → Privacy & Security.
