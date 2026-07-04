// Settle-before-apply for numeric inputs that live-drive a chart. Typed
// digits are deferred (each keystroke of "104" is a value the user never
// meant — applying Mean = 1 to a frozen axis frame throws the cloud
// off-screen and reads as broken), while arrow keys, the native stepper,
// paste, and autofill carry complete values and apply immediately.
//
// Gesture detection (measured in Chromium/Firefox/WebKit, 2026-07-04):
// typing uniformly emits `inputType` 'insertText' / 'delete*'; steppers and
// arrows emit a plain Event (Chromium/WebKit) or 'insertReplacementText'
// (Firefox). Only the typing side is needed, and it is the stable one.

/** Clears typical inter-keystroke gaps, including a short mid-number pause. */
const SETTLE_MS = 500;

function isTyping(e: Event): boolean {
	const t = 'inputType' in e ? (e as InputEvent).inputType : undefined;
	return t === 'insertText' || (t !== undefined && t.startsWith('delete'));
}

export interface TypedSettle {
	/** Apply now, or after the settle delay when `e` came from typing. */
	run(e: Event, apply: () => void): void;
	/** Run the pending apply immediately (commit on change/blur, unmount). */
	flush(): void;
	/** Drop the pending apply (the input has moved on to an invalid value). */
	cancel(): void;
}

export function typedSettle(delay = SETTLE_MS): TypedSettle {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: (() => void) | null = null;
	const cancel = () => {
		clearTimeout(timer);
		pending = null;
	};
	return {
		run(e, apply) {
			cancel();
			if (!isTyping(e)) {
				apply();
				return;
			}
			pending = apply;
			timer = setTimeout(() => {
				pending = null;
				apply();
			}, delay);
		},
		flush() {
			const p = pending;
			cancel();
			p?.();
		},
		cancel
	};
}
