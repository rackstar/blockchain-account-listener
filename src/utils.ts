import * as util from "util";

/**
 * Returns a string representation of the given data
 * Will recurse the formatting data up to the maximum call stack (useful for highly nested data)
 * @param data
 */
export const inspect = (data: any): string =>
  util.inspect(data, { depth: null });

/**
 * Delay function using setTimeout and promise
 * @param ms - delay in milliseconds
 */
export const delay: (ms: number) => void = util.promisify(setTimeout);

/**
 * Returns a random number between min (inclusive) and max (inclusive)
 * @param min
 * @param max
 */
export const random = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;
