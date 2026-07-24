import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// 2026-07-23: the default in-memory cache (no R2/D1/DO wired up) caused
// unstable_cache() calls to hang indefinitely rather than falling back
// gracefully -- time-based revalidation needs a real queue. Matches the
// same R2 + D1 + Durable Object queue setup already proven working in
// freejobpost and pitchroom.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
});
