---
title: "zotero ai plugin"
repo: "zotero-ai-plugin"
repoUrl: "https://github.com/shay2000/zotero-ai-plugin"
language: "JavaScript"
branch: "main"
source: "https://github.com/shay2000/zotero-ai-plugin/blob/main/README.md"
bytes: 3650
---
# AI for Zotero

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/shay2k)

AI for Zotero is a bootstrapped Zotero 9+ plugin for explicitly confirmed
document summaries, selected-text explanations, and collection-subtree
cross-checks. It supports PDFs, EPUBs, Zotero HTML snapshots, XHTML visible
text, and directly readable text attachments such as TXT, Markdown, CSV/TSV,
JSON, XML, BibTeX, and TeX. Some of those direct formats are plugin additions,
not formats Zotero itself full-text indexes. Word-processing containers such as
DOCX, ODT, and RTF remain unsupported until dedicated parsers can extract them
safely.

On Zotero versions where structured-document-text access is unavailable, EPUB
and HTML extraction uses Zotero's existing full-text cache. An unindexed EPUB
therefore needs to be indexed by Zotero first; this plugin does not silently
change full-text indexing state while displaying its consent preview.
It sends extracted text only after a preview identifies the provider, model,
files, approximate size, and warnings. API keys are stored in the platform
Login Manager and are never written to Zotero preferences, notes, logs, or the
XPI.

## Build

From this directory:

```sh
python3 scripts/build.py
```

The generated `dist/ai-zotero.xpi` is intentionally ignored by source control.
The build is dependency-free and creates a deterministic ZIP/XPI from the
plugin source. `python3 scripts/run-tests.py` builds and inspects the XPI and
checks the privacy invariants. `python3 scripts/run-tests.py --audit` runs the
source-only checks.

## Install for development

Build the XPI and install it through Zotero's Add-ons Manager. The extension
uses the stable ID `ai-zotero@shayprasad`, registers only supported Zotero
plugin APIs, and cleans up listeners, observers, panes, and active requests on
disable, upgrade, uninstall, and application shutdown.

## Provider configuration

Mistral, OpenRouter, and AgentRouter use their OpenAI-compatible chat
completion APIs. AgentRouter's base URL is editable because installations may
use either the `co.agentrouter.org` or legacy `agentrouter.org` gateway. Model
catalogs are cached for 24 hours and can be manually refreshed. A provider or
model is never changed implicitly.

## Source and note safety

Documents are normalized into stable source records and a fingerprint. PDF page
locators are retained when the extractor supplies real boundaries; EPUB/HTML
cache fallbacks and ordinary text use non-page document locators instead of
inventing page 1. Prompts mark document text as untrusted quoted material. Structured
responses are validated against known source IDs before rendering through a
fixed safe HTML renderer. Canonical summaries and cross-check reports are
ordinary Zotero notes with synced relation URNs, readable provenance, and a
preserved Personal notes section. User edits and concurrent sync changes stop
regeneration rather than being overwritten.

This is an initial implementation scaffold. Manual acceptance still needs to
be run against the latest Zotero 9 release on macOS, Windows, and Linux with
user-supplied provider keys, including read-only groups, linked files, reader
windows, provider outages, and sync during generation.

## Support AI for Zotero

If this project is useful to you, you can support its maintenance with a coffee:

<p align="center">
  <a href="https://buymeacoffee.com/shay2k">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee"/>
  </a>
</p>

