import "dotenv/config";
import { resolvePendingIntakes } from "../../src/lib/intake/resolve";

resolvePendingIntakes()
  .then(() => {
    console.info("Intake resolution finished.");
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Intake resolution failed.");
    process.exitCode = 1;
  });
