import "server-only";

import dns from "node:dns";
import { MongoClient, type Db } from "mongodb";

const DEFAULT_DB_NAME = "rasacafe";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("The database isn't configured. Set MONGODB_URI in the server environment.");
  }
}

export const databaseConfigured = Boolean(process.env.MONGODB_URI);

/** A safe message for the admin; details go to the server log. */
export function describeDatabaseError(error: unknown): string {
  if (error instanceof DatabaseNotConfiguredError) return error.message;
  return "Couldn't reach the database. Please try again in a moment.";
}

/** Database named in the URI path, e.g. mongodb+srv://host/rasacafe?... */
function dbNameFromUri(uri: string): string | undefined {
  return /^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/.exec(uri)?.[1] || undefined;
}

function connect(uri: string): Promise<MongoClient> {
  const client = () =>
    new MongoClient(uri, {
      maxPoolSize: 10,
      maxIdleTimeMS: 60_000,
      serverSelectionTimeoutMS: 10_000,
      appName: "rasa-cafe",
    }).connect();

  return client().catch((error: NodeJS.ErrnoException) => {
    // Some home/ISP resolvers refuse the SRV lookups mongodb+srv:// needs.
    if (error?.syscall !== "querySrv") throw error;
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    return client();
  });
}

// One client per server process, kept on globalThis so dev hot reloads and
// warm serverless invocations reuse the same connection pool.
const cache = globalThis as typeof globalThis & { _rasaMongo?: Promise<MongoClient> };

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();

  cache._rasaMongo ??= connect(uri).catch((error) => {
    cache._rasaMongo = undefined;
    throw error;
  });

  const client = await cache._rasaMongo;
  return client.db(process.env.MONGODB_DB || dbNameFromUri(uri) || DEFAULT_DB_NAME);
}
