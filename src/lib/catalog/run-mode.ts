/** True when this process must not write catalog rows. */
export function catalogIsDryRun(argv: string[], env: Record<string, string | undefined>): boolean {
  if (argv.includes("--dry-run")) return true;
  if (env.CATALOG_DRY_RUN === "1") return true;
  // `npm run catalog:run --dry-run` sets this and does not forward the flag.
  return env.npm_config_dry_run === "true";
}
