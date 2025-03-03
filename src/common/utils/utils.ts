export async function sleep(ms: number) {
  console.log(`Sleeping for ${ms} ms`);
  return setTimeout(async () => await Promise.resolve(), ms);
}
