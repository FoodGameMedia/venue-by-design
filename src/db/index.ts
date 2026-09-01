import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

declare global {
  var __venueByDesignPostgresClient: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__venueByDesignPostgresClient ??
  postgres(connectionString, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__venueByDesignPostgresClient = client;
}

export const db = drizzle(client, { schema });
