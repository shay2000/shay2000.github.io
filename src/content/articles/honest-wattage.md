---
title: "Your 140 W charger probably isn't delivering 140 W"
description: "macOS reports a wattage that describes the adapter, not what your Mac is actually receiving. Building a menu-bar utility to show the honest number."
date: 2026-08-31
tags: ['Swift', 'macOS', 'Hardware', 'Menu bar']
featured: true
glyph: '⚡'
tone: 'ember'
---

Plug in a 140 W charger. Open System Information. It says 140 W. Everything agrees, nothing is lying, and yet the number describes the *adapter's* claim about itself — not what is arriving at the battery.

Those are frequently different numbers.

## The gap between rated and actual

A USB-C power supply negotiates. The adapter advertises the voltage and current profiles it supports, the Mac picks one, and then both sides settle somewhere at or below that ceiling. What actually crosses the cable depends on load, thermal state, cable quality, and which port you used.

So a 140 W adapter can be delivering 96 W. A 96 W adapter can be delivering 60 W through a marginal cable. The Mac is perfectly happy in all three cases. The only way to know is to ask the hardware what it is doing right now, once a second, and put the answer where you can see it.

## Reading the real number

macOS exposes charger state through the IOKit power sources dictionary. The interesting part lives under `AdapterDetails`:

```swift
import IOKit.ps

func adapterDetails() -> [String: Any]? {
    guard let snapshot = IOPSCopyPowerSourcesInfo()?.takeRetainedValue(),
          let sources = IOPSCopyPowerSourcesList(snapshot)?.takeRetainedValue() as? [CFTypeRef]
    else { return nil }

    for source in sources {
        guard let desc = IOPSGetPowerSourceDescription(snapshot, source)?
            .takeUnretainedValue() as? [String: Any],
            desc[kIOPSPowerSourceStateKey as String] as? String == kIOPSACPowerValue
        else { continue }

        return desc[kIOPSAdapterDetailsKey as String] as? [String: Any]
    }
    return nil
}
```

From that dictionary you get `Watts`, `Current`, and `Voltage`. The fields are strings more often than you would like, and which keys are populated varies by machine and by macOS release — so every read needs a fallback path rather than a force-unwrap.

The four numbers worth surfacing:

| Value | What it means |
| --- | --- |
| Actual input | Watts crossing the cable right now |
| System draw | What the Mac is consuming at this instant |
| Rated input | What the adapter claims it can supply |
| Charge surplus | Actual input minus system draw |

That last one is the one that earns its place in the menu bar. If it is positive, the battery is charging. If it is near zero, you are running entirely off the adapter and the battery is going nowhere. If it is **negative**, the adapter is not keeping up and the battery is quietly draining while plugged in.

Signed display matters here. Clamping a negative surplus to zero would hide the exact situation the tool exists to reveal.

## Polling without being rude

A one-second timer that never stops is a small but real battery cost. The rule that keeps it honest:

- On external power: poll once per second, show the status item.
- On battery: remove the status item entirely and stop the timer.
- Resume on the power-source change notification, not on a timer.

```swift
IOPSNotificationCreateRunLoopSource({ _ in
    // power source changed — re-read and reschedule
}, nil).takeRetainedValue()
```

There is an opt-in exception for people who want to watch discharge rate while unplugged. It is off by default and the README says plainly that it uses a little extra battery, which seems like the right trade: the default should be cheap, and the expensive behaviour should be a choice.

## Numbers-only, and nothing else

The menu-bar item is a bare wattage figure. No icon, no label, no battery glyph. It appears when power is connected and disappears when it is not.

The only network request the app makes is a GitHub releases check, daily at midnight UTC, and it can be turned off. No telemetry, no account, no analytics endpoint. For a utility that watches your power draw all day, that restraint is the feature.

## What it took

The hard part was never the IOKit call. It was:

1. **Field variability.** Different Macs populate different keys in `AdapterDetails`. Every accessor needs a sane fallback, and the fallback needs to be tested on more than one machine.
2. **Not waking the CPU for nothing.** Pausing polling on battery is easy to write and easy to get wrong — if you miss the resume notification, the app is silently dead until relaunch.
3. **Unsigned distribution.** The app ships unsigned, so first launch requires Privacy & Security → Open Anyway. That is a documented step, not a surprise.

The result is a small, honest instrument. If you have ever wondered whether the charger in your bag is the one you think it is, this answers it in a glance.
