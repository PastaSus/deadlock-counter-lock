async function main(): Promise<void> {
  if (process.env.ASSET_SYNC !== "1") return;
  console.log("ASSET_SYNC=1: refreshing official assets before build...");
  const { syncAssets } = await import("./sync-assets");
  await syncAssets();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
