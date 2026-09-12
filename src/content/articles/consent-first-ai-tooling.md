---
title: "AI summaries that ask permission first"
description: "A Zotero plugin built around a consent preview: what leaves your machine, to which provider, how much of it, and what might go wrong — shown before anything is sent."
date: 2026-08-14
tags: ['JavaScript', 'Zotero', 'Privacy', 'AI']
featured: false
glyph: '¶'
tone: 'iris'
---

The default shape of an AI feature is a button that silently ships your document to a server. The default shape of a research workflow is a folder full of unpublished drafts, embargoed data, and things covered by an ethics approval.

Those two shapes do not fit together. So the plugin starts from the opposite end: nothing leaves the machine until you have seen exactly what would.

## The consent preview

Before any request, the plugin shows a preview naming:

- **The provider** — Mistral, OpenRouter, or AgentRouter, whichever you have configured.
- **The model** — the specific one, not "the AI".
- **The files involved** — by name, so you can spot the one that should not be in there.
- **Approximate size** — how many characters are about to leave.
- **Warnings** — anything the plugin is unsure about.

Only then does anything get sent. The preview is not a checkbox buried in settings; it is a per-action step. That friction is the feature. Summarising a paper and cross-checking a collection subtree are different operations with different exposure, and they deserve different confirmations.

## Secrets belong in the keychain

API keys go to the platform login manager — macOS Keychain, and the equivalent elsewhere. They are never written to Zotero preferences, never to notes, never to logs, and never into the packaged XPI.

This sounds obvious and it is routinely done wrong. The failure mode is a preferences blob that gets synced to a cloud account, or a debug log someone pastes into a GitHub issue.

## Privacy as a test, not a promise

The build is dependency-free Python that produces a deterministic XPI. Alongside it, a test script inspects the built package and checks the privacy invariants directly:

```sh
python3 scripts/build.py          # deterministic ZIP/XPI from source
python3 scripts/run-tests.py      # builds, inspects the XPI, checks invariants
python3 scripts/run-tests.py --audit   # source-only checks
```

A claim like "keys never enter the bundle" is testable. So it gets tested. This is the difference between a privacy policy and a privacy property.

## Format support is a scope decision

Full extraction works for PDFs, EPUBs, HTML snapshots, XHTML, and directly readable text formats — TXT, Markdown, CSV/TSV, JSON, XML, BibTeX, TeX.

Word-processing containers — DOCX, ODT, RTF — are explicitly **unsupported** for now. Not because it would be hard to attempt, but because a partial extraction you cannot verify is worse than a clear refusal: it produces a summary of something that may not be what you think you sent.

Where structured document text is not available, extraction falls back to Zotero's existing full-text cache. An unindexed EPUB has to be indexed by Zotero first. The plugin does not quietly flip indexing state behind the consent preview, because a preview that changes the thing it is describing is not a preview.

## Lifecycle hygiene

A Zotero plugin is a guest in someone else's process, and it has to leave cleanly. The extension:

- Registers only stable, supported Zotero plugin APIs.
- Cleans up listeners, observers, panes, and in-flight requests on disable, upgrade, uninstall, and application shutdown.
- Uses a fixed extension ID so upgrades replace rather than duplicate.

None of this is visible when it works. All of it is visible when it does not — orphaned observers firing against a torn-down window are a classic source of mysterious crashes.

## The design rule

If a feature cannot explain itself before it acts, it should not act. That single constraint produced most of the architecture here, and it is a reasonable rule to apply to any tool that touches your documents.
