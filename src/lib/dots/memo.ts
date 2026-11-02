/**
 * Memoize a layout by a string key. Layouts are pure functions of their inputs,
 * so a plain (non-reactive) cache is right: it only spares recomputing a state
 * the reader has already visited.
 */
export function memoize<A extends unknown[], R>(
	key: (...args: A) => string,
	fn: (...args: A) => R
): (...args: A) => R {
	const cache = new Map<string, R>();
	return (...args) => {
		const k = key(...args);
		let v = cache.get(k);
		if (v === undefined) {
			v = fn(...args);
			cache.set(k, v);
		}
		return v;
	};
}
