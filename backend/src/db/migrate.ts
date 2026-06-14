import path from "node:path";
import { logger } from "../lib/logger.js";
import fs from "node:fs";
import { query } from "./db.js";

const migrateDir = path.resolve(process.cwd(), "src", "migrations");

async function runMigration() {
  logger.info(`Looking for migrations in ${migrateDir}`);

  const files = fs
    .readdirSync(migrateDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.info(`no migrations found!`);
    return;
  }
  for (const file of files) {
    const fullpath = path.join(migrateDir, file);
    const sql = fs.readFileSync(fullpath, "utf8");

    logger.info(`Running migrations`, file);

    await query(sql);

    logger.info(`Finished migration`);
  }
}

runMigration()
  .then(() => {
    logger.info("All migration run successfully");
    process.exit(0);
  })
  .catch((e) => {
    logger.error(`error occcur while migrating ${(e as Error).message}`);
    process.exit(1);
  });
