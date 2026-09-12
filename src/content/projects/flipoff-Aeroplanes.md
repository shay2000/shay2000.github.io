---
repo: "flipoff-Aeroplanes"
tagline: "A $3,500 split-flap board, emulated in a browser tab."
status: "active"
year: "2026"
stack: ["JavaScript", "CSS 3D", "Web Audio", "No build step"]
highlights:
  - label: "Stack"
    value: "Vanilla HTML/CSS/JS"
  - label: "Dependencies"
    value: "None"
  - label: "Offline"
    value: "Yes — zero network calls"
  - label: "Display"
    value: "Phone to 4K"
order: 5
---

Real split-flap boards cost thousands. FlipOff turns any television or monitor into one, and it is a single `index.html` with no build step and no dependencies.

Open the file, click once to unlock audio, press `F` for full-screen TV mode. That is the entire setup.

## The constraint is the design

A mechanical flap board has no pixels. Each cell is a physical stack of cards on a spindle, and to get from `A` to `B` the mechanism flips forward through every card in between. It cannot fade, slide, or cross-cut.

Reproducing that rule — rather than approximating it with a nice-looking text animation — is what makes the thing read as machinery instead of a web page.

## Details that carry it

- **Two halves per cell, different easings.** Real flaps accelerate as they fall and stop hard. Getting the overlap right between the rotating halves took longer than the rest of the project.
- **Randomised scramble.** Cells get a random start delay and a random number of intermediate flips before settling, so a board change lands unevenly like a real mechanism. Without the randomness it looks like a spreadsheet updating.
- **Recorded sound.** The clacking is sampled from a real split-flap display, not synthesised — the uneven transients are the part a sine burst cannot fake. Playback is staggered to match the visual scramble.
- **Keyboard-first.** `Enter`/`Space` for the next message, arrows to step, `F` to toggle full-screen.

## Why no framework

Not dogma. Three concrete reasons: it works offline forever with nothing to go stale, it runs on a TV with no install step, and anyone can open the file and change a colour or add messages. The whole point is that the free version is genuinely yours.

It ships with an auto-rotating set of quotes, but the message list is a plain array you can replace in seconds.
