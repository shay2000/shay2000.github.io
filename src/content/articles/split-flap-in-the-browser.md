---
title: "Modelling a split-flap display in the browser"
description: "A mechanical flip board is not an animation, it's a state machine with a sound effect. Building one in vanilla JavaScript, with no frameworks and no build step."
date: 2026-08-23
tags: ['JavaScript', 'CSS', 'Canvas', 'Fun']
featured: false
glyph: '▤'
tone: 'sand'
---

A real split-flap display has no pixels. It has a stack of physical cards on a spindle, and a cell can only ever show the card currently at the front. To get from `A` to `B`, the mechanism does not fade or slide — it flips forward through every card in between.

That constraint is the entire aesthetic. Get it right and the thing reads as mechanical. Skip it and you have a nice-looking text animation that feels like a web page.

## The state machine

Each cell holds two values, not one:

```js
const cell = {
  current: 'A',   // what the top half shows
  next: 'B',      // what it's flipping toward
  flipping: false,
};
```

A flip is three visual beats:

1. **Top half rotates down** past the hinge, revealing the incoming card's top half.
2. **Bottom half rotates up**, covering the outgoing card's bottom half.
3. **Settle** — the new card is now `current`, and the cell is idle.

Doing this with CSS 3D transforms means two stacked halves per cell, each with `transform-origin` set at the hinge line:

```css
.flap__top {
  transform-origin: bottom center;
  transform: rotateX(0deg);
}
.flap__top.is-flipping {
  animation: flip-down 180ms ease-in forwards;
}

@keyframes flip-down {
  to { transform: rotateX(-90deg); }
}
```

The crucial detail is that the two halves animate on **different easings and durations**. Real flaps accelerate as they fall and hit a hard stop. Matching that timing is most of what makes it convincing.

## Scramble transitions

When a whole board changes, cells should not all flip in unison. Real displays are mechanically noisy — everything lands slightly out of order.

So each cell gets a randomised delay, and a randomised number of intermediate flips before it settles on the target character. The result is a burst of clacking as the board resolves into the new message.

```js
cell.delay = Math.random() * 400;        // ms before this cell starts
cell.steps = 2 + Math.floor(Math.random() * 4); // intermediate cards
```

That randomness is doing real work. Without it the board looks like a spreadsheet updating; with it, it looks like machinery.

## Sound is not decoration

The clacking audio was recorded from a real split-flap display. It is not a synthesised click, and the difference is immediately audible — real mechanisms have uneven, slightly dirty transients that a sine burst does not reproduce.

Two implementation notes:

- **Browsers block autoplay.** Audio only starts after a user gesture, so the first click is also the audio unlock. There is no way around this and no reason to fake it.
- **Stagger the playback** to match the visual scramble. Sound and motion landing together is what sells the illusion; a single sound effect for a whole-board change reads as fake instantly.

## Zero dependencies, on purpose

The whole thing is HTML, CSS, and JavaScript. No framework, no bundler, no `npm install`. Open `index.html` and it runs.

That is a deliberate constraint, and it buys three things:

- **It works offline, forever.** Nothing to fetch, nothing to go stale, no CDN to disappear.
- **It runs on a television.** Full-screen mode is a keypress (`F`), and the layout scales from a phone to 4K without a rebuild.
- **It stays hackable.** Anyone can open the file and change a colour or add a message list. That matters more than it sounds — the project exists because the hardware costs $3,500, and the point is that the free version is genuinely yours.

## What's actually hard

Not the flip. The hard parts were:

1. **Timing.** Getting the two halves to overlap correctly, at the right speed, without a visible seam. This took far more iterations than the rest of the project combined.
2. **Randomisation that still resolves.** Random delays and step counts, but a guaranteed correct final state every time.
3. **Scale.** A split-flap board at 4K needs different flap geometry, not a scaled-up small one — otherwise the hinge proportions look wrong.

It is a small project about a nostalgic object. It is also a decent illustration of a general rule: when you are emulating a physical thing, the physics *is* the interface.
