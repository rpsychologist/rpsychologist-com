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

export function downloadSvg(svg: SVGSVGElement, filename: string) {
	const clone = svg.cloneNode(true) as SVGSVGElement;
	clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	inlineStyles(svg, clone);

	const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
		type: 'image/svg+xml;charset=utf-8'
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
	a.click();
	URL.revokeObjectURL(url);
}
