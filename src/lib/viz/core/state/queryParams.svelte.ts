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

export const str: Codec<string> = {
	encode: (v) => v,
	decode: (s) => s
};

export const bool: Codec<boolean> = {
	encode: (v) => (v ? '1' : '0'),
	decode: (s) => s === '1' || s === 'true'
};

export type CodecMap<T> = { [K in keyof T]?: { param: string; codec: Codec<T[K]> } };

/** Decode the params present in `search` into a partial state patch. */
export function readParams<T extends object>(map: CodecMap<T>, search: string): Partial<T> {
	const params = new URLSearchParams(search);
	const out: Partial<T> = {};
	for (const key of Object.keys(map) as (keyof T)[]) {
		const entry = map[key];
		if (!entry) continue;
		const raw = params.get(entry.param);
		if (raw === null) continue;
		const value = entry.codec.decode(raw);
		// Skip values that decode to NaN so a malformed param can't poison state.
		if (typeof value === 'number' && Number.isNaN(value)) continue;
		out[key] = value;
	}
	return out;
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
