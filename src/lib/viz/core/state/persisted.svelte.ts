import { browser } from '$app/environment';

/**
 * A rune-backed state object that can be saved to / restored from localStorage.
 *
 * Restore is deliberately *explicit* (call `restore()` from `onMount`) rather
 * than happening in the constructor: the page is prerendered, so SSR and the
 * first client render must use the same defaults or hydration mismatches. Saving
 * is also explicit (the cohend settings panel has Save / Clear buttons), so we
 * don't auto-persist on every keystroke.
 *
 * `restore` only applies keys that already exist in the defaults, match the
 * default's type, and pass the optional validator — so a blob written by an
 * older schema (or edited by hand) can't inject stale fields or values the
 * current UI couldn't produce.
 */

/**
 * Merge a parsed blob into `current`, dropping any key that is unknown, has a
 * different type than the current default, is a non-finite number, or fails
 * the optional validator. This is the schema-drift guard behind `restore`;
 * it's a pure function so it can be unit-tested without a browser.
 */
export function sanitizeStored<T extends object>(
	current: T,
	parsed: Partial<T>,
	validate?: (key: keyof T, value: T[keyof T]) => boolean
): { next: T; dropped: (keyof T)[] } {
	const next = { ...current };
	const dropped: (keyof T)[] = [];
	for (const k of Object.keys(next) as (keyof T)[]) {
		if (!(k in parsed) || parsed[k] === undefined) continue;
		const v = parsed[k] as T[keyof T];
		const ok =
			typeof v === typeof next[k] &&
			(typeof v !== 'number' || Number.isFinite(v)) &&
			(validate?.(k, v) ?? true);
		if (ok) next[k] = v;
		else dropped.push(k);
	}
	return { next, dropped };
}

export class Persisted<T extends object> {
	current = $state<T>({} as T);
	#key: string;
	#validate?: (key: keyof T, value: T[keyof T]) => boolean;

	constructor(key: string, initial: T, validate?: (key: keyof T, value: T[keyof T]) => boolean) {
		this.#key = key;
		this.current = { ...initial };
		this.#validate = validate;
	}

	/** Returns the keys present in the stored blob but dropped as invalid, so
	 * the caller can surface that the saved state was only partially applied. */
	restore(): (keyof T)[] {
		if (!browser) return [];
		try {
			const raw = localStorage.getItem(this.#key);
			if (!raw) return [];
			const parsed = JSON.parse(raw) as Partial<T>;
			const { next, dropped } = sanitizeStored(this.current, parsed, this.#validate);
			this.current = next;
			return dropped;
		} catch {
			// corrupt/unavailable storage: keep the defaults
			return [];
		}
	}

	/** The raw stored blob (for dirty-checking), or null if nothing is saved. */
	raw(): string | null {
		if (!browser) return null;
		try {
			return localStorage.getItem(this.#key);
		} catch {
			return null;
		}
	}

	/** Returns whether the write succeeded, so callers can confirm to the user. */
	save(): boolean {
		if (!browser) return false;
		try {
			localStorage.setItem(this.#key, JSON.stringify(this.current));
			return true;
		} catch {
			// storage failure (private mode, quota)
			return false;
		}
	}

	/** Returns whether the removal succeeded. */
	clear(): boolean {
		if (!browser) return false;
		try {
			localStorage.removeItem(this.#key);
			return true;
		} catch {
			return false;
		}
	}
}
