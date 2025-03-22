export async function sleep(ms: number) {
  console.log("Waiting for " + ms + "ms");
  return new Promise((resolve) => setTimeout(resolve, ms));
}
