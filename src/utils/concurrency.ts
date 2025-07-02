/**
 * Execute a function on array items with limited concurrency
 * This implementation avoids stack overflow, race conditions, and type safety issues
 */
export async function parallelMapLimit<T, R>(
  arr: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (arr.length === 0) {
    return [];
  }

  const results: R[] = new Array(arr.length);
  let nextIndex = 0;

  // Create a worker function that processes items sequentially
  const worker = async (): Promise<void> => {
    while (nextIndex < arr.length) {
      const currentIndex = nextIndex++;
      const item = arr[currentIndex];
      
      if (item !== undefined) {
        results[currentIndex] = await fn(item);
      }
    }
  };

  // Start the specified number of workers
  const workers = Array(Math.min(limit, arr.length))
    .fill(null)
    .map(() => worker());

  // Wait for all workers to complete
  await Promise.all(workers);

  return results;
} 