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

	save() {
		if (!browser) return;
		try {
			localStorage.setItem(this.#key, JSON.stringify(this.current));
		} catch {
			// ignore storage failures (private mode, quota)
		}
	}

	clear() {
		if (!browser) return;
		try {
			localStorage.removeItem(this.#key);
		} catch {
			// ignore
		}
	}
}
