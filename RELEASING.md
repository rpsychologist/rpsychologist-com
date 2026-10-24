# Releasing a viz app version

The interactive visualization apps (`/cohend`, `/correlation`, …) each carries its own semver line and a public changelog (`/<app>/changelog`). This is the maintainer's guide; the
architecture is documented in `docs/architecture.md` and `src/lib/viz/core/changelog.ts`.

## The one thing to remember

**When you change an app in a way a reader could notice, add a changelog
entry.** Everything else is automated or validated — a missing entry is the
only failure nothing can catch.

## What the version numbers mean

Semver, defined around what the app _shows_, not its code:

- **major** — displayed results change, a state-bearing URL parameter breaks,
  or a documented control is removed. A reader's cited numbers no longer hold.
- **minor** — new capability; existing outputs and share links unchanged.
- **patch** — visual, UX, performance, accessibility.

## How to release

1. Edit `src/lib/viz/<app>/changelog.json`: add a release at the **top**
   (newest first) with today's date and entries grouped under the
   [Keep a Changelog](https://keepachangelog.com) categories
   (`added` / `changed` / `deprecated` / `removed` / `fixed` / `security`)
   plus `breaking` — rendered first as "Breaking changes", the heading a
   non-dev reader checks. A release with `breaking` or `removed` entries
   must bump the major version — the validator enforces this, so the heading
   and the number cannot disagree.
2. Commit and merge to `main` as usual. The build validates the data
   (malformed entries fail `pnpm check`, the tests, and the build), and the
   displayed version in the cite FAQ and the changelog page update themselves.
3. That's it. Once CI passes on `main`, its `tag` job
   (`.github/workflows/ci.yml`) creates the `<app>-v<x.y.z>` git tag on the
   commit that landed the version on `main` and pushes it. The tag is the recoverable source snapshot for the cited version — the
   "source" links on the changelog pages point at it.

`pnpm check:tags` verifies every recorded release has its tag (it fails on a
branch with a not-yet-merged bump — expected). No version announcements in
the UI, by design: the changelog page is the record.
