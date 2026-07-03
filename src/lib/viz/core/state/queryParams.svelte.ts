// URL ⇄ state helpers for shareable viz links (the old apps used use-query-params;
// this is the dependency-free equivalent). A codec map says how each state key
// encodes to / decodes from a string; `readParams` pulls overrides off the
// current URL on mount, and `buildQuery` produces a shareable query string,
// omitting keys still at their default so the URL stays short.

export interface Codec<T> {
	encode: (v: T) => string;
	decode: (s: string) => T;
}

export const num: Codec<number> = {
	encode: (v) => String(v),
	decode: (s) => Number(s)
};

/**
 * Like `num`, but rounds to `decimals` places on encode so shared URLs stay
 * short: a value dragged to 3.9298245614035086 serializes as `3.93`. Only the
 * URL is quantized — live state keeps full precision. Optional `min`/`max`
 * bound decoding: an out-of-range value decodes to NaN, which `readParams`
 * skips, so a crafted param (`?SD=0`, `?CER=150`) falls back to the default
 * instead of poisoning state with values the UI itself forbids.
 */
export const numFixed = (decimals: number, min = -Infinity, max = Infinity): Codec<number> => ({
	encode: (v) => String(Number(v.toFixed(decimals))),
	decode: (s) => {
		const v = Number(s);
		return v < min || v > max ? NaN : v;
	}
});

export const str: Codec<string> = {
	encode: (v) => v,
	decode: (s) => s
};

export const bool: Codec<boolean> = {
	encode: (v) => (v ? '1' : '0'),
	decode: (s) => s === '1' || s === 'true'
};

export type CodecMap<T> = { [K in keyof T]?: { param: string; codec: Codec<T[K]> } };

/**
 * Decode the params present in `search` into a partial state patch. Params
 * that decode to NaN (malformed or out-of-range — see `numFixed`) can't poison
 * state: they're skipped, and reported in `invalid` so the caller can tell the
 * user the link was only partially applied instead of silently showing
 * defaults as if they were the shared values.
 */
export function readParams<T extends object>(
	map: CodecMap<T>,
	search: string
): { patch: Partial<T>; invalid: (keyof T)[] } {
	const params = new URLSearchParams(search);
	const patch: Partial<T> = {};
	const invalid: (keyof T)[] = [];
	for (const key of Object.keys(map) as (keyof T)[]) {
		const entry = map[key];
		if (!entry) continue;
		const raw = params.get(entry.param);
		if (raw === null) continue;
		const value = entry.codec.decode(raw);
		if (typeof value === 'number' && Number.isNaN(value)) {
			invalid.push(key);
			continue;
		}
		patch[key] = value;
	}
	return { patch, invalid };
}

/** Build a `?a=1&b=2` string for the given values, dropping keys equal to `defaults`. */
export function buildQuery<T extends object>(
	map: CodecMap<T>,
	values: T,
	defaults?: Partial<T>
): string {
	const params = new URLSearchParams();
	for (const key of Object.keys(map) as (keyof T)[]) {
		const entry = map[key];
		if (!entry) continue;
		if (defaults && values[key] === defaults[key]) continue;
		params.set(entry.param, entry.codec.encode(values[key]));
	}
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}
