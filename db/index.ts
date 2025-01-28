import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create the connection with proper configuration
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Max number of connections
  idle_timeout: 20, // Max seconds to keep unused connections
  connect_timeout: 10, // Max seconds to wait for connection
  prepare: false, // Disable prepared statements for better compatibility
  connection: {
    application_name: "travel-planner",
  },
  types: {
    // Enable BigInt parsing for large numbers
    bigint: postgres.BigInt,
  },
  onError: (err) => {
    console.error("Database connection error:", err);
  },
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for direct queries if needed
export { client as sql };