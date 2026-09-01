/**
 * Create the Systems module storage buckets in Supabase.
 * Run: npx tsx scripts/create-procedure-buckets.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

const BUCKETS = [
  {
    name: "procedure-sources",
    description: "Original uploads: Word, PDF and photographs of procedures.",
  },
  {
    name: "procedure-exports",
    description: "Generated PDF packs.",
  },
] as const;

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB, matching diagnostic-reports

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

  for (const bucket of BUCKETS) {
    if (buckets?.some((b) => b.name === bucket.name)) {
      console.log(`Bucket ${bucket.name} already exists.`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: false,
      fileSizeLimit: FILE_SIZE_LIMIT,
    });

    if (error) {
      console.error(`Failed to create bucket ${bucket.name}:`, error);
      process.exit(1);
    }

    console.log(`Created bucket: ${bucket.name}`);
  }
}

main();
