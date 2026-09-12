---
title: "Finding duplicates without hashing your whole disk"
description: "A three-stage filter that reads 64 KB from each file before committing to a full SHA-256 — and why 'size on disk' is the number you actually want to sort by."
date: 2026-09-02
tags: ['Swift', 'macOS', 'Performance', 'SwiftUI']
featured: false
glyph: '⌘'
tone: 'ember'
---

The naive way to find duplicate files is to hash everything and group by digest. It is correct, it is simple, and on a disk with a million files it will make you wait a very long time to learn that most of your files are not duplicates.

The fix is to spend as little I/O as possible before you commit to spending a lot.

## Three stages, cheapest first

**Stage 1 — group by size.** Two files with different byte counts cannot be identical. This requires only a directory walk, no file reads at all, and it eliminates the vast majority of candidates immediately.

**Stage 2 — hash the first 64 KB.** Read the head of each remaining file and group by that digest. Files that differ early — different headers, different formats, different content entirely — drop out here, having cost you 64 KB each instead of the full file.

**Stage 3 — full SHA-256.** Only the survivors of stage 2 get read end to end and hashed properly. This is the expensive step, and it now runs on a small fraction of the original set.

```swift
// Stage 2 — a cheap, decisive screen
let handle = try FileHandle(forReadingFrom: url)
let head = try handle.read(upToCount: 64 * 1024) ?? Data()
let screen = SHA256.hash(data: head)
```

Using `CryptoKit` for both stages keeps it to one dependency, in the standard library, with no C interop.

The staged approach means the cost scales with *how many near-duplicates you have*, not how many files you have. On a typical disk, stage 3 runs on a handful of files.

## Allocated size, not logical size

A file's *logical* size is how many bytes it contains. Its *allocated* size is how much disk it actually occupies, after block rounding and compression.

For a disk-usage tool, allocated size is the only honest number. A folder of 10,000 tiny files can have a trivial logical total and consume gigabytes of real space. Finder's "Size on disk" is the same figure — matching it means the numbers agree with what you already trust.

Two other measurement details that matter:

- **Symlinks are skipped.** Following them invites cycles, and a cycle in a recursive directory walk is a hang.
- **Bundles count as single items.** An `.app` is a directory as far as the filesystem is concerned, but nobody wants to see its innards in a size tree.

## One pass, not two

The scanner walks the tree once, using `FileManager.contentsOfDirectory` with resource keys, and accumulates sizes on the way back up. Each directory's total is the sum of its children's totals, computed as the recursion unwinds.

That is the difference between an app that shows you a result in seconds and one that spins for a minute. Recursive sizing done naively re-stats the same subtrees repeatedly; done in a single post-order pass, every file is touched exactly once.

## Permission reality

macOS treats Desktop, Documents, Downloads, and `~/Library` as sensitive. The first scan of one of those triggers a system prompt. Scanning `~/Library` or your whole home folder needs **Full Disk Access** granted in System Settings → Privacy & Security.

The app cannot ask for this on your behalf, and there is no API that grants it. All it can do is fail clearly and tell you where to click. Any tool that claims to silently sidestep this is either not reading what it says it reads, or is abusing something.

## The bar in the row

Each row in the tree carries a small bar showing that item's share of the root. It is a one-line feature that changes how the tool is used: instead of reading numbers and doing mental arithmetic, you scan for the long bars. The answer to "what's eating my disk" is usually one obviously oversized folder, and the bar finds it in under a second.

## What it is not

It is not Disk Inventory X. It does not do a treemap, it does not try to be beautiful, and it is a single SwiftUI app you can read end to end and hack on. Sometimes the correct scope for a utility is "the three things I actually do, done properly."
