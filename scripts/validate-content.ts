import { ContentError, loadAllContent } from "../lib/loaders";

function main(): void {
  try {
    const content = loadAllContent();
    console.log(
      `Content validation passed: patch ${content.config.currentPatch}, ${content.heroes.length} heroes, ${content.items.length} items, ${content.archetypes.length} archetypes, ${content.entries.length} entries.`,
    );
  } catch (error) {
    if (error instanceof ContentError) {
      console.error("Content validation failed.");
      console.error(error.message);
    } else if (error instanceof Error) {
      console.error("Content validation failed.");
      console.error(error.stack ?? error.message);
    } else {
      console.error("Content validation failed.");
      console.error(String(error));
    }
    process.exitCode = 1;
  }
}

main();
