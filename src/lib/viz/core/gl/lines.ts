// Feathered screen-space lines for the WebGL surfaces (likelihood surface,
// homepage hero). GL lines are 1 device px wide (lineWidth is clamped), so
// thickening them took offset passes whose weight and jaggedness varied with
// pixel density. Here every line is a quad per segment, widened to a stroke
// width in CSS px and feathered in the fragment shader, so it looks the same
// on any screen. MSAA is redundant with the feathering: request
// `antialias: false`.
//
// Each component keeps its own projection; it calls `lineQuad()` (LINE_VERT)
// on the projected endpoints and `lineCoverage()` (LINE_FRAG) on vDist.

/** Float literal for GLSL (`2` → `2.0`). */
export const glf = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

// Below DPR 1.5 the feather widens from 1 to FEATHER_LOW_DPR device px: a
// 1-px box ramp makes hairlines pulse between one dark pixel and two half
// pixels as they cross the grid, which reads as stepping. The wider ramp is
// the prefiltered-line fix (Chan & Durand, GPU Gems 2, ch. 22).
const FEATHER_LOW_DPR = 1.6;

/** Edge ramp in CSS px, for the uFeather uniform. */
export const featherCss = (dpr: number) => (dpr < 1.5 ? FEATHER_LOW_DPR : 1) / dpr;

// Wire lines bunching closer than DENSITY_PX device px (a ridge seen side-on)
// beat against the pixel grid; fading them in proportion to their spacing
// keeps the band's tone without the moiré. See densityFade().
const DENSITY_PX = 1.5;

/** Vertex-shader chunk: stroke uniforms, lineQuad(), densityFade(). */
export const LINE_VERT = `
uniform float uHalf;    // half stroke width, CSS px
uniform float uFeather; // edge ramp, CSS px
uniform float uCap;     // 1: extend the ends (square caps) for sharp corners
// Corner (x: 0 at a, 1 at b; y: side ±1) of the quad around screen-space
// segment a→b; dist is the signed distance from the centreline.
vec2 lineQuad(vec2 a, vec2 b, vec2 corner, out vec2 nrm, out float dist) {
	vec2 d = b - a;
	float len = length(d);
	vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
	nrm = vec2(-dir.y, dir.x);
	float w = uHalf + uFeather;
	dist = corner.y * w;
	return mix(a, b, corner.x) + nrm * corner.y * w
		+ dir * (corner.x * 2.0 - 1.0) * uCap * w;
}
// Alpha factor from the device-px gap to the neighbouring wire line.
float densityFade(float gapDevPx) {
	return min(1.0, gapDevPx / ${glf(DENSITY_PX)});
}`;

/** Fragment-shader chunk: lineCoverage(); multiply by uWidthAlpha too. */
export const LINE_FRAG = `
uniform float uHalf;
uniform float uFeather;
uniform float uWidthAlpha; // < 1 for strokes thinner than a device px
float lineCoverage(float dist) {
	return clamp((uHalf - abs(dist)) / uFeather + 0.5, 0.0, 1.0);
}`;

/** Uniforms LINE_VERT/LINE_FRAG declare that the caller sets. */
export const LINE_UNIFORMS = ['uHalf', 'uFeather', 'uCap', 'uWidthAlpha'];

/** aCorner values, in the vertex order quadIndices() expects. */
export const CORNERS = new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]);

/** Two triangles per 4-vertex quad. */
export function quadIndices(nSeg: number): Uint32Array {
	const idx = new Uint32Array(nSeg * 6);
	for (let k = 0; k < nSeg; k++)
		idx.set([4 * k, 4 * k + 1, 4 * k + 2, 4 * k + 2, 4 * k + 1, 4 * k + 3], k * 6);
	return idx;
}

// Alpha blending that keeps the canvas opaque. With plain blendFunc the
// destination alpha drops below 1 wherever a line partly covers a pixel (all
// feathered edges), and the compositor lets the page through there, washing
// dark lines out and brightening light ones.
export function blendOver(g: WebGL2RenderingContext) {
	g.enable(g.BLEND);
	g.blendFuncSeparate(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA, g.ONE, g.ONE_MINUS_SRC_ALPHA);
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

// Stroke width in CSS px; below one device px, draw one device px at
// proportionally lower opacity (what an antialiased hairline looks like).
export function stroke(g: WebGL2RenderingContext, u: Uniforms, width: number, dpr: number) {
	const wDev = width * dpr;
	g.uniform1f(u.uHalf, Math.max(wDev, 1) / dpr / 2);
	g.uniform1f(u.uWidthAlpha, Math.min(wDev, 1));
}

function compile(g: WebGL2RenderingContext, type: number, src: string) {
	const sh = g.createShader(type)!;
	g.shaderSource(sh, src);
	g.compileShader(sh);
	if (!g.getShaderParameter(sh, g.COMPILE_STATUS))
		throw new Error(g.getShaderInfoLog(sh) ?? 'shader');
	return sh;
}

/** Linked program plus the named uniform locations; throws on GLSL errors. */
export function createProgram(
	g: WebGL2RenderingContext,
	vertSrc: string,
	fragSrc: string,
	uniforms: string[]
): { prog: WebGLProgram; u: Uniforms } {
	const prog = g.createProgram()!;
	const vert = compile(g, g.VERTEX_SHADER, vertSrc);
	const frag = compile(g, g.FRAGMENT_SHADER, fragSrc);
	g.attachShader(prog, vert);
	g.attachShader(prog, frag);
	g.linkProgram(prog);
	if (!g.getProgramParameter(prog, g.LINK_STATUS))
		throw new Error(g.getProgramInfoLog(prog) ?? 'link');
	g.detachShader(prog, vert);
	g.detachShader(prog, frag);
	g.deleteShader(vert);
	g.deleteShader(frag);
	const u: Uniforms = {};
	for (const name of uniforms) u[name] = g.getUniformLocation(prog, name);
	return { prog, u };
}

// Moving the window to a screen with another DPR doesn't resize the canvas,
// so watch the DPR itself; the query matches one value, so it is re-armed
// after each change. Returns the teardown.
export function watchDpr(onChange: () => void): () => void {
	let query: MediaQueryList;
	const arm = () => {
		query = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
		query.addEventListener('change', fire);
	};
	const fire = () => {
		query.removeEventListener('change', fire);
		arm();
		onChange();
	};
	arm();
	return () => query.removeEventListener('change', fire);
}
