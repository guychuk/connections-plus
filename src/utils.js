/**
 * Get k random distinct numbers in [1, n].
 * @param {number} n number of options.
 * @param {number} k number of choices (0 <= k <= n) [pass -1 for k=n which is the default].
 * @returns an array with k random choices from [1, n].
 */
export const getRandomNums = (n, k = -1) => {
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
};

/**
 * Shuffle an array in-place.
 * @param {array} array
 */
export const shuffleArray = (array) => {
  const perm = getRandomNums(array.length);

  for (let i = 0; i < array.length; i++) {
    [array[i], array[perm[i] - 1]] = [array[perm[i] - 1], array[i]];
  }
};

/**
 * Check if an array contains duplicates.
 * @param {Array} array
 * @returns {boolean} - True if the array contains duplicates, false otherwise.
 */
export const containsDulpicates = (array) => {
  const set = new Set(array);
  return set.size !== array.length;
};

/**
 * Calculate a hashing to a set of tiles.
 * @param {Set} tiles a set of tiles.
 */
export const hashTilesSet = (tiles) => {
  return JSON.stringify([...tiles].sort());
};

/**
 * Create an array of positions.
 * @param {number} rows - The number of rows.
 * @param {number} cols - The number of columns.
 * @returns {Array} - An array of positions.
 */
export const makePositions = (rows, cols) => {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      return {
        row,
        col,
      };
    })
  ).flat();
};
