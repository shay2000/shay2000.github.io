---
repo: "zotero-ai-plugin"
tagline: "AI summaries for Zotero that show you the payload before they send it."
status: "active"
year: "2026"
stack: ["JavaScript", "Zotero 9+", "Python (build)", "Keychain"]
highlights:
  - label: "Actions"
    value: "Summaries · text explain · cross-checks"
  - label: "Formats"
    value: "PDF · EPUB · HTML · text"
  - label: "Secrets"
    value: "Platform login manager only"
  - label: "Build"
    value: "Dependency-free, deterministic XPI"
order: 4
---

The default shape of an AI feature is a button that quietly ships your document to a server. The default shape of a research workflow is a folder of unpublished drafts and embargoed data.

This plugin refuses to reconcile those. Nothing leaves the machine until you have seen exactly what would.

## The consent preview

Before any request, you get a preview naming the **provider**, the **model**, the **files involved by name**, the **approximate size** of what is about to leave, and any **warnings**. Only then does anything get sent.

That friction is the feature. Summarising one paper and cross-checking an entire collection subtree are different operations with different exposure, and they get different confirmations.

## Privacy as a tested property

API keys live in the platform login manager and are never written to Zotero preferences, notes, logs, or the packaged XPI. That claim is not just documented — the test script inspects the built artifact and checks the invariants directly:

```sh
python3 scripts/build.py            # deterministic XPI from source
python3 scripts/run-tests.py        # builds, inspects, checks invariants
python3 scripts/run-tests.py --audit
```

## Scope decisions

- **DOCX, ODT and RTF are explicitly unsupported.** A partial extraction you cannot verify is worse than a clear refusal — it produces a summary of something that may not be what you think you sent.
- **Full-text cache is a fallback, never a side effect.** An unindexed EPUB has to be indexed by Zotero first; the plugin will not silently flip indexing state behind the preview that is describing it.
- **Clean teardown.** Listeners, observers, panes and in-flight requests are released on disable, upgrade, uninstall, and shutdown, using a fixed extension ID so upgrades replace rather than duplicate.

Provider configuration covers Mistral, OpenRouter, and AgentRouter over their OpenAI-compatible endpoints — you bring the key, and the plugin never assumes a default destination.
