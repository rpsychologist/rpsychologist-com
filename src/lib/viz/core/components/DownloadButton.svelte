<script lang="ts">
	import { downloadSvg } from '../util/svgExport';

	// Pill button that serializes a given SVG node to a downloadable .svg file.
	interface Props {
		svg?: SVGSVGElement;
		filename: string;
		label?: string;
	}

	let { svg, filename, label = 'Download SVG' }: Props = $props();

	function onclick() {
		if (svg) downloadSvg(svg, filename);
	}
</script>

<button class="fig-pill" type="button" {onclick} disabled={!svg}>{label}</button>
