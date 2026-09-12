---
repo: "PodcastSync-Local-Mac-App"
tagline: "YouTube channels as a podcast feed on your own Wi-Fi."
status: "active"
year: "2026"
stack: ["Python", "Swift", "yt-dlp", "ffmpeg", "SQLite"]
highlights:
  - label: "Platform"
    value: "macOS 13+ menu bar app"
  - label: "Polling"
    value: "Every 30 min, configurable"
  - label: "Audio"
    value: "MP3 192 kbps + cover art"
  - label: "Reach"
    value: "LAN only, by design"
order: 2
---

Podcast clients only understand one thing: an RSS feed with enclosure links. PodcastSync makes a YouTube channel look like exactly that, served from your own machine.

Paste a channel or playlist URL. The app polls it, pulls audio as MP3 with embedded cover art, writes a valid feed per source, and serves it on your local network. Subscribe in Apple Podcasts, Downcast, or anything else on the same Wi-Fi.

## Why the packaging is the feature

The backend is Python and needs `yt-dlp`, `ffmpeg`, and `ffprobe`. Asking someone to install Homebrew, a Python runtime, and two media tools before the app works is how you ship to nobody.

So the DMG bundles all of it — runtime included — and the menu-bar shell supervises the backend as a child process. The cost is a large download and an `yt-dlp` that needs updating as YouTube changes. The benefit is that it works the moment you drag it to Applications.

## Notes

- **The YouTube API key is optional.** With one you get full video history and clean handle resolution. Without one the app falls back to YouTube's public RSS feeds, roughly the fifteen most recent videos per channel. Zero-setup first, better if you bother.
- **Feed URLs are LAN addresses.** `http://192.168.x.x:port/...` — reachable from your phone at home, not from cellular. Deliberate: it means no port forwarding, no tunnel, and no media server exposed to the internet.
- **GUIDs are derived from the video ID** and never change. A shifting GUID makes every podcast client re-download the entire back catalogue.
- **Disk grows quietly.** 192 kbps is about 90 MB per hour, and nothing is pruned automatically.

There is a companion deployment for running the same idea on a VPS rather than a Mac, for anyone who wants the feed reachable from anywhere.
