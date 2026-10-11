<script lang="ts">
	/* 3D wireframe of the joint log-likelihood over (μ, σ²), with the
	   optimizer's path and the current point on it — the contour plot's hill
	   made literal. Adapted from HeroGaussianMesh.svelte (same WebGL2
	   scaffolding: static lattice + primitive-restart LINE_STRIP, dynamic
	   interleaved xyzα buffers, DPR cap, theme-following opaque clear,
	   context-loss rebuild, drag-to-rotate with fling).

	   Deliberate differences from the hero: this is a reading instrument, not
	   a decoration — no ambient auto-spin, no click-spawned climbers, no edge
	   vignette. There is no continuous render loop: frames draw on demand when
	   the model changes, and a rAF loop runs only while a drag/fling is
	   actually rotating the view. The surface is the shared 100×100 grid from
	   the state (wireframe walks every 4th grid line, so the drawn curves stay
	   smooth).

	   Height is the TEMPERED relative likelihood (L/L̂)^(1/K) = exp((ℓ−ℓ̂)/K),
	   not raw ℓ: a monotone transform, so the summit and every climb are
	   unchanged, but the hill becomes readable. Raw ℓ renders as a plateau
	   with one cliff (the σ² ridge drops only ~7 log-units across the whole
	   frame while the σ²→0 trench drops hundreds), and raw L is a needle
	   (down to ~0.001 of peak within a few log-units). At K = 50 the μ
	   parabola, the gentle σ² ridge, and the likelihood's skew in σ² (steep
	   toward 0, shallow toward large values) are all visible, and z → 0
	   smoothly in the trench with no clamp kink.

	   Two faint profile-likelihood silhouettes ride the rearmost walls: ℓₚ(μ) =
	   maxₛ₂ ℓ along the μ-axis (on the far σ² wall) and ℓ(μ̂, σ²) along the
	   σ²-axis (on the far μ wall) — the surface's ridge cast onto each axis,
	   with dashed guides from the MLE summit to each peak. Which walls are
	   rearmost flips with rotation (edgeSigns/buildWalls); there is no depth
	   buffer, so this only keeps the silhouettes off the front of the mesh.

	   mode="inference" (the Inference section's 3D view) is read-only: no
	   point, path, or floor handle. Heights scale with the hypothetical n
	   (with the estimates fixed, ℓₙ − ℓ̂ₙ = (n/10)(ℓ − ℓ̂) exactly, since
	   Σ(yᵢ − μ)² = n[σ̂² + (μ̂ − μ)²]), and it draws the likelihood ratio test's
	   real two-parameter geometry: the null slice ℓ(μ₀, σ²), its maximum at
	   (μ₀, σ̂₀²), and on the μ-profile wall — where ℓₚ(μ₀) = ℓ(μ₀, σ̂₀²) — the
	   drop from the summit level that is ½·LR. */
	import { untrack } from 'svelte';
	import type { LikelihoodState } from './likelihood.svelte';
	import { logLikSum, MU_MAX, MU_MIN, profileMu, SIGMA2_MAX, SIGMA2_MIN } from './model';

	interface Props {
		model: LikelihoodState;
		mode?: 'explore' | 'inference';
		/** Key entries being emphasized (SurfaceKey ids); everything else dims. */
		emphasis?: string[] | null;
		/** WebGL2 unavailable or init failed — the parent falls back to 2D. */
		onunavailable?: () => void;
	}
	let { model, mode = 'explore', emphasis = null, onunavailable }: Props = $props();
	// Alpha factor for an element under the key's emphasis (1 = untouched).
	const fU = (v: number) => v.toFixed(2).replace('-', '−');
	const fadeOf = (id: string) => (emphasis && !emphasis.includes(id) ? 0.12 : 1);
	const inference = $derived(mode === 'inference');
	// Height scale for the hypothetical n (see header); 1 when exploring.
	const zScale = $derived(inference ? model.p.n / model.p.sample.length : 1);

	const RANGE = 2.75; // world half-span for both axes
	const Z_HEIGHT = 3.0; // world height of the peak
	// Tilt: 0 = straight down, π/2 = edge-on (the eye level with the floor).
	const TILT_DEFAULT = 1.06;
	const TILT_MAX = Math.PI / 2;
	const TEMPER_K = 50; // z = exp((ℓ−ℓ̂)/K); see header comment
	const LINE_EVERY = 4; // wireframe walks every 4th grid line
	const SLICE_N = 100; // vertices per highlighted slice / wall curve
	const WALL_ALPHA = 0.85; // wall silhouettes read as real curves, a touch under the slices
	const WALL_MU_OFF = 2 * SLICE_N + 2; // μ-wall first vertex in sliceData
	const WALL_S2_OFF = 3 * SLICE_N + 2; // σ²-wall first vertex

	const W = 560;
	const H = 440;
	const CX = W / 2;
	const EXT = RANGE * Math.SQRT2;
	const FIT_PAD = 14;

	const DRAG_SENS = 0.012;
	const HANDLE_HIT = 16; // px: grab the floor handle to move the point vs rotate
	const FLING_MAX = 6;
	const EASE_TAU = 0.5; // fling relaxes to rest (SPEED = 0) on this timescale
	const REST_VEL = 0.01; // below this the loop stops presenting
	const TAU = Math.PI * 2;

	const MESH_DARK: [number, number, number] = [1, 1, 1];
	const MESH_LIGHT: [number, number, number] = [8 / 255, 9 / 255, 10 / 255];
	// Optimizer path colour, matching the 2D contour's .trail (#e17055) and the
	// slice plots' step markers so the joint views read the same.
	const PATH: [number, number, number] = [225 / 255, 112 / 255, 85 / 255];
	// Slice curves use the app accent; resolved from CSS at init.
	let accent: [number, number, number] = [45 / 255, 122 / 255, 122 / 255];
	// Profile-wall silhouettes use --marginal (amber): distinct from the teal
	// slices and the coral path, so the three roles read apart. From CSS at init.
	let marginalCol: [number, number, number] = [217 / 255, 119 / 255, 6 / 255];

	const MAX_PATH_VERTS = 1024;

	// ±0.75px offsets: WebGL clamps lineWidth to 1px, so a line drawn once per
	// offset reads as a ~2px stroke. Used for the slice curves and ℓ axis.
	const NUDGES: [number, number][] = [
		[0.75, 0],
		[-0.75, 0],
		[0, 0.75],
		[0, -0.75]
	];

	// The optimizer path is the thing to watch, so it gets the heaviest stroke:
	// a ring of ±1.25px offsets plus the centre reads as a ~3.5px line.
	const PATH_NUDGES: [number, number][] = [
		[0, 0],
		...Array.from({ length: 8 }, (_, k): [number, number] => [
			1.25 * Math.cos((k * Math.PI) / 4),
			1.25 * Math.sin((k * Math.PI) / 4)
		])
	];

	let tilt = TILT_DEFAULT;
	let cb = Math.cos(tilt);
	let sb = Math.sin(tilt);
	// Scene scale and vertical centre, refit whenever the tilt changes.
	let scl = 64;
	let cy = 303;

	// Fit for every rotation at this tilt: |y1| ≤ EXT, so the scene spans from
	// cy − (EXT·cos t + Z_HEIGHT·sin t)·scl (a back edge at peak height, where
	// the profile walls stand) to cy + EXT·cos t·scl (the front corner), and
	// ±EXT·scl horizontally. Centred in the W×H frame.
	function setTilt(t: number) {
		tilt = Math.max(0, Math.min(TILT_MAX, t));
		cb = Math.cos(tilt);
		sb = Math.sin(tilt);
		const up = EXT * cb + Z_HEIGHT * sb;
		const down = EXT * cb;
		scl = Math.min((W - 2 * FIT_PAD) / (2 * EXT), (H - 2 * FIT_PAD) / (up + down));
		cy = H / 2 + ((up - down) * scl) / 2;
	}
	setTilt(TILT_DEFAULT);

	// Named viewpoints. Edge-on looking along σ² (μ across the screen), the
	// surface's outline above each μ is its maximum over σ², i.e. the profile
	// ℓₚ(μ) — it lands exactly on the amber wall curve (the height transform is
	// monotone). Looking along μ, the outline is ℓ(μ̂, σ²), the other wall.
	const VIEWS = [
		{
			id: 'angled',
			label: 'Angled',
			title: 'The default angled view',
			angle: 0.7,
			tilt: TILT_DEFAULT
		},
		{
			id: 'mu',
			label: 'Side μ',
			title: 'Look along σ²: the outline is the profile likelihood of μ',
			angle: 0,
			tilt: TILT_MAX
		},
		{
			id: 's2',
			label: 'Side σ²',
			title: 'Look along μ: the outline is the likelihood of σ² at μ̂',
			angle: (3 * Math.PI) / 2,
			tilt: TILT_MAX
		}
	] as const;
	let viewId = $state<string | null>('angled');

	// World mapping shared by the surface and the path overlay.
	const wx = (mu: number) => -RANGE + (2 * RANGE * (mu - MU_MIN)) / (MU_MAX - MU_MIN);
	const wy = (s2: number) => -RANGE + (2 * RANGE * (s2 - SIGMA2_MIN)) / (SIGMA2_MAX - SIGMA2_MIN);

	// Coordinate gnomon at the (μ_min, σ²_min) origin corner: three short equal
	// arrows (μ and σ² along the floor, ℓ up) marking the directions, like a
	// textbook axis triad. Deliberately short so ℓ doesn't spear through the
	// dome — a full-height axis at the front corner crosses the surface behind
	// it (a wireframe has no depth occlusion). Drawn as an SVG overlay (below)
	// so the arrowheads are clean screen-space chevrons; the faint floor box
	// (GL) still shows the full domain footprint.
	const GNOMON = 1.4; // arrow length in world units (~50% of RANGE)
	const ORIGIN: [number, number, number] = [-RANGE, -RANGE, 0];
	const MU_TIP: [number, number, number] = [-RANGE + GNOMON, -RANGE, 0];
	const S2_TIP: [number, number, number] = [-RANGE, -RANGE + GNOMON, 0];
	const LL_TIP: [number, number, number] = [-RANGE, -RANGE, GNOMON];

	// Axis-label anchors: just past each arrow tip, projected each frame so the
	// labels rotate with the gnomon.
	const LABEL_ANCHORS = {
		mu: [-RANGE + GNOMON + 0.35, -RANGE, 0],
		s2: [-RANGE, -RANGE + GNOMON + 0.35, 0],
		ll: [-RANGE, -RANGE, GNOMON + 0.35]
	} as const;

	let angle = 0.7;
	let vel = 0;
	// Which far walls the profile silhouettes are pinned to; -1/+1 per axis,
	// 0 = not yet built. Flips as rotation changes which walls are rearmost.
	let wallMuSign = 0;
	let wallS2Sign = 0;
	let dragging = false;
	let flingVel = 0;
	// A pointer drag either rotates the view or moves the (μ, σ²) point — decided
	// at pointerdown by whether it landed on the floor handle (see onPointerDown).
	let dragMode: 'rotate' | 'move' = 'rotate';
	// Drop the discoverability hint once the user has actually rotated (it can
	// otherwise collide with a label that swings up to the top corner).
	let hasRotated = $state(false);

	let canvas: HTMLCanvasElement;
	let muTag: HTMLElement | undefined = $state();
	let s2Tag: HTMLElement | undefined = $state();
	let llTag: HTMLElement | undefined = $state();
	// SVG path (shaft + screen-space chevron) for each axis of the gnomon,
	// recomputed each frame so the arrows rotate with the surface.
	let axisPaths = $state<string[]>([]);
	// Screen position of the current-(μ,σ²) dot on the surface — an SVG overlay
	// styled like the 2D contour's dot, so the two joint views match.
	let headPos = $state<{ x: number; y: number } | null>(null);
	// Dashed MLE-summit → wall-peak guides and the two wall-peak dots (SVG
	// overlay like the gnomon), recomputed each frame in positionLabels.
	let guidePaths = $state<string[]>([]);
	let peakDots = $state<{ x: number; y: number }[]>([]);
	// The current point's foot on the z = 0 floor: the grab handle for moving
	// (μ, σ²), and the visible base of the drop line.
	let floorPos = $state<{ x: number; y: number } | null>(null);
	// Inference-mode overlay (SVG, like the gnomon): the null line on the floor,
	// the summit and the constrained maximum, plus the active test's geometry —
	// LR: the ½·LR drop on the μ-wall; score: a slope triangle at (μ₀, σ̂₀²);
	// Wald: the floor distance μ̂ − μ₀ under the slice through the summit.
	type Pt = { x: number; y: number };
	type Label = { at: Pt; text: string; anchor: 'start' | 'middle' | 'end' };
	let lrGeo = $state<{
		nullFloor: string;
		ridge: string; // track of (μ₀, σ̂₀²) as μ₀ varies
		summit: Pt;
		nullPt: Pt | null; // null when σ̂₀² is past the plotted σ² range
		wallNull: Pt;
		lines: string[]; // solid annotation strokes
		slopeTri: string; // score: filled rise-over-run triangle
		slopeHyp: string; // its hypotenuse, the tangent
		slopeLegs: string; // run (horizontal) and rise (vertical)
		guides: string[]; // dashed guides
		labels: Label[];
	} | null>(null);
	let dpr = 1;
	let view = { scale: 1, ox: 0, oy: 0, cw: 0, ch: 0 };
	let isDark = false;

	// The surface's clear colour = the page's paper colour. Read `--bg` directly
	// (resolved through the CSS cascade — media query *and* data-theme), not the
	// element background-color: `body` has none (it's transparent), so scraping
	// it and leaning on an isDark fallback let the surface disagree with the page
	// and render a black panel when the two theme signals diverged.
	function pageBg(): [number, number, number] {
		return cssVarRgb('--bg', isDark ? [0.05, 0.05, 0.06] : [0.98, 0.97, 0.96]);
	}

	// A CSS custom property as GL RGB (supports #rrggbb and rgb(...) forms).
	function cssVarRgb(name: string, fallback: [number, number, number]): [number, number, number] {
		const v = getComputedStyle(canvas).getPropertyValue(name).trim();
		const hex = v.match(/^#([0-9a-f]{6})$/i);
		if (hex) {
			const n = parseInt(hex[1], 16);
			return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
		}
		const rgb = v.match(/[\d.]+/g);
		if (rgb && rgb.length >= 3) return [+rgb[0] / 255, +rgb[1] / 255, +rgb[2] / 255];
		return fallback;
	}

	let gl: WebGL2RenderingContext | null = null;
	let prog: WebGLProgram;
	let vaoMesh: WebGLVertexArrayObject;
	let vaoLines: WebGLVertexArrayObject;
	let vaoSlices: WebGLVertexArrayObject;
	let posBuf: WebGLBuffer;
	let lineBuf: WebGLBuffer;
	let sliceBuf: WebGLBuffer;
	let meshIdxCount = 0;
	let u: Record<string, WebGLUniformLocation | null> = {};
	let glBuffers: WebGLBuffer[] = [];
	let glVaos: WebGLVertexArrayObject[] = [];

	// Static orientation frame in GL: just the faint 4-edge floor box (8 verts).
	// The axis gnomon is an SVG overlay.
	const FLOOR_VERTS = 8;
	const lineData = new Float32Array((MAX_PATH_VERTS + FLOOR_VERTS) * 4); // frame + path
	// Two slice curves through the current point (the 1D plots drawn ON the
	// surface), a 2-vertex drop line to the floor, then the two profile
	// silhouettes on the far walls (μ-wall + σ²-wall, SLICE_N each).
	const sliceData = new Float32Array((SLICE_N * 4 + 2) * 4);
	let pathVerts = 0; // current path vertex count in lineData (after the frame)

	const glf = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

	const VERT = `#version 300 es
	precision highp float;
	precision highp int;
	layout(location = 0) in vec3 aPos;
	layout(location = 1) in float aAlpha;
	uniform vec2 uRot;
	uniform vec2 uTilt;
	uniform float uFit;
	uniform vec2 uOff;
	uniform vec2 uCanvas;
	uniform vec2 uNudge;    // CSS-px offset, for faking >1px line width in passes
	uniform int uMode;      // 0 mesh (depth fade), 1 line (attr alpha), 2 head point
	uniform float uPoint;
	out float vAlpha;
	const float CX = ${glf(CX)};
	uniform float uCY;
	uniform float uScl;
	const float EXT = ${glf(EXT)};
	void main() {
		float x1 = aPos.x * uRot.x - aPos.y * uRot.y;
		float y1 = aPos.x * uRot.y + aPos.y * uRot.x;
		float sx = CX + x1 * uScl;
		float sy = uCY - (y1 * uTilt.x + aPos.z * uTilt.y) * uScl;
		vec2 uv = vec2((uOff.x + sx * uFit + uNudge.x) / uCanvas.x, (uOff.y + sy * uFit + uNudge.y) / uCanvas.y);
		gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
		float depthA = 0.9 - 0.72 * ((y1 + EXT) / (2.0 * EXT));
		vAlpha = uMode == 0 ? depthA : aAlpha;
		gl_PointSize = uMode == 2 ? uPoint : 1.0;
	}`;

	const FRAG = `#version 300 es
	precision highp float;
	precision highp int;
	in float vAlpha;
	uniform vec3 uColor;
	uniform int uMode;
	uniform float uFade;   // key emphasis: dims the elements not emphasized
	out vec4 frag;
	void main() {
		float a = vAlpha;
		if (uMode == 2) {
			float pr = length(gl_PointCoord - 0.5) * 2.0;
			float core = smoothstep(0.55, 0.32, pr);
			float halo = exp(-pr * 3.0) * 0.5;
			a *= clamp(core + halo, 0.0, 1.0);
		}
		a *= uFade;
		if (a <= 0.001) discard;
		frag = vec4(uColor, a);
	}`;

	function compile(g: WebGL2RenderingContext, type: number, src: string) {
		const sh = g.createShader(type)!;
		g.shaderSource(sh, src);
		g.compileShader(sh);
		if (!g.getShaderParameter(sh, g.COMPILE_STATUS))
			throw new Error(g.getShaderInfoLog(sh) ?? 'shader');
		return sh;
	}

	// z from ℓ: tempered relative likelihood (see header). Peak at Z_HEIGHT,
	// smooth decay to 0 in the σ²→0 trench.
	function zOf(v: number, top: number): number {
		return Math.exp((zScale * (v - top)) / TEMPER_K) * Z_HEIGHT;
	}

	// A wall seen edge-on collapses to a vertical line at the frame's side, so
	// it is hidden then (the μ-wall's plane is edge-on when cos(angle) → 0, the
	// σ²-wall's when sin(angle) → 0).
	function wallsVisible() {
		return { mu: Math.abs(Math.cos(angle)) > 0.15, s2: Math.abs(Math.sin(angle)) > 0.15 };
	}

	// Rearmost wall per axis from the current azimuth: a μ-profile sits on the
	// σ² edge with larger mean projected depth (∝ cos angle), a σ²-profile on
	// the μ edge tracking sin angle.
	function edgeSigns() {
		return { mu: Math.cos(angle) >= 0 ? 1 : -1, s2: Math.sin(angle) >= 0 ? 1 : -1 };
	}

	// Write the two profile silhouettes into the wall region of sliceData for
	// the current rearmost walls: ℓₚ(μ) over the μ-axis, ℓ(μ̂, σ²) over the
	// σ²-axis (sqrt-spaced, like the σ² slice). Cheap (2·SLICE_N verts); called
	// on sample change and whenever rotation flips a wall.
	function buildWalls() {
		const g = model.grid;
		const sample = model.p.sample;
		const muHat = model.muHat;
		const s = edgeSigns();
		wallMuSign = s.mu;
		wallS2Sign = s.s2;
		const wallY = s.mu * RANGE; // μ-profile pinned to a σ² edge
		const wallX = s.s2 * RANGE; // σ²-profile pinned to a μ edge
		let o = WALL_MU_OFF * 4;
		for (let i = 0; i < SLICE_N; i++) {
			const mu = MU_MIN + ((MU_MAX - MU_MIN) * i) / (SLICE_N - 1);
			sliceData[o++] = wx(mu);
			sliceData[o++] = wallY;
			sliceData[o++] = zOf(profileMu(sample, mu), g.max);
			sliceData[o++] = WALL_ALPHA;
		}
		const sqrtMax = Math.sqrt(SIGMA2_MAX);
		for (let i = 0; i < SLICE_N; i++) {
			const t = 1 + ((sqrtMax - 1) * i) / (SLICE_N - 1);
			const s2 = t * t;
			sliceData[o++] = wallX;
			sliceData[o++] = wy(s2);
			sliceData[o++] = zOf(logLikSum(sample, muHat, s2), g.max);
			sliceData[o++] = WALL_ALPHA;
		}
	}

	function surfacePositions(): Float32Array {
		const g = model.grid;
		const pos = new Float32Array(g.cols * g.rows * 3);
		let o = 0;
		for (let j = 0; j < g.rows; j++) {
			const y = -RANGE + (2 * RANGE * j) / (g.rows - 1);
			for (let i = 0; i < g.cols; i++) {
				pos[o++] = -RANGE + (2 * RANGE * i) / (g.cols - 1);
				pos[o++] = y;
				pos[o++] = zOf(g.values[j * g.cols + i], g.max);
			}
		}
		return pos;
	}

	function setupGL(g: WebGL2RenderingContext) {
		glBuffers = [];
		glVaos = [];
		prog = g.createProgram()!;
		const vert = compile(g, g.VERTEX_SHADER, VERT);
		const frag = compile(g, g.FRAGMENT_SHADER, FRAG);
		g.attachShader(prog, vert);
		g.attachShader(prog, frag);
		g.linkProgram(prog);
		if (!g.getProgramParameter(prog, g.LINK_STATUS))
			throw new Error(g.getProgramInfoLog(prog) ?? 'link');
		g.detachShader(prog, vert);
		g.detachShader(prog, frag);
		g.deleteShader(vert);
		g.deleteShader(frag);
		g.useProgram(prog);
		for (const name of [
			'uRot',
			'uTilt',
			'uCY',
			'uScl',
			'uFit',
			'uOff',
			'uCanvas',
			'uNudge',
			'uMode',
			'uPoint',
			'uColor',
			'uFade'
		]) {
			u[name] = g.getUniformLocation(prog, name);
		}

		const { cols, rows } = untrack(() => model.grid);
		posBuf = g.createBuffer()!;
		glBuffers.push(posBuf);
		g.bindBuffer(g.ARRAY_BUFFER, posBuf);
		g.bufferData(
			g.ARRAY_BUFFER,
			untrack(() => surfacePositions()),
			g.STATIC_DRAW
		);

		// Wireframe over every LINE_EVERY-th grid line (plus the last), each row
		// and column a dense polyline; split by the fixed restart index.
		const RESTART = 0xffffffff;
		const idx: number[] = [];
		const lineIdx = (limit: number) => {
			const out: number[] = [];
			for (let k = 0; k < limit; k += LINE_EVERY) out.push(k);
			if (out[out.length - 1] !== limit - 1) out.push(limit - 1);
			return out;
		};
		for (const j of lineIdx(rows)) {
			for (let i = 0; i < cols; i++) idx.push(j * cols + i);
			idx.push(RESTART);
		}
		for (const i of lineIdx(cols)) {
			for (let j = 0; j < rows; j++) idx.push(j * cols + i);
			idx.push(RESTART);
		}
		meshIdxCount = idx.length;
		const idxBuf = g.createBuffer()!;
		glBuffers.push(idxBuf);
		g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, idxBuf);
		g.bufferData(g.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), g.STATIC_DRAW);

		vaoMesh = g.createVertexArray()!;
		glVaos.push(vaoMesh);
		g.bindVertexArray(vaoMesh);
		g.bindBuffer(g.ARRAY_BUFFER, posBuf);
		g.enableVertexAttribArray(0);
		g.vertexAttribPointer(0, 3, g.FLOAT, false, 0, 0);
		g.bindBuffer(g.ELEMENT_ARRAY_BUFFER, idxBuf);

		const dynVAO = (buf: WebGLBuffer) => {
			const vao = g.createVertexArray()!;
			glVaos.push(vao);
			g.bindVertexArray(vao);
			g.bindBuffer(g.ARRAY_BUFFER, buf);
			g.enableVertexAttribArray(0);
			g.vertexAttribPointer(0, 3, g.FLOAT, false, 16, 0);
			g.enableVertexAttribArray(1);
			g.vertexAttribPointer(1, 1, g.FLOAT, false, 16, 12);
			return vao;
		};
		lineBuf = g.createBuffer()!;
		glBuffers.push(lineBuf);
		g.bindBuffer(g.ARRAY_BUFFER, lineBuf);
		g.bufferData(g.ARRAY_BUFFER, lineData.byteLength, g.DYNAMIC_DRAW);
		vaoLines = dynVAO(lineBuf);
		sliceBuf = g.createBuffer()!;
		glBuffers.push(sliceBuf);
		g.bindBuffer(g.ARRAY_BUFFER, sliceBuf);
		g.bufferData(g.ARRAY_BUFFER, sliceData.byteLength, g.DYNAMIC_DRAW);
		vaoSlices = dynVAO(sliceBuf);

		// Faint floor box: the domain footprint at z = 0. (The axis gnomon is an
		// SVG overlay — screen-space arrowheads read cleaner than baked 3D ones.)
		const FAINT = 0.22;
		let o = 0;
		const box = [
			[-RANGE, -RANGE, 0],
			[RANGE, -RANGE, 0],
			[RANGE, RANGE, 0],
			[-RANGE, RANGE, 0]
		];
		for (let k = 0; k < 4; k++) {
			const a = box[k];
			const b = box[(k + 1) % 4];
			lineData[o++] = a[0];
			lineData[o++] = a[1];
			lineData[o++] = a[2];
			lineData[o++] = FAINT;
			lineData[o++] = b[0];
			lineData[o++] = b[1];
			lineData[o++] = b[2];
			lineData[o++] = FAINT;
		}

		g.bindVertexArray(null);
		g.vertexAttrib1f(1, 1.0);
		g.enable(g.BLEND);
		g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
		const bg = pageBg();
		g.clearColor(bg[0], bg[1], bg[2], 1);
	}

	function resize() {
		if (!gl) return;
		dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const cw = canvas.clientWidth;
		const ch = canvas.clientHeight;
		canvas.width = Math.round(cw * dpr);
		canvas.height = Math.round(ch * dpr);
		gl.viewport(0, 0, canvas.width, canvas.height);
		const scale = Math.min(cw / W, ch / H);
		view = { scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, cw, ch };
		draw();
	}

	// World point → canvas CSS px, mirroring the vertex shader's transform.
	function project(ax: number, ay: number, az: number): { x: number; y: number } {
		const ca = Math.cos(angle);
		const sa = Math.sin(angle);
		const x1 = ax * ca - ay * sa;
		const y1 = ax * sa + ay * ca;
		const sx = CX + x1 * scl;
		const sy = cy - (y1 * cb + az * sb) * scl;
		return { x: view.ox + sx * view.scale, y: view.oy + sy * view.scale };
	}

	// Inverse of project() on the z = 0 floor: a client point → (μ, σ²). Exact
	// (orthographic oblique), so dragging is absolute — the point goes under the
	// cursor's floor position at any rotation, no diagonal-drag surprise. σ² is
	// heavily foreshortened near edge-on, so this is coarser than the flat
	// contour; that's why the contour stays the precise input.
	function unprojectFloor(clientX: number, clientY: number): { mu: number; sigma2: number } {
		const rect = canvas.getBoundingClientRect();
		const sx = (clientX - rect.left - view.ox) / view.scale;
		const sy = (clientY - rect.top - view.oy) / view.scale;
		const x1 = (sx - CX) / scl;
		const y1 = (cy - sy) / (scl * cb);
		const ca = Math.cos(angle);
		const sa = Math.sin(angle);
		const ax = x1 * ca + y1 * sa;
		const ay = -x1 * sa + y1 * ca;
		return {
			mu: MU_MIN + ((ax + RANGE) / (2 * RANGE)) * (MU_MAX - MU_MIN),
			sigma2: SIGMA2_MIN + ((ay + RANGE) / (2 * RANGE)) * (SIGMA2_MAX - SIGMA2_MIN)
		};
	}

	// Screen-space arrowhead: from the projected tip, a two-line chevron ~HEAD_L
	// px back along the projected shaft, splayed ±HEAD_A. Always faces the
	// viewer, so it stays a clean arrow at every rotation (a baked 3D head reads
	// as an asterisk from some angles).
	const HEAD_L = 9;
	const HEAD_A = 0.4;
	function axisPath(tip: readonly [number, number, number]): string {
		const o = project(ORIGIN[0], ORIGIN[1], ORIGIN[2]);
		const t = project(tip[0], tip[1], tip[2]);
		let dx = t.x - o.x;
		let dy = t.y - o.y;
		const len = Math.hypot(dx, dy) || 1;
		dx /= len;
		dy /= len;
		const c = Math.cos(HEAD_A);
		const s = Math.sin(HEAD_A);
		const b1x = t.x - HEAD_L * (dx * c - dy * s);
		const b1y = t.y - HEAD_L * (dx * s + dy * c);
		const b2x = t.x - HEAD_L * (dx * c + dy * s);
		const b2y = t.y - HEAD_L * (-dx * s + dy * c);
		const f = (n: number) => n.toFixed(1);
		return `M${f(o.x)},${f(o.y)}L${f(t.x)},${f(t.y)}M${f(b1x)},${f(b1y)}L${f(t.x)},${f(t.y)}L${f(b2x)},${f(b2y)}`;
	}

	// Position the HTML axis labels at their world anchors and rebuild the SVG
	// gnomon (both can't be GL, so they overlay the canvas in CSS px each frame).
	function positionLabels() {
		const place = (el: HTMLElement | undefined, a: readonly [number, number, number]) => {
			if (!el) return;
			const p = project(a[0], a[1], a[2]);
			// Clamp to the canvas so a label whose anchor rotates out of frame
			// pins to the nearest edge instead of overlapping the page above.
			const x = Math.max(10, Math.min(view.cw - 10, p.x));
			const y = Math.max(10, Math.min(view.ch - 10, p.y));
			el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
		};
		place(muTag, LABEL_ANCHORS.mu);
		place(s2Tag, LABEL_ANCHORS.s2);
		place(llTag, LABEL_ANCHORS.ll);
		axisPaths = [axisPath(MU_TIP), axisPath(S2_TIP), axisPath(LL_TIP)];

		const p = model.p;
		if (inference) {
			headPos = null;
			floorPos = null;
		} else {
			const hz = zOf(logLikSum(p.sample, p.mu, p.sigma2), model.grid.max);
			headPos = project(wx(p.mu), wy(p.sigma2), hz);
			// Near edge-on the floor projects to a line and can't be inverted, so
			// the handle (and floor dragging) switches off.
			floorPos = cb > 0.25 ? project(wx(p.mu), wy(p.sigma2), 0) : null;
		}

		// MLE-summit → wall-peak guides (dashed), echoing the reference's
		// "marginal peaks". Both peaks sit at ℓ̂, so the guides are horizontal.
		const zPk = zOf(profileMu(p.sample, model.muHat), model.grid.max);
		const summit = project(wx(model.muHat), wy(model.sigma2Hat), zPk);
		const muPk = project(wx(model.muHat), wallMuSign * RANGE, zPk);
		const s2Pk = project(wallS2Sign * RANGE, wy(model.sigma2Hat), zPk);
		const f = (n: number) => n.toFixed(1);
		// Only walls that aren't edge-on get their guide and peak dot.
		const wv = wallsVisible();
		const pks = [...(wv.mu ? [muPk] : []), ...(wv.s2 ? [s2Pk] : [])];
		guidePaths = pks.map((q) => `M${f(summit.x)},${f(summit.y)}L${f(q.x)},${f(q.y)}`);
		peakDots = pks;
		lrGeo = inference ? lrGeometry(zPk, summit) : null;
	}

	function lrGeometry(zPk: number, summit: Pt) {
		const p = model.p;
		const f = (n: number) => n.toFixed(1);
		const seg = (a: Pt, b: Pt) => `M${f(a.x)},${f(a.y)}L${f(b.x)},${f(b.y)}`;
		const capH = (q: Pt) => `M${f(q.x - 5)},${f(q.y)}L${f(q.x + 5)},${f(q.y)}`;
		const capV = (q: Pt) => `M${f(q.x)},${f(q.y - 5)}L${f(q.x)},${f(q.y + 5)}`;
		const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
		const top = model.grid.max;
		const mx = wx(p.muNull);
		const wallY = wallMuSign * RANGE;
		// ℓₚ(μ₀) = ℓ(μ₀, σ̂₀²): the constrained maximum and its wall shadow share a height.
		const z0 = zOf(profileMu(p.sample, p.muNull), top);
		const wallNull = project(mx, wallY, z0);
		const s0 = model.sigma2Null;
		const nullPt = s0 <= SIGMA2_MAX ? project(mx, wy(s0), z0) : null;
		const lines: string[] = [];
		const guides: string[] = [];
		const labels: Label[] = [];
		let slopeTri = '';
		let slopeHyp = '';
		let slopeLegs = '';

		if (p.test === 'LRT') {
			const wallTop = project(mx, wallY, zPk);
			guides.push(seg(project(wx(model.muHat), wallY, zPk), wallTop));
			if (nullPt) guides.push(seg(nullPt, wallNull));
			lines.push(seg(wallTop, wallNull) + capH(wallTop) + capH(wallNull));
			const m = mid(wallTop, wallNull);
			labels.push({ at: { x: m.x + 8, y: m.y }, text: '½·LR', anchor: 'start' });
		} else if (p.test === 'score' && nullPt) {
			// Slope triangle on the μ-slice at (μ₀, σ̂₀²): run Δμ uphill, rise from
			// the drawn surface's tangent. Height is a tempered transform of ℓ, so
			// the triangle shows direction and relative steepness; the exact
			// magnitude is the U label. No σ² leg: σ̂₀² maximizes ℓ in σ² under the
			// null, so the slope there is zero and only U(μ) is tested.
			const zAt = (mu: number, s2: number) => zOf(logLikSum(p.sample, mu, s2), top);
			const eps = 0.01;
			const dzdmu = (zAt(p.muNull + eps, s0) - zAt(p.muNull - eps, s0)) / (2 * eps);
			const dir = dzdmu >= 0 ? 1 : -1;
			const run = (MU_MAX - MU_MIN) / 4;
			const muEnd = p.muNull + dir * run;
			const foot = project(wx(muEnd), wy(s0), z0);
			const apex = project(wx(muEnd), wy(s0), z0 + Math.abs(dzdmu) * run);
			slopeTri = `M${f(nullPt.x)},${f(nullPt.y)}L${f(foot.x)},${f(foot.y)}L${f(apex.x)},${f(apex.y)}Z`;
			slopeHyp = seg(nullPt, apex);
			slopeLegs = `M${f(nullPt.x)},${f(nullPt.y)}L${f(foot.x)},${f(foot.y)}L${f(apex.x)},${f(apex.y)}`;
			// Above the apex, clear of the point's own label (which sits below it)
			// even when rotation foreshortens the triangle to a sliver.
			labels.push({
				at: { x: apex.x, y: Math.min(apex.y, nullPt.y) - 14 },
				text: `U = ${fU(model.scoreAtNull)}`,
				anchor: apex.x >= nullPt.x ? 'start' : 'end'
			});
		} else if (p.test === 'wald') {
			// μ̂ − μ₀ on the floor at σ̂², under the slice ℓ(μ, σ̂²) whose curvature
			// at the summit is I(μ̂) — the Wald statistic's two ingredients.
			const y = wy(model.sigma2Hat);
			const a = project(mx, y, 0);
			const b = project(wx(model.muHat), y, 0);
			lines.push(seg(a, b) + capV(a) + capV(b));
			guides.push(seg(summit, b));
			const m = mid(a, b);
			labels.push({ at: { x: m.x, y: m.y - 12 }, text: 'μ̂ − μ₀', anchor: 'middle' });
		}
		// The ridge: for each μ the best σ² is σ̂² + (μ̂ − μ)², at height ℓₚ(μ).
		// The constrained maximum slides along it as μ₀ moves; the amber μ-profile
		// on the wall is its shadow. Stops where σ² leaves the plotted range.
		let ridge = '';
		for (let i = 0; i < SLICE_N; i++) {
			const mu = MU_MIN + ((MU_MAX - MU_MIN) * i) / (SLICE_N - 1);
			const s2 = model.sigma2Hat + (model.muHat - mu) ** 2;
			if (s2 > SIGMA2_MAX) continue;
			const q = project(wx(mu), wy(s2), zOf(profileMu(p.sample, mu), top));
			ridge += `${ridge ? 'L' : 'M'}${f(q.x)},${f(q.y)}`;
		}
		return {
			nullFloor: seg(project(mx, -RANGE, 0), project(mx, RANGE, 0)),
			ridge,
			summit,
			nullPt,
			wallNull,
			lines,
			slopeTri,
			slopeHyp,
			slopeLegs,
			guides,
			labels
		};
	}

	function draw() {
		const g = gl;
		if (!g) return;
		const { scale, ox, oy, cw, ch } = view;
		g.clear(g.COLOR_BUFFER_BIT);
		g.useProgram(prog);
		g.uniform2f(u.uRot, Math.cos(angle), Math.sin(angle));
		g.uniform2f(u.uTilt, cb, sb);
		g.uniform1f(u.uCY, cy);
		g.uniform1f(u.uScl, scl);
		g.uniform1f(u.uFit, scale);
		g.uniform2f(u.uOff, ox, oy);
		g.uniform2f(u.uCanvas, cw, ch);
		g.uniform2f(u.uNudge, 0, 0);

		const mesh = isDark ? MESH_DARK : MESH_LIGHT;
		g.bindVertexArray(vaoMesh);
		g.uniform1i(u.uMode, 0);
		// The surface itself never dims under key emphasis: it is the subject,
		// not one of the overlays the key picks between.
		g.uniform1f(u.uFade, 1);
		g.uniform3f(u.uColor, mesh[0], mesh[1], mesh[2]);
		g.drawElements(g.LINE_STRIP, meshIdxCount, g.UNSIGNED_INT, 0);

		g.bindVertexArray(vaoLines);
		g.bindBuffer(g.ARRAY_BUFFER, lineBuf);
		g.bufferSubData(g.ARRAY_BUFFER, 0, lineData, 0, (FLOOR_VERTS + pathVerts) * 4);
		g.uniform1i(u.uMode, 1);
		// Faint floor box (the gnomon is the SVG overlay).
		g.uniform3f(u.uColor, mesh[0], mesh[1], mesh[2]);
		g.drawArrays(g.LINES, 0, FLOOR_VERTS);

		// The ℓ(μ) and ℓ(σ²) slice curves through the current point + drop line.
		// WebGL clamps lineWidth to 1px on nearly all platforms, so the slices
		// are drawn in four ±0.75px-nudged passes to read as a ~2px stroke that
		// stands off the 1px wireframe.
		g.bindVertexArray(vaoSlices);
		g.bindBuffer(g.ARRAY_BUFFER, sliceBuf);
		// Rotation may have swapped which walls are rearmost — rebuild before upload.
		const es = edgeSigns();
		if (es.mu !== wallMuSign || es.s2 !== wallS2Sign) buildWalls();
		g.bufferSubData(g.ARRAY_BUFFER, 0, sliceData);
		// Inference: the second slot holds the null slice ℓ(μ₀, σ²) in the null
		// colour; the μ-slice (first slot) is shown only for the score and Wald
		// tests, through (μ₀, σ̂₀²) or the summit respectively.
		const muSlice = !inference || model.p.test !== 'LRT';
		const muFade = fadeOf(inference ? 'muSlice' : 'slices');
		const s2Fade = fadeOf(inference ? 'nullSlice' : 'slices');
		for (const [nx, ny] of NUDGES) {
			g.uniform2f(u.uNudge, nx, ny);
			if (muSlice) {
				g.uniform3f(u.uColor, accent[0], accent[1], accent[2]);
				g.uniform1f(u.uFade, muFade);
				g.drawArrays(g.LINE_STRIP, 0, SLICE_N);
			}
			const sc = inference ? PATH : accent;
			g.uniform3f(u.uColor, sc[0], sc[1], sc[2]);
			g.uniform1f(u.uFade, s2Fade);
			g.drawArrays(g.LINE_STRIP, SLICE_N, SLICE_N);
		}
		g.uniform2f(u.uNudge, 0, 0);
		g.uniform3f(u.uColor, mesh[0], mesh[1], mesh[2]);
		g.drawArrays(g.LINES, SLICE_N * 2, 2);
		g.uniform1f(u.uFade, fadeOf('profile'));
		const wv = wallsVisible();
		// Profile silhouettes on the two rearmost walls: the surface's ridge cast
		// onto each axis. Drawn in --marginal (amber) in the same four-nudge ~2px
		// pass as the slices so they read as real curves, distinct from the teal
		// slices, against the dense wireframe (mesh colour dissolved into it,
		// badly in dark mode). They sit at the back edges, clear of the slices.
		g.uniform3f(u.uColor, marginalCol[0], marginalCol[1], marginalCol[2]);
		for (const [nx, ny] of NUDGES) {
			g.uniform2f(u.uNudge, nx, ny);
			if (wv.mu) g.drawArrays(g.LINE_STRIP, WALL_MU_OFF, SLICE_N);
			if (wv.s2) g.drawArrays(g.LINE_STRIP, WALL_S2_OFF, SLICE_N);
		}
		g.uniform2f(u.uNudge, 0, 0);

		// Optimizer path last, over the slices and walls.
		if (pathVerts >= 2) {
			g.bindVertexArray(vaoLines);
			g.bindBuffer(g.ARRAY_BUFFER, lineBuf);
			g.uniform3f(u.uColor, PATH[0], PATH[1], PATH[2]);
			g.uniform1f(u.uFade, fadeOf('path'));
			for (const [nx, ny] of PATH_NUDGES) {
				g.uniform2f(u.uNudge, nx, ny);
				g.drawArrays(g.LINE_STRIP, FLOOR_VERTS, pathVerts);
			}
			g.uniform2f(u.uNudge, 0, 0);
		}

		g.uniform1f(u.uFade, 1);

		// The current-position dot is an SVG overlay (styled like the 2D
		// contour's), not a GL point — see positionLabels / the template.
		positionLabels();
	}

	// Fling loop: runs only while the view still rotates; everything else is
	// draw-on-demand (no per-frame present cost while the scene is static).
	let raf = 0;
	let last = 0;
	function loop(t: number) {
		const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
		last = t;
		if (!dragging) {
			angle = (angle + dt * vel) % TAU;
			vel -= vel * Math.min(1, dt / EASE_TAU);
		}
		draw();
		if (dragging || Math.abs(vel) > REST_VEL) raf = requestAnimationFrame(loop);
		else {
			raf = 0;
			last = 0;
		}
	}
	function kick() {
		if (!raf && gl) {
			last = 0;
			raf = requestAnimationFrame(loop);
		}
	}

	$effect(() => {
		gl = canvas.getContext('webgl2', {
			alpha: true,
			antialias: true,
			powerPreference: 'low-power'
		});
		if (!gl) {
			onunavailable?.();
			return;
		}
		try {
			setupGL(gl);
		} catch (err) {
			console.error('SurfaceLogLik: WebGL setup failed', err);
			gl = null;
			onunavailable?.();
			return;
		}
		isDark = document.documentElement.getAttribute('data-theme') === 'dark';
		accent = cssVarRgb('--viz-accent', accent);
		marginalCol = cssVarRgb('--marginal', marginalCol);
		resize();

		const ro = new ResizeObserver(() => resize());
		ro.observe(canvas);

		const themeObs = new MutationObserver(() => {
			if (!gl) return;
			isDark = document.documentElement.getAttribute('data-theme') === 'dark';
			accent = cssVarRgb('--viz-accent', accent); // colours may differ per theme
			marginalCol = cssVarRgb('--marginal', marginalCol);
			const bg = pageBg();
			gl.clearColor(bg[0], bg[1], bg[2], 1);
			draw();
		});
		themeObs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		const onLost = (e: Event) => {
			e.preventDefault();
			cancelAnimationFrame(raf);
			raf = 0;
		};
		const onRestored = () => {
			if (!gl) return;
			try {
				setupGL(gl);
			} catch (err) {
				console.error('SurfaceLogLik: WebGL setup failed', err);
				gl = null;
				onunavailable?.();
				return;
			}
			resize();
		};
		canvas.addEventListener('webglcontextlost', onLost);
		canvas.addEventListener('webglcontextrestored', onRestored);

		return () => {
			cancelAnimationFrame(raf);
			cancelAnimationFrame(viewRaf);
			raf = 0;
			ro.disconnect();
			themeObs.disconnect();
			canvas.removeEventListener('webglcontextlost', onLost);
			canvas.removeEventListener('webglcontextrestored', onRestored);
			if (gl) {
				gl.bindVertexArray(null);
				for (const vao of glVaos) gl.deleteVertexArray(vao);
				for (const buf of glBuffers) gl.deleteBuffer(buf);
				glVaos = [];
				glBuffers = [];
				gl.deleteProgram(prog);
				gl = null;
			}
		};
	});

	// Key emphasis changed: redraw with the new fades.
	$effect(() => {
		void emphasis;
		if (gl) untrack(() => draw());
	});

	// New sample → new surface: re-upload the lattice heights.
	$effect(() => {
		const pos = surfacePositions(); // tracks model.grid
		if (!gl) return;
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
		draw();
	});

	// Optimizer path, slice curves, and current point → dynamic buffers.
	// Decimate an over-long path (keep first, every k-th, last) so it fits
	// the scratch buffer. z uses the exact ℓ (cheap), not a grid lookup, so
	// the overlays sit on the analytic surface.
	$effect(() => {
		const g = model.grid;
		const path = inference ? [] : model.path;
		const sample = model.p.sample;
		// Inference: the second slice is the null slice at μ₀ and the drop line
		// falls from its maximum (μ₀, σ̂₀², clamped to the frame).
		const cur = inference
			? { mu: model.p.muNull, sigma2: Math.min(model.sigma2Null, SIGMA2_MAX) }
			: { mu: model.p.mu, sigma2: model.p.sigma2 };
		void zScale; // heights depend on n in inference mode
		// The μ-slice's fixed σ²: through the summit for Wald, else through cur.
		const muSliceS2 = inference && model.p.test === 'wald' ? model.sigma2Hat : cur.sigma2;

		let pts = path;
		if (pts.length > MAX_PATH_VERTS) {
			const k = Math.ceil(pts.length / (MAX_PATH_VERTS - 2));
			pts = [
				pts[0],
				...pts.filter((_, i) => i > 0 && i < path.length - 1 && i % k === 0),
				pts[path.length - 1]
			];
		}
		const zAt = (mu: number, s2: number) => zOf(logLikSum(sample, mu, s2), g.max);
		let o = FLOOR_VERTS * 4;
		for (const p of pts) {
			lineData[o++] = wx(p.mu);
			lineData[o++] = wy(p.sigma2);
			lineData[o++] = zAt(p.mu, p.sigma2) + 0.015; // float above the wires
			lineData[o++] = 1;
		}
		pathVerts = pts.length;

		// Slice curves: ℓ(μ | σ²=cur) and ℓ(σ² | μ=cur) — the two 1D plots
		// drawn on the surface through the current point. σ² is sqrt-spaced so
		// the curve stays dense where it bends into the trench.
		o = 0;
		for (let i = 0; i < SLICE_N; i++) {
			const mu = MU_MIN + ((MU_MAX - MU_MIN) * i) / (SLICE_N - 1);
			sliceData[o++] = wx(mu);
			sliceData[o++] = wy(muSliceS2);
			sliceData[o++] = zAt(mu, muSliceS2) + 0.012;
			sliceData[o++] = 0.9;
		}
		const sqrtMax = Math.sqrt(SIGMA2_MAX);
		for (let i = 0; i < SLICE_N; i++) {
			const t = 1 + ((sqrtMax - 1) * i) / (SLICE_N - 1);
			const s2 = t * t;
			sliceData[o++] = wx(cur.mu);
			sliceData[o++] = wy(s2);
			sliceData[o++] = zAt(cur.mu, s2) + 0.012;
			sliceData[o++] = 0.9;
		}
		// Drop line: current point → floor, for depth reading.
		const hz = zAt(cur.mu, cur.sigma2);
		sliceData[o++] = wx(cur.mu);
		sliceData[o++] = wy(cur.sigma2);
		sliceData[o++] = hz;
		sliceData[o++] = 0.35;
		sliceData[o++] = wx(cur.mu);
		sliceData[o++] = wy(cur.sigma2);
		sliceData[o++] = 0;
		sliceData[o] = 0.35;

		// New sample → new profiles; angle is unchanged so draw() wouldn't
		// rebuild the walls on its own.
		buildWalls();

		if (gl) draw();
	});

	// Swing to a named view: shortest way round in azimuth, eased.
	let viewRaf = 0;
	function goTo(v: (typeof VIEWS)[number]) {
		viewId = v.id;
		vel = 0;
		cancelAnimationFrame(viewRaf);
		const a0 = angle;
		const t0 = tilt;
		const dA = ((((v.angle - a0) % TAU) + TAU + Math.PI) % TAU) - Math.PI;
		const dT = v.tilt - t0;
		const start = performance.now();
		const DUR = 650;
		const step = (now: number) => {
			const k = Math.min(1, (now - start) / DUR);
			const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
			angle = (((a0 + dA * e) % TAU) + TAU) % TAU;
			setTilt(t0 + dT * e);
			draw();
			if (k < 1) viewRaf = requestAnimationFrame(step);
		};
		viewRaf = requestAnimationFrame(step);
	}

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		// Grab the floor handle → move the point; anywhere else → rotate. Moving
		// preventDefaults so a touch drag on the handle doesn't scroll the page.
		if (
			floorPos &&
			Math.hypot(e.clientX - rectX() - floorPos.x, e.clientY - rectY() - floorPos.y) <= HANDLE_HIT
		) {
			dragMode = 'move';
			(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
			e.preventDefault();
			// No move yet: a bare click on the handle must not end the run.
			return;
		}
		dragMode = 'rotate';
		dragging = true;
		flingVel = 0;
		lastX = e.clientX;
		lastPT = e.timeStamp;
		cancelAnimationFrame(viewRaf);
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
		kick();
	}
	const rectX = () => canvas.getBoundingClientRect().left;
	const rectY = () => canvas.getBoundingClientRect().top;
	let lastX = 0;
	let lastPT = 0;
	function onPointerMove(e: PointerEvent) {
		if (dragMode === 'move') {
			if (e.buttons === 0) return;
			model.setPoint(unprojectFloor(e.clientX, e.clientY));
			e.preventDefault();
			return;
		}
		if (!dragging || e.buttons === 0) return;
		const dx = e.clientX - lastX;
		// Drag only rotates; tilt changes only through the view buttons.
		if (dx !== 0) {
			hasRotated = true;
			viewId = null;
		}
		const dA = -dx * DRAG_SENS;
		angle = (((angle + dA) % TAU) + TAU) % TAU;
		const dt = (e.timeStamp - lastPT) / 1000;
		if (dt > 0) flingVel = Math.max(-FLING_MAX, Math.min(FLING_MAX, dA / dt));
		lastX = e.clientX;
		lastPT = e.timeStamp;
	}
	function onPointerEnd(e: PointerEvent) {
		if (dragMode === 'move') {
			(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
			dragMode = 'rotate';
			return;
		}
		if (!dragging) return;
		(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
		vel = flingVel;
		dragging = false;
		kick();
	}
</script>

<div
	class="surface"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerEnd}
	onpointercancel={onPointerEnd}
	role="presentation"
>
	<canvas
		bind:this={canvas}
		aria-label={inference
			? 'Rotatable 3D surface of the joint log-likelihood at the hypothetical sample size, marking the null hypothesis and the likelihood ratio'
			: "Rotatable 3D surface of the joint log-likelihood; the highlighted path shows the optimizer's steps"}
	></canvas>
	<!-- Named viewpoints; pointerdown stops here so a click doesn't rotate. -->
	<div class="views" role="group" aria-label="Viewpoint" onpointerdown={(e) => e.stopPropagation()}>
		{#each VIEWS as v (v.id)}
			<button
				type="button"
				class:on={viewId === v.id}
				aria-pressed={viewId === v.id}
				title={v.title}
				onclick={() => goTo(v)}>{v.label}</button
			>
		{/each}
	</div>
	<svg class="gnomon" aria-hidden="true">
		{#each axisPaths as d, i (i)}
			<path {d} />
		{/each}
		<!-- Summit → wall-peak guides: explore only (in inference they compete
		     with the ½·LR level guide). -->
		{#if !inference}
			{#each guidePaths as d, i (i)}
				<path class="guide" class:faded={fadeOf('profile') < 1} {d} />
			{/each}
		{/if}
		{#if headPos}
			<circle class="param-point" cx={headPos.x} cy={headPos.y} r="6" />
		{/if}
		{#each peakDots as pt, i (i)}
			<circle class="wall-peak" class:faded={fadeOf('profile') < 1} cx={pt.x} cy={pt.y} r="3.5" />
		{/each}
		{#if floorPos}
			<circle class="floor-handle" cx={floorPos.x} cy={floorPos.y} r="7" />
		{/if}
		{#if lrGeo}
			<!-- Each point's label sits on the side facing away from the other
			     point, so they never collide as the view rotates. -->
			{@const mleRight = !lrGeo.nullPt || lrGeo.summit.x >= lrGeo.nullPt.x}
			<g class="lr">
				<path class="null-floor" class:faded={fadeOf('null') < 1} d={lrGeo.nullFloor} />
				<path class="ridge" class:faded={fadeOf('ridge') < 1} d={lrGeo.ridge} />
				{#each lrGeo.guides as d, i (i)}<path class="guide" {d} />{/each}
				{#each lrGeo.lines as d, i (i)}<path class="bracket" {d} />{/each}
				{#if lrGeo.slopeTri}
					<path class="slope-tri" d={lrGeo.slopeTri} />
					<path class="slope-legs" d={lrGeo.slopeLegs} />
					<path class="slope-hyp" d={lrGeo.slopeHyp} />
				{/if}
				{#each lrGeo.labels as l, i (i)}
					<text
						class="lr-label"
						x={l.at.x}
						y={l.at.y}
						text-anchor={l.anchor}
						dominant-baseline="central">{l.text}</text
					>
				{/each}
				<circle class="param-point" cx={lrGeo.summit.x} cy={lrGeo.summit.y} r="5" />
				<text
					class="lr-label pt-label"
					x={lrGeo.summit.x + (mleRight ? 9 : -9)}
					y={lrGeo.summit.y - 10}
					text-anchor={mleRight ? 'start' : 'end'}>MLE</text
				>
				<!-- Wald uses only the unrestricted MLE, so the null's best point is
				     not part of its geometry. -->
				{#if lrGeo.nullPt && model.p.test !== 'wald'}
					<circle class="null-point" cx={lrGeo.nullPt.x} cy={lrGeo.nullPt.y} r="5" />
					<text
						class="lr-label pt-label"
						x={lrGeo.nullPt.x + (mleRight ? -9 : 9)}
						y={lrGeo.nullPt.y + 18}
						text-anchor={mleRight ? 'end' : 'start'}
						>best under H₀{#if model.p.test === 'score'}<tspan
								class="sub"
								x={lrGeo.nullPt.x + (mleRight ? -9 : 9)}
								dy="1.2em">flat in σ²</tspan
							>{/if}</text
					>
				{/if}
				{#if model.p.test === 'LRT'}
					<circle class="null-point" cx={lrGeo.wallNull.x} cy={lrGeo.wallNull.y} r="3.5" />
				{/if}
			</g>
		{/if}
	</svg>
	<span class="axis-tag" bind:this={muTag}>μ</span>
	<span class="axis-tag" bind:this={s2Tag}>σ²</span>
	<span class="axis-tag" bind:this={llTag}>ℓ</span>
	{#if !hasRotated}
		<span class="hint"
			>{inference ? 'drag to rotate' : 'drag to rotate · drag the ring to move'}</span
		>
	{/if}
	<p class="visually-hidden">
		{#if inference}
			A wireframe surface of the log-likelihood over the mean and variance at the hypothetical
			sample size. The null hypothesis is a line across the surface at the null mean; its highest
			point is lower than the summit, and twice that difference in log-likelihood is the likelihood
			ratio statistic. The same test is shown in the 2D figure.
		{:else}
			A wireframe surface of the log-likelihood over the mean and variance. The surface rises to a
			single peak at the maximum likelihood estimates; the highlighted path traces the optimizer's
			steps toward it. The same information is available in the contour view.
		{/if}
	</p>
</div>

<style>
	/* Same footprint as the contour so toggling causes no layout shift. */
	.surface {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 0.75;
		cursor: grab;
		touch-action: pan-y;
		user-select: none;
	}
	.surface:active {
		cursor: grabbing;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	/* Axis gnomon overlay: user units = CSS px (no viewBox, fills the canvas
	   box), so the JS-projected px coordinates map 1:1. Thin, soft, and above
	   the canvas but click-through. */
	.gnomon {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}
	.gnomon path {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.25;
		stroke-linecap: round;
		stroke-linejoin: round;
		opacity: 0.85;
	}
	/* Same treatment as the 2D contour's current-position dot. */
	.gnomon .param-point {
		fill: var(--heading);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.gnomon .guide {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1;
		stroke-dasharray: 3 3;
		opacity: 0.55;
	}
	.gnomon .wall-peak {
		fill: var(--marginal);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	/* Inference overlay: coral = the null hypothesis (as in the 2D figure). */
	.gnomon .null-floor {
		fill: none;
		stroke: #e17055;
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
		opacity: 0.8;
	}
	.gnomon .null-point {
		fill: #e17055;
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	.gnomon .bracket {
		fill: none;
		stroke: var(--heading);
		stroke-width: 1.5;
	}
	.gnomon .ridge {
		fill: none;
		stroke: var(--marginal);
		stroke-width: 2;
		stroke-dasharray: 1 4;
		stroke-linecap: round;
	}
	.gnomon .faded {
		opacity: 0.12;
	}
	.gnomon .pt-label {
		font-weight: 600;
	}
	.gnomon .pt-label .sub {
		font-weight: 400;
		fill: var(--muted);
	}
	.gnomon .slope-tri {
		fill: var(--viz-accent);
		fill-opacity: 0.35;
		stroke: none;
	}
	.gnomon .slope-legs {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
	.gnomon .slope-hyp {
		fill: none;
		stroke: var(--viz-accent);
		stroke-width: 2.25;
		stroke-linecap: round;
	}
	.gnomon .lr-label {
		font-size: 12px;
		fill: var(--heading);
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 3px;
	}
	/* The grab handle for moving the point: a hollow ring at the drop-line foot.
	   Purely visual — the gnomon overlay is click-through and hit-testing is done
	   in JS against floorPos (see onPointerDown). */
	.gnomon .floor-handle {
		fill: color-mix(in srgb, var(--heading) 10%, transparent);
		stroke: var(--heading);
		stroke-width: 1.5;
		opacity: 0.75;
	}
	/* Positioned each frame via an inline transform (JS projects the world
	   anchor), so top/left stay at 0 and only the transform moves them. */
	.axis-tag {
		position: absolute;
		top: 0;
		left: 0;
		font-size: 13px;
		font-style: italic;
		color: var(--heading);
		pointer-events: none;
		will-change: transform;
		/* Halo in the page bg so the label reads over the wireframe. */
		text-shadow:
			0 0 3px var(--bg),
			0 0 3px var(--bg),
			0 0 3px var(--bg);
	}
	.views {
		position: absolute;
		top: 0.4rem;
		left: 0.4rem;
		display: inline-flex;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg);
		text-shadow: none;
	}
	.views button {
		padding: 0.2rem 0.55rem;
		border: none;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.views button + button {
		border-left: 1px solid var(--rule);
	}
	.views button:hover {
		color: var(--ink);
	}
	.views button.on {
		color: var(--heading);
		background: var(--inset);
	}
	.hint {
		position: absolute;
		right: 0.6rem;
		bottom: 0.4rem;
		font-size: 0.72rem;
		color: var(--muted);
		pointer-events: none;
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
