import type { Action } from 'svelte/action';

export interface DragEvent {
	/** Movement since the previous move, in CSS pixels. */
	dx: number;
	dy: number;
	/** Total movement since drag start. */
	totalX: number;
	totalY: number;
}

export interface DragOptions {
	onstart?: () => void;
	ondrag?: (e: DragEvent) => void;
	onend?: () => void;
}

/**
 * Pointer-drag action (replaces react-use-gesture / react-draggable). Uses
 * pointer events + capture so a single code path covers mouse and touch and the
 * drag keeps tracking even if the pointer leaves the element. Reports deltas;
 * the consumer decides what to pan. `touch-action: none` is set so the browser
 * doesn't hijack the gesture for scrolling.
 */
export const drag: Action<HTMLElement | SVGElement, DragOptions | undefined> = (node, options) => {
	let opts = options ?? {};
	let lastX = 0;
	let lastY = 0;
	let startX = 0;
	let startY = 0;
	let dragging = false;
	let pointerId = -1;

	const prevTouchAction = (node as HTMLElement).style?.touchAction;
	(node as HTMLElement).style.touchAction = 'none';

	function onPointerDown(e: PointerEvent) {
		// Primary button only: a right-click's pointerup can be swallowed by the
		// context menu, which would leave the drag (and the consumer's onstart
		// state) stuck. Ignoring a second pointer while dragging keeps a stray
		// extra finger from resetting the deltas mid-pan.
		if (e.button !== 0 || dragging) return;
		dragging = true;
		pointerId = e.pointerId;
		lastX = startX = e.clientX;
		lastY = startY = e.clientY;
		node.setPointerCapture(e.pointerId);
		opts.onstart?.();
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging || e.pointerId !== pointerId) return;
		opts.ondrag?.({
			dx: e.clientX - lastX,
			dy: e.clientY - lastY,
			totalX: e.clientX - startX,
			totalY: e.clientY - startY
		});
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		if (!dragging || e.pointerId !== pointerId) return;
		dragging = false;
		if (node.hasPointerCapture(e.pointerId)) node.releasePointerCapture(e.pointerId);
		opts.onend?.();
	}

	// Cast to EventListener: the node is HTMLElement | SVGElement, so the typed
	// PointerEvent overload of addEventListener doesn't resolve across the union.
	const down = onPointerDown as EventListener;
	const move = onPointerMove as EventListener;
	const up = onPointerUp as EventListener;

	node.addEventListener('pointerdown', down);
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerup', up);
	node.addEventListener('pointercancel', up);

	return {
		update(next) {
			opts = next ?? {};
		},
		destroy() {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('pointercancel', up);
			(node as HTMLElement).style.touchAction = prevTouchAction ?? '';
		}
	};
};
