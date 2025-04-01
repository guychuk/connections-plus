/**
 * Get k random distinct numbers in [1, n].
 * @param {number} n number of options.
 * @param {number} k number of choices (0 <= k <= n) [pass -1 for k=n which is the default].
 * @returns an array with k random choices from [1, n].
 */
export function getRandomNums(n, k = -1) {
  let options = Array.from({ length: n }, (_, index) => index + 1);
  let chosen = 0;

  if (k < 0) {
    k = n;
  }

  while (chosen < k) {
    // Choose a random index
    const index = Math.floor(Math.random() * (n - chosen)) + chosen;

    // Swap the values
    [options[chosen], options[index]] = [options[index], options[chosen]];

    // Save the choice
    chosen++;
  }

  return options.slice(0, k);
}

/**
 * Shuffle an array in-place.
 * @param {array} array
 */
export function shuffleArray(array) {
  const perm = getRandomNums(array.length);

  for (let i = 0; i < array.length; i++) {
    [array[i], array[perm[i] - 1]] = [array[perm[i] - 1], array[i]];
  }
}
