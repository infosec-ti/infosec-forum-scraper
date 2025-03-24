export async function sleep(ms: number) {
  console.log("Waiting for " + ms + "ms");
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function log(message: string) {
  if (process.argv.includes("verbose")) {
    console.log(message);
  }
}
