---
repo: "watt-is-it"
tagline: "The honest wattage number, in your menu bar."
status: "active"
year: "2026"
stack: ["Swift", "AppKit", "IOKit", "Menu bar"]
highlights:
  - label: "Platform"
    value: "macOS 14.6+ · Apple silicon"
  - label: "Refresh"
    value: "1 s while on external power"
  - label: "Network"
    value: "GitHub releases check only"
  - label: "Distribution"
    value: "Unsigned DMG"
order: 1
---

Most chargers report what they are *rated* for. macOS repeats that number. Nobody tells you what is actually crossing the cable.

**Watt is it?** puts the real figure in the menu bar — a bare number, no icon — and reveals the rest when you click: actual input, system draw, rated input, and charge surplus.

The surplus is the one worth watching. Positive means charging. Near zero means the Mac is running entirely off the adapter. **Negative means the adapter is losing** — the battery is draining while plugged in, and nothing else on the system will tell you that.

## Decisions worth naming

- **Signed surplus.** A negative value stays negative. Clamping it to zero would hide the exact case the tool exists to surface.
- **Polling stops on battery.** The status item is removed and the one-second timer is torn down, resuming only when macOS reports a power-source change. There is an opt-in discharge-rate mode for people who want it, clearly labelled as costing extra battery.
- **One network request.** A daily GitHub releases check at midnight UTC, switchable off. No telemetry, no account.
- **Numbers only.** The menu bar shows the wattage and nothing else, because that is the whole point.
