import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// R2 requires a one-time dashboard opt-in this account hasn't done yet, so
// this uses OpenNext's default in-memory incremental cache for now: ISR
// still works, it just doesn't share cache across Worker isolates/regions.
// Fine for this app's traffic level — swap in r2-incremental-cache later if
// that matters (create the bucket, add the binding, override here).
export default defineCloudflareConfig();
