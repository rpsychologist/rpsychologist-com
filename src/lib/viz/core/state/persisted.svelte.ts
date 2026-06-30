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
 * `restore` only copies keys that already exist in the defaults, so a stored
 * blob from an older schema can't inject stale fields.
 */
export class Persisted<T extends object> {
	current = $state<T>({} as T);
	#key: string;

	constructor(key: string, initial: T) {
		this.#key = key;
		this.current = { ...initial };
	}

	restore() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(this.#key);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<T>;
			const next = { ...this.current };
			for (const k of Object.keys(next) as (keyof T)[]) {
				if (k in parsed && parsed[k] !== undefined) next[k] = parsed[k] as T[keyof T];
			}
			this.current = next;
		} catch {
			// ignore corrupt/unavailable storage
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
