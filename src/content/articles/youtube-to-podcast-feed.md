---
title: "Turning YouTube channels into a private podcast feed"
description: "Why podcast clients are so fussy about RSS, what it takes to bundle a whole Python media stack into a Mac app, and how to keep the feed on your own network."
date: 2026-08-04
tags: ['Python', 'Self-hosting', 'Docker', 'macOS']
featured: false
glyph: '◉'
tone: 'moss'
---

Podcast apps are the best audio player on your phone, and they will only talk to one thing: an RSS feed with enclosure links. That is the whole interface. If you can produce a valid feed and serve MP3s, you have a podcast — regardless of where the audio actually came from.

PodcastSync exists to make a YouTube channel look like that.

## The feed is the hard part

Writing an RSS document is trivial. Writing one that every podcast client accepts is not. The rules that actually bite:

**Enclosures need a byte length.** Not an estimate — `length` is a required attribute, and clients will misbehave or refuse the item without it. That means knowing the final file size before you write the feed, which means the download has to complete first.

```xml
<enclosure
  url="http://192.168.1.40:8765/media/abc123.mp3"
  length="41829376"
  type="audio/mpeg" />
```

**GUIDs must be stable forever.** If the GUID changes, every client re-downloads the episode and shows it as new. Deriving it from the video ID is the only sane choice:

```xml
<guid isPermaLink="false">yt:VIDEO_ID</guid>
```

**Dates must be RFC-822.** Not ISO 8601, not a Unix timestamp. `pubDate` has its own format and clients are unforgiving.

**URLs must be absolute and reachable.** `http://192.168.1.40:8765/...` is a perfectly good feed URL on your LAN. It is not reachable from outside your house, and that is the point.

## LAN-only by design

The feed server binds to your local network and hands out URLs using the machine's LAN address. Your phone, on the same Wi-Fi, subscribes. Nothing is exposed to the internet, no port forwarding, no tunnel, no account.

The trade-off is honest: the feed does not work on cellular. For a personal archive of channels you actually want to keep up with, that is usually the right bargain — and the alternative, exposing a media server publicly, is a much bigger commitment than most people want to make for podcasts.

## Bundling a Python stack into a Mac app

The backend is Python. It needs `yt-dlp` for extraction and `ffmpeg`/`ffprobe` for transcoding to 192 kbps MP3 with embedded cover art. Asking a non-developer to install Homebrew, a Python version, and two media tools before the app works is how you get zero users.

So the DMG bundles all of it. The packaged app carries its own Python runtime, `yt-dlp`, and `ffmpeg`, and the menu-bar shell launches the backend as a child process.

That decision cascades:

- **The app gets large.** Tens of megabytes before your first download. Unavoidable.
- **`yt-dlp` goes stale fast.** YouTube changes its extraction surface constantly, so the bundled copy needs an update path that does not require rebuilding the whole app.
- **Gatekeeper blocks the first launch.** Ad-hoc signed, so it is right-click → Open the first time.

## Polling without hammering

Sources are checked on a schedule — every 30 minutes by default, configurable. Each source maps to one feed.

There is a meaningful choice here around the YouTube Data API. With an API key, you get full video history and proper handle resolution. Without one, the app falls back to YouTube's public RSS feeds, which expose roughly the fifteen most recent videos.

```text
With API key    → complete history, handles resolve cleanly
Without         → last ~15 videos per channel, zero setup
```

Making the key optional is the right call. It means the app works the moment you install it, and gets better if you decide to go and get a key.

## What I'd flag

The honest caveats, in the order they will annoy you:

1. **It is a scraper.** `yt-dlp` is excellent and it breaks regularly. Expect to update it.
2. **LAN only.** Deliberate, but worth repeating.
3. **Disk grows.** 192 kbps MP3 is roughly 90 MB per hour of audio, and nothing is deleted automatically.

What you get in return is a podcast feed that no platform can revoke, that keeps working offline, and that lives entirely on hardware you own.
