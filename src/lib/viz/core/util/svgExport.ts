// Download an on-page SVG as a standalone .svg file (replaces the old svgsaver
// dependency). The chart styles itself via CSS classes and custom properties on
// the page, none of which travel with a bare clone — so we inline the computed
// value of a small set of presentational properties onto each node, walking the
// original and clone in lockstep. That keeps the exported file faithful without
// pulling in a serialization library.

const PROPS = [
	'fill',
	'fill-opacity',
	'stroke',
	'stroke-width',
	'stroke-opacity',
	'stroke-dasharray',
	'stroke-linecap',
	'stroke-linejoin',
	'opacity',
	'color',
	'font-family',
	'font-size',
	'font-weight',
	'text-anchor',
	'dominant-baseline'
];

function inlineStyles(source: Element, target: Element) {
	const computed = getComputedStyle(source);
	let decl = '';
	for (const prop of PROPS) {
		const value = computed.getPropertyValue(prop);
		if (value) decl += `${prop}:${value};`;
	}
	target.setAttribute('style', decl);

	const sourceChildren = source.children;
	const targetChildren = target.children;
	for (let i = 0; i < sourceChildren.length; i++) {
		inlineStyles(sourceChildren[i], targetChildren[i]);
	}
}

function serializeWithStyles(svg: SVGSVGElement): string {
	const clone = svg.cloneNode(true) as SVGSVGElement;
	clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	inlineStyles(svg, clone);
	return new XMLSerializer().serializeToString(clone);
}

/** Trigger a client-side download of `blob` (also used for CSV export). */
export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadSvg(svg: SVGSVGElement, filename: string) {
	const blob = new Blob([serializeWithStyles(svg)], {
		type: 'image/svg+xml;charset=utf-8'
	});
	downloadBlob(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

/**
 * Rasterize the SVG to a PNG at `scale`x its rendered size (replaces the old
 * save-svg-as-png dependency). The styled markup is loaded into an <img> via a
 * data URL — same-document SVG keeps the canvas untainted — then drawn to a
 * canvas on a page-colored background so the export isn't transparent.
 */
export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, scale = 2) {
	const width = svg.clientWidth || Number(svg.getAttribute('width'));
	const height = svg.clientHeight || Number(svg.getAttribute('height'));
	const markup = serializeWithStyles(svg);
	const img = new Image();
	img.onload = () => {
		const canvas = document.createElement('canvas');
		canvas.width = width * scale;
		canvas.height = height * scale;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			if (blob) downloadBlob(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
		}, 'image/png');
	};
	img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}
