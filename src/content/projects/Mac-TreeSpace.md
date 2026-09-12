---
repo: "Mac-TreeSpace"
tagline: "What's eating your disk, without the ceremony."
status: "active"
year: "2026"
stack: ["Swift", "SwiftUI", "CryptoKit", "SwiftPM"]
highlights:
  - label: "Views"
    value: "Size tree · by extension · duplicates"
  - label: "Dedup"
    value: "3-stage filter, SHA-256"
  - label: "Sizing"
    value: "Allocated bytes on disk"
  - label: "Build"
    value: "swift run, or open Package.swift"
order: 6
---

A minimal native SwiftUI app that answers one question: what is taking up the space? Expandable size-sorted tree, totals grouped by file extension, and a duplicate finder — all readable end to end and yours to hack on.

## Duplicates, cheapest test first

Hashing every file to find duplicates is correct and slow. The staged approach spends almost no I/O before committing to a lot:

1. **Group by size.** Different byte counts cannot be identical. Costs a directory walk, no file reads.
2. **Hash the first 64 KB.** Files that differ early drop out, having cost 64 KB each.
3. **Full SHA-256.** Only the survivors get read end to end.

Cost now scales with how many near-duplicates you have, not how many files. Both stages use `CryptoKit`, so there is no C interop and no extra dependency.

## Measuring honestly

Sizes use **allocated** bytes — the same figure Finder shows as "Size on disk" — not logical length. A folder of 10,000 tiny files can have a trivial logical total and eat gigabytes of real space.

Two rules that prevent the classic bugs:

- **Symlinks are skipped**, so a recursive walk can never loop.
- **Bundles count as single items.** An `.app` is technically a directory; nobody wants its innards in a size tree.

The scanner walks once and accumulates on the way back up, so every file is stat'ed exactly once.

## Permission reality

Scanning Desktop, Documents, Downloads, or `~/Library` triggers a macOS prompt the first time. Reading `~/Library` or the whole home folder needs **Full Disk Access** in System Settings → Privacy & Security.

No API grants that, and no app can ask on your behalf. All it can do is fail clearly and point at the right settings pane.

## What it deliberately is not

Not a treemap, not a beautification project. Three views, a per-row bar showing each item's share of the root, right-click to reveal in Finder or move to trash. The bar is the quietly important part — it turns "what's eating my disk" into a visual scan rather than mental arithmetic.
