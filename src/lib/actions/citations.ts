/**
 * Reference popovers for in-text citations (rehype-citation; see the Citations
 * note in docs/architecture.md). Each cite link points at its `#bib-…` entry, so
 * the popover clones that entry, keeping italics and the DOI link, rather than
 * shipping a second copy per cite. Without JS the link just jumps to the list.
 *
 * Mouse: hover opens, with a grace period to move into the popover. Keyboard:
 * focus opens, Escape closes, Enter jumps. Touch: the first tap opens, the
 * second jumps.
 * Delegated listeners for the same reason as enhanceCode: the article node
 * survives post → post navigations.
 */
const CITE = '[id^="citation--"] a[href^="#bib-"]';

export function enhanceCitations(node: HTMLElement) {
	const pop = document.createElement('div');
	pop.className = 'cite-pop';
	pop.id = 'cite-pop';
	pop.setAttribute('role', 'tooltip');
	pop.hidden = true;
	document.body.append(pop);

	let anchor: HTMLAnchorElement | null = null;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let lastPointer = '';

	const citeFrom = (t: EventTarget | null) =>
		t instanceof Element ? t.closest<HTMLAnchorElement>(CITE) : null;

	function show(link: HTMLAnchorElement) {
		clearTimeout(hideTimer);
		if (anchor === link) return;
		const entry = node.querySelector(`[id="${CSS.escape(link.hash.slice(1))}"]`);
		if (!entry) return;
		anchor?.removeAttribute('aria-describedby');
		anchor = link;
		link.setAttribute('aria-describedby', pop.id);
		const body = document.createElement('div');
		body.className = 'cite-pop-entry';
		body.append(...Array.from(entry.childNodes, (n) => n.cloneNode(true)));
		pop.replaceChildren(body);
		pop.style.left = pop.style.top = '0px';
		pop.hidden = false;
		place(link);
	}

	function hide() {
		clearTimeout(hideTimer);
		anchor?.removeAttribute('aria-describedby');
		anchor = null;
		pop.hidden = true;
	}

	const hideSoon = () => {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hide, 200);
	};

	// Page coordinates, so the popover scrolls with the text and needs no scroll
	// listener. Below the line by default, above it when the viewport runs out.
	function place(link: HTMLAnchorElement) {
		const r = link.getClientRects()[0] ?? link.getBoundingClientRect();
		const gap = 8;
		const margin = 12;
		const width = Math.min(pop.offsetWidth, innerWidth - 2 * margin);
		const left = Math.min(Math.max(r.left, margin), innerWidth - width - margin);
		const below = r.bottom + gap + pop.offsetHeight <= innerHeight;
		const top = below ? r.bottom + gap : r.top - gap - pop.offsetHeight;
		pop.style.left = `${left + scrollX}px`;
		pop.style.top = `${top + scrollY}px`;
	}

	const onPointerDown = (e: PointerEvent) => {
		lastPointer = e.pointerType;
		if (!pop.hidden && !pop.contains(e.target as Node) && !citeFrom(e.target)) hide();
	};
	const onOver = (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		const link = citeFrom(e.target);
		if (link) show(link);
	};
	const onOut = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' && citeFrom(e.target)) hideSoon();
	};
	const onClick = (e: MouseEvent) => {
		const link = citeFrom(e.target);
		if (!link) return;
		// Touch (and pen): the first tap reads the reference, a second tap jumps.
		if (lastPointer === 'mouse' || anchor === link) return hide();
		e.preventDefault();
		show(link);
	};
	const onFocusIn = (e: FocusEvent) => {
		const link = citeFrom(e.target);
		if (link && lastPointer !== 'touch') show(link);
	};
	const onFocusOut = (e: FocusEvent) => {
		if (citeFrom(e.target)) hideSoon();
	};
	const onKey = (e: KeyboardEvent) => {
		lastPointer = '';
		if (e.key === 'Escape' && !pop.hidden) hide();
	};

	node.addEventListener('pointerover', onOver);
	node.addEventListener('pointerout', onOut);
	node.addEventListener('click', onClick);
	node.addEventListener('focusin', onFocusIn);
	node.addEventListener('focusout', onFocusOut);
	pop.addEventListener('pointerenter', () => clearTimeout(hideTimer));
	pop.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && hideSoon());
	document.addEventListener('pointerdown', onPointerDown, true);
	document.addEventListener('keydown', onKey);

	return {
		destroy() {
			clearTimeout(hideTimer);
			document.removeEventListener('pointerdown', onPointerDown, true);
			document.removeEventListener('keydown', onKey);
			pop.remove();
		}
	};
}
