/**
 * Create the diagnostic-reports storage bucket in Supabase.
 * Run: npx tsx scripts/create-diagnostic-bucket.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error("Failed to list buckets:", listErr);
    process.exit(1);
  }

  if (buckets?.some((b) => b.name === "diagnostic-reports")) {
    console.log("Bucket diagnostic-reports already exists.");
    return;
  }

  const { error } = await supabase.storage.createBucket("diagnostic-reports", {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
  });

  if (error) {
    console.error("Failed to create bucket:", error);
    process.exit(1);
  }

  console.log("Created bucket: diagnostic-reports");
}

main();
