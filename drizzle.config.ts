import { defineConfig } from "drizzle-kit";

// Render'ın otomatik eklediği DATABASE_URL'i kullanır
// Format: postgresql://user:password@host:port/dbname?sslmode=require
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL // Direkt kullanabilirsiniz (Render otomatik formatlıyor)
  },
  verbose: true
});