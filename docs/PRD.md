# Alexandria — Product Requirements Document

> Read. Listen. Capture. Share.

Alexandria is a multimodal reading platform that synchronizes text and audio at a phrase-by-phrase level, allowing users to seamlessly switch between reading and listening. It transforms reading into social expression by letting users extract highlights ("fragments") and convert them into shareable, branded visual content.

---

## Table of Contents

1. [Vision](#vision)
2. [Target Users](#target-users)
3. [MVP Scope](#mvp-scope)
4. [Core Features](#core-features)
5. [Security & DRM](#security--drm)
6. [Key Metrics (KPIs)](#key-metrics-kpis)
7. [Risks](#risks)
8. [Growth Strategy](#growth-strategy)
9. [Roadmap](#roadmap)
10. [Future Enhancements](#future-enhancements)

---

## Vision

To become the leading platform where knowledge is not only consumed but expressed — turning reading into a social identity behavior.

**Core value proposition:**
- Synchronized Reading + Listening
- Frictionless Knowledge Capture
- Instant Social Content Creation

---

## Target Users

### Primary — "Insight Creators"
- Age: 30–70
- Geography: Spanish-speaking users (Latin America, US Hispanic market, Spain)
- Profile: Professionals, learners, and growth-oriented individuals active on LinkedIn, Instagram, etc.

### Secondary — Authors & Publishers
- Independent authors, publishing houses, content creators seeking distribution and visibility

---

## MVP Scope

**Goal:** Validate the multimodal reading experience and social sharing behavior as a growth engine.

---

## Core Features

### 1. Authentication
- Google Sign-In
- Facebook Login
- Apple Sign-In (iOS)
- Email + Password

### 2. Content Library
- Initial catalog: 12 Spanish-language books
- Categories: Leadership, Personal Development, Business
- Only titles with existing audio + text

### 3. Synchronized Reading Engine
- Phrase-by-phrase synchronization between text and audio
- Visual highlight of active phrase
- Controls: Play/Pause, speed adjustment
- Seamless switching: Reading ↔ Listening

### 4. Highlight & Fragment System
- Select text while reading to save as "fragments"
- Voice-triggered highlight (future)
- Per-book Fragment Sheet per user:
  - Store, combine (non-consecutive), and edit fragments

### 5. Social Content Generator _(Core Differentiator)_
- Transform fragments into shareable visual quote cards
- Platform-specific formats: LinkedIn, Instagram, Facebook, WhatsApp, TikTok (future), Snapchat
- Each card includes: quote text, author name, book title, Alexandria watermark
- Template-based design (MVP); server-side rendering

### 6. Sharing Engine
- One-click sharing
- Export as image
- Deep links (future)
- Attribution tracking (future)

### 7. Offline Mode
- Download books for offline reading/listening
- Store fragments offline
- Sync progress when back online

### 8. Subscription Model

| Plan        | Monthly | Annual |
|-------------|---------|--------|
| Individual  | $9.99   | $89    |
| Dual Reader | $14.99  | $135   |

- Free trial included
- Up to 2 simultaneous streams

### 9. Author / Publisher Module
- Upload books (text + audio + metadata)
- Hosting tiers: 1 book / 3 books / 12 books
- Revenue sharing model
- Basic analytics: downloads, reads, shares, storage
- Cloud storage for books, audio files, and generated images

---

## Security & DRM

- Encrypted content streaming
- Limited offline access
- No raw file downloads
- Controlled sharing (fragments only)

---

## Key Metrics (KPIs)

### User
- Sign-up conversion rate
- Trial → Paid conversion
- Retention: 7-day, 30-day

### Engagement
- Highlights per user
- Fragments created
- Time spent reading/listening

### Growth
- Shares per user
- Referral installs
- Viral coefficient

### Content
- Completion rate per book
- Most shared fragments
- Most popular titles

---

## Risks

| Area      | Risk                                                  |
|-----------|-------------------------------------------------------|
| Market    | Competition from Kindle/Audible, Spotify, Apple Books |
| Technical | Complexity of phrase-level sync; mobile performance   |
| Business  | Content licensing costs; user acquisition cost        |

---

## Growth Strategy

### Phase 1 — MVP Launch
- Target Spanish-speaking communities
- Direct author partnerships
- Referral program

### Phase 2
- Influencer collaborations
- Social content virality
- Expand catalog

### Phase 3
- English market
- Publisher partnerships
- Institutional deals

---

## Roadmap

| Phase | Name         | Focus                                                       | Services                                 |
|-------|--------------|-------------------------------------------------------------|------------------------------------------|
| 0     | Planning     | Finalize PRD, legal review, design system                   | —                                        |
| 1     | Build        | Auth, reader engine, library                                | `api`, `db`, `web`, `proxy`, `storage`   |
| 2     | Social Layer | Fragments, image generation, sharing                        | `image-gen`, `worker`, `cache`, `search` |
| 3     | Launch       | Beta release, feedback loop, optimization                   | All services                             |
| 4     | Scale        | English market, publisher partnerships, institutional deals | Kubernetes, S3, CDN                      |

---

## Future Enhancements

- AI-generated voice narration
- AI-generated visual styles for quote cards
- Smart book recommendations
- Community features: follow users, like fragments
- In-app social feed
- Author monetization tools
