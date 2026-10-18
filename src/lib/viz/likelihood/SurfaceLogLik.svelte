<script lang="ts">
	/* 3D wireframe of the joint log-likelihood over (μ, σ²), with the
	   optimizer's path and the current point on it — the contour plot's hill
	   made literal. Adapted from HeroGaussianMesh.svelte (same WebGL2
	   scaffolding: static lattice + primitive-restart LINE_STRIP, dynamic
	   interleaved xyzα buffers, DPR cap, theme-following opaque clear,
	   context-loss rebuild, drag-to-rotate with fling). It is the joint view
	   for every visitor; under reduced motion the fling and the viewpoint
	   swings are instant, since nothing else moves unprompted.

	   Deliberate differences from the hero: this is a reading instrument, not
	   a decoration — no ambient auto-spin, no click-spawned climbers, no edge
	   vignette. There is no continuous render loop: frames draw on demand when
	   the model changes, and a rAF loop runs only while a drag/fling is
	   actually rotating the view. The surface is the shared 100×100 grid from
	   the state (wireframe walks every 4th grid line, so the drawn curves stay
	   smooth).

	   Height is ℓ itself, relative to the peak: z ∝ ℓ − ℓ̂, from the summit
	   down to a floor FLOOR_D log-units below it. There the mesh and the teal
	   slices keep descending a short way below the floor plane, fading out (the
	   hill goes on down, endlessly into the σ²→0 trench), a dashed waterline
	   marks where the hill meets the floor, and the walls stop. Uncut, ℓ renders as a plateau with one cliff (over this
	   frame it falls hundreds of log-units into the σ²→0 trench while the σ²
	   ridge drops only ~7), and the likelihood L is a needle; with the floor
	   the μ parabola, the σ² ridge, and its skew are all visible, and every
	   annotation reads literally (slopes are scores, the Fisher curve is a
	   parabola, the ½·LR bracket is to scale). At 50 the default start
	   (30 below the peak) sits mid-hill and ~85% of the frame is drawn.

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
	import { contours } from 'd3-contour';
	import { prefersReducedMotion } from 'svelte/motion';
	import type { LikelihoodState } from './likelihood.svelte';
	import type { ViewpointId } from './ViewpointDock.svelte';
	import {
		hessSigma2Expected,
		infoMu,
		logLikSum,
		MU_MAX,
		MU_MIN,
		profileMu,
		scoreMu,
		scoreSigma2,
		SIGMA2_MAX,
		SIGMA2_MIN,
		type OptimPoint
	} from './model';

	interface Props {
		model: LikelihoodState;
		mode?: 'explore' | 'inference';
		/** Key entries being emphasized (SurfaceKey ids); everything else dims. */
		emphasis?: string[] | null;
		/** WebGL2 unavailable or init failed — the parent falls back to 2D. */
		onunavailable?: () => void;
		/** Named viewpoint (buttons live in ViewpointDock): setting it swings
		 * the camera there; rotating by hand clears it. */
		view?: ViewpointId | null;
		/** Explore mode: what the readout entry under the pointer (JointLogLik)
		 * draws at the point: its height ℓ, or the slope triangle along a slice. */
		mark?: 'll' | 'mu' | 's2' | null;
	}
	let {
		model,
		mode = 'explore',
		emphasis = null,
		onunavailable,
		mark = null,
		view: viewpoint = $bindable('angled')
	}: Props = $props();
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
	const FLOOR_D = 50; // log-units from the peak down to the drawn floor; see header
	// Below the floor the mesh (and the teal slices) keep descending for SINK
	// world units, fading out, so the hill reads as continuing down rather
	// than cut off. Overlays stay on the floor plane.
	const SINK = 0.9;
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
	// ℓₚ(μ) — it lands exactly on the amber wall curve. Looking along μ, the outline is ℓ(μ̂, σ²), the other wall.
	// Labels and the buttons are in ViewpointDock.
	const VIEWS: Record<ViewpointId, { angle: number; tilt: number }> = {
		angled: { angle: 0.7, tilt: TILT_DEFAULT },
		mu: { angle: 0, tilt: TILT_MAX },
		s2: { angle: (3 * Math.PI) / 2, tilt: TILT_MAX }
	};
	// The view the camera last swung to, so only a new selection animates.
	let shownView: ViewpointId | null = 'angled';
	$effect(() => {
		const v = viewpoint;
		untrack(() => {
			if (v && v !== shownView) goTo(v);
			shownView = v;
		});
	});

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
	// The point is below the drawn floor (ℓ < ℓ̂ − FLOOR_D): only its floor
	// ring shows, labeled.
	let headBelow = $state(false);
	// Ghost of the next iteration: its route along the surface (with a
	// screen-space arrowhead) and its landing dot; plus, for Fisher scoring,
	// the quadratic approximation it climbs instead of the hill.
	let ghost = $state<{
		route: string;
		sunk: string;
		head: string;
		dot: Pt | null;
		endBelow: boolean;
	} | null>(null);
	let capPaths = $state<string[]>([]);
	// Where the hill meets the floor (the ℓ̂ − FLOOR_D contour), as world
	// rings cached per grid and threshold; projected to an SVG path per frame.
	let waterline = $state('');
	let waterRings: [number, number][][] = [];
	let waterKey = '';
	// The point's height ℓ: a stem from the floor up to it (explore mode).
	let heightGeo = $state<{ stem: string; label: { at: Pt; text: string } } | null>(null);
	// The selected score's slope triangle on its slice (explore mode).
	let slopeGeo = $state<{
		tri: string;
		legs: string;
		hyp: string;
		label: { at: Pt; text: string; anchor: 'start' | 'end' };
	} | null>(null);
	// Explore mode: the current point carried across to each profile wall
	// (SVG overlay like the gnomon), recomputed each frame in positionLabels.
	// A level guide at the point's height, the gap up to the wall curve (what
	// the best other parameter would add; zero once it is reached), and the
	// curve's value at the current parameter.
	let tracks = $state<{ guide: string; len: number; gap: string; gapLen: number; dot: Pt }[]>([]);
	// Dashed overlays: pathLength = world length × px per world unit, so a
	// dash pattern is laid along the geometry rather than along the screen
	// path. Without it the dashes slide as rotation stretches the projection.
	let dashUnit = $state(64);
	const wlen = (a: readonly number[], b: readonly number[]) =>
		Math.hypot(a[0] - b[0], a[1] - b[1], (a[2] ?? 0) - (b[2] ?? 0));
	type W = [number, number, number];
	// Dashes cut in world space along a 3D polyline and projected piece by
	// piece, so on a curve each dash stays on the same bit of geometry while
	// the view rotates (a uniform pathLength only fixes straight lines). `on`
	// and `off` are in px at the unforeshortened scale; the stroke is solid.
	function dashPath(lines: W[][], on: number, off: number): string {
		const dOn = on / dashUnit;
		const period = (on + off) / dashUnit;
		let d = '';
		const at = (a: W, b: W, f: number) =>
			project(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
		for (const pts of lines) {
			let phase = 0;
			let drawing = false;
			for (let i = 1; i < pts.length; i++) {
				const a = pts[i - 1];
				const b = pts[i];
				const L = wlen(a, b);
				if (L === 0) continue;
				let t = 0;
				while (t < L - 1e-9) {
					const inOn = phase < dOn;
					const step = Math.min(inOn ? dOn - phase : period - phase, L - t);
					if (inOn) {
						const q0 = at(a, b, t / L);
						const q1 = at(a, b, (t + step) / L);
						if (!drawing) d += `M${fx(q0.x)},${fx(q0.y)}`;
						d += `L${fx(q1.x)},${fx(q1.y)}`;
						drawing = true;
					} else drawing = false;
					t += step;
					phase = (phase + step) % period;
					if (phase >= dOn) drawing = false;
				}
			}
		}
		return d;
	}
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
		guideLens: number[]; // world lengths, for world-anchored dashes
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
	uniform float uClip;    // mesh: fade below the floor plane over SINK (see zSink)
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
		float sink = uClip > 0.5 ? clamp(1.0 + min(aPos.z, 0.0) / ${glf(SINK)}, 0.0, 1.0) : 1.0;
		vAlpha = uMode == 0 ? depthA * sink : aAlpha;
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

	// z from ℓ (see header): linear in ℓ − ℓ̂, Z_HEIGHT at the peak, 0 at the
	// floor FLOOR_D below it (scaled by n in inference mode), clamped there.
	function zOf(v: number, top: number): number {
		return Math.max(0, 1 + (zScale * (v - top)) / FLOOR_D) * Z_HEIGHT;
	}
	// Under the floor: overlays sit on it; walls and the Fisher curves stop.
	const onFloor = (z: number) => z <= 1e-4;
	// The sinking version of zOf for the mesh and slices: continues linearly
	// below the floor, bottoming out (fully faded) at −SINK.
	function zSink(v: number, top: number): number {
		return Math.max(-SINK, (1 + (zScale * (v - top)) / FLOOR_D) * Z_HEIGHT);
	}
	const sinkAlpha = (z: number, a: number) => (z >= 0 ? a : a * Math.max(0, 1 + z / SINK));

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
			const z = zOf(profileMu(sample, mu), g.max);
			sliceData[o++] = z;
			sliceData[o++] = onFloor(z) ? 0 : WALL_ALPHA;
		}
		const sqrtMax = Math.sqrt(SIGMA2_MAX);
		for (let i = 0; i < SLICE_N; i++) {
			const t = 1 + ((sqrtMax - 1) * i) / (SLICE_N - 1);
			const s2 = t * t;
			sliceData[o++] = wallX;
			sliceData[o++] = wy(s2);
			const z = zOf(logLikSum(sample, muHat, s2), g.max);
			sliceData[o++] = z;
			sliceData[o++] = onFloor(z) ? 0 : WALL_ALPHA;
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
				pos[o++] = zSink(g.values[j * g.cols + i], g.max);
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
			'uFade',
			'uClip'
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

	const inFrame = (mu: number, s2: number) =>
		mu >= MU_MIN && mu <= MU_MAX && s2 >= SIGMA2_MIN && s2 <= SIGMA2_MAX;
	const fx = (n: number) => n.toFixed(1);
	const chevron = (a: Pt, t: Pt) => {
		let dx = t.x - a.x;
		let dy = t.y - a.y;
		const len = Math.hypot(dx, dy) || 1;
		dx /= len;
		dy /= len;
		const c = Math.cos(HEAD_A);
		const s = Math.sin(HEAD_A);
		return (
			`M${fx(t.x - HEAD_L * (dx * c - dy * s))},${fx(t.y - HEAD_L * (dx * s + dy * c))}` +
			`L${fx(t.x)},${fx(t.y)}L${fx(t.x - HEAD_L * (dx * c + dy * s))},${fx(t.y - HEAD_L * (-dx * s + dy * c))}`
		);
	};

	// The next step's route: the straight (μ, σ²) line from the point to the
	// next iterate, lifted onto the surface and cut where it leaves the frame
	// (an overshooting step then ends in an arrow at the edge, with no dot).
	function ghostGeometry(next: OptimPoint) {
		const p = model.p;
		const top = model.grid.max;
		const N = 40;
		// Follows the surface as drawn, including where it sinks below the floor
		// (that stretch goes on a faint path) and vanishing where the sinking
		// mesh has faded out.
		type Q = Pt & { below: boolean; gone: boolean; w: [number, number, number] };
		const pts: Q[] = [];
		let left = false;
		for (let i = 0; i <= N; i++) {
			const t = i / N;
			const mu = p.mu + (next.mu - p.mu) * t;
			const s2 = p.sigma2 + (next.sigma2 - p.sigma2) * t;
			if (!inFrame(mu, s2)) {
				left = true;
				break;
			}
			const z = zSink(logLikSum(p.sample, mu, s2), top);
			const w: [number, number, number] = [wx(mu), wy(s2), z];
			pts.push({ ...project(w[0], w[1], w[2]), w, below: z < 0, gone: z <= -SINK + 1e-6 });
		}
		if (pts.length < 2) return null;
		// Split into stretches on the hill and sunk below the floor, each dashed
		// in world space.
		const up: W[][] = [];
		const down: W[][] = [];
		let cur: W[] | null = null;
		let curDown = false;
		for (let i = 1; i < pts.length; i++) {
			const a = pts[i - 1];
			const b = pts[i];
			if (a.gone || b.gone) {
				cur = null;
				continue;
			}
			const isDown = a.below || b.below;
			if (!cur || isDown !== curDown) {
				cur = [a.w];
				(isDown ? down : up).push(cur);
				curDown = isDown;
			}
			cur.push(b.w);
		}
		const route = dashPath(up, 5, 4);
		const sunk = dashPath(down, 5, 4);
		const end = pts[pts.length - 1];
		const visible = !end.gone;
		return {
			route,
			sunk,
			head: visible ? chevron(pts[pts.length - 2], end) : '',
			dot: left || !visible ? null : end,
			endBelow: end.below
		};
	}

	// Fisher scoring's quadratic model of ℓ around the point (expected
	// information, no cross term), drawn as two coral parabolas through the
	// point along μ and σ² — the model's version of the teal slices — on the
	// surface's height scale. Its top is the next iterate. A curve stops where
	// it rises past the ceiling: far from the MLE the quadratic promises far
	// more than the hill holds, which is why the step overshoots.
	function capGeometry(): string[] {
		const p = model.p;
		const n = p.sample.length;
		const top = model.grid.max;
		const l0 = logLikSum(p.sample, p.mu, p.sigma2);
		const gm = scoreMu(n, p.mu, model.muHat, p.sigma2);
		const gs = scoreSigma2(p.sample, p.mu, p.sigma2);
		const im = infoMu(n, p.sigma2);
		const is = -hessSigma2Expected(n, p.sigma2);
		const ceil = 1.15 * Z_HEIGHT;
		const N = 80;
		// Keep only the stretch through the point: past the ceiling the curve
		// may re-enter the frame far away, which reads as a stray mark.
		const curve = (at: (t: number) => [number, number, number], t0: number) => {
			const runs: { pts: W[]; lo: number; hi: number }[] = [];
			let cur: { pts: W[]; lo: number; hi: number } | null = null;
			for (let i = 0; i <= N; i++) {
				const [mu, s2, ll] = at(i / N);
				const z = zOf(ll, top);
				if (z > ceil || onFloor(z)) {
					cur = null;
					continue;
				}
				if (!cur) runs.push((cur = { pts: [], lo: i / N, hi: i / N }));
				cur.pts.push([wx(mu), wy(s2), z]);
				cur.hi = i / N;
			}
			const run = runs.find((r) => t0 >= r.lo - 1 / N && t0 <= r.hi + 1 / N);
			// Dotted: near-zero dashes with round caps.
			return run && run.pts.length > 1 ? dashPath([run.pts], 0.01, 4) : '';
		};
		const alongMu = curve(
			(t) => {
				const mu = MU_MIN + (MU_MAX - MU_MIN) * t;
				const dm = mu - p.mu;
				return [mu, p.sigma2, l0 + gm * dm - 0.5 * im * dm * dm];
			},
			(p.mu - MU_MIN) / (MU_MAX - MU_MIN)
		);
		const alongS2 = curve(
			(t) => {
				const s2 = SIGMA2_MIN + (SIGMA2_MAX - SIGMA2_MIN) * t;
				const ds = s2 - p.sigma2;
				return [p.mu, s2, l0 + gs * ds - 0.5 * is * ds * ds];
			},
			(p.sigma2 - SIGMA2_MIN) / (SIGMA2_MAX - SIGMA2_MIN)
		);
		return [alongMu, alongS2].filter(Boolean);
	}

	function waterlineRings(): [number, number][][] {
		const g = model.grid;
		const thr = g.max - FLOOR_D / zScale;
		const key = `${g.max}|${thr}|${g.cols}`;
		if (key === waterKey) return waterRings;
		const [c] = contours().size([g.cols, g.rows]).thresholds([thr])(Array.from(g.values));
		const toWorld = (gx: number, gy: number): [number, number] => [
			wx(g.muMin + gx * g.muStep),
			wy(g.sigma2Min + gy * g.sigma2Step)
		];
		// Only the rings' outer boundaries; the grid edge is not part of the
		// waterline, so points on the frame boundary break the line.
		waterRings = (c.coordinates as number[][][][]).flatMap((poly) =>
			poly.map((ring) => ring.map(([gx, gy]) => toWorld(gx, gy)))
		);
		waterKey = key;
		return waterRings;
	}

	function waterlinePath(): string {
		const edge = RANGE - 1e-3;
		const lines: W[][] = [];
		for (const ring of waterlineRings()) {
			let cur: W[] | null = null;
			for (const [x, y] of ring) {
				if (Math.abs(x) >= edge || Math.abs(y) >= edge) {
					cur = null;
					continue;
				}
				if (!cur) lines.push((cur = []));
				cur.push([x, y, 0]);
			}
		}
		return dashPath(lines, 4, 3);
	}

	// Slope triangle along one slice at the point, like the score test's: run
	// uphill along the axis, rise from the surface's tangent. Height is ℓ, so
	// rise over run is the score (in each axis's own units); the label gives
	// its value. Below the floor the drawn slope is 0, but the label holds.
	function slopeGeometry(axis: 'mu' | 's2') {
		const p = model.p;
		const top = model.grid.max;
		const n = p.sample.length;
		const zAt = (mu: number, s2: number) => zOf(logLikSum(p.sample, mu, s2), top);
		const z0 = zAt(p.mu, p.sigma2);
		const isMu = axis === 'mu';
		const eps = isMu ? 0.01 : 0.1;
		const dz = isMu
			? (zAt(p.mu + eps, p.sigma2) - zAt(p.mu - eps, p.sigma2)) / (2 * eps)
			: (zAt(p.mu, p.sigma2 + eps) - zAt(p.mu, Math.max(SIGMA2_MIN, p.sigma2 - eps))) / (2 * eps);
		const score = isMu
			? scoreMu(n, p.mu, model.muHat, p.sigma2)
			: scoreSigma2(p.sample, p.mu, p.sigma2);
		const dir = score >= 0 ? 1 : -1;
		// Run: an eighth of the axis, shortened to stay inside the frame.
		const lo = isMu ? MU_MIN : SIGMA2_MIN;
		const hi = isMu ? MU_MAX : SIGMA2_MAX;
		const at = isMu ? p.mu : p.sigma2;
		// Rise is capped at a third of the hill's height (a steep score far
		// down the hill would otherwise spear far above the summit).
		const run = Math.min(
			(hi - lo) / 8,
			dir > 0 ? hi - at : at - lo,
			Math.abs(dz) > 0 ? Z_HEIGHT / 3 / Math.abs(dz) : Infinity
		);
		const end = at + dir * run;
		const pt = (v: number, z: number) =>
			isMu ? project(wx(v), wy(p.sigma2), z) : project(wx(p.mu), wy(v), z);
		const base = pt(at, z0);
		const foot = pt(end, z0);
		const apex = pt(end, z0 + Math.abs(dz) * run);
		const f = (v: number) => v.toFixed(1);
		const name = isMu ? '∂ℓ/∂μ' : '∂ℓ/∂σ²';
		return {
			tri: `M${f(base.x)},${f(base.y)}L${f(foot.x)},${f(foot.y)}L${f(apex.x)},${f(apex.y)}Z`,
			legs: `M${f(base.x)},${f(base.y)}L${f(foot.x)},${f(foot.y)}L${f(apex.x)},${f(apex.y)}`,
			hyp: `M${f(base.x)},${f(base.y)}L${f(apex.x)},${f(apex.y)}`,
			label: {
				at: { x: apex.x + (apex.x >= base.x ? 6 : -6), y: Math.min(apex.y, base.y) - 10 },
				text: `${name} = ${score.toFixed(3).replace('-', '−')}`,
				anchor: (apex.x >= base.x ? 'start' : 'end') as 'start' | 'end'
			}
		};
	}

	// The point's height over the floor, drawn over the GL drop line and
	// labeled with ℓ itself (the floor is FLOOR_D below the peak, not ℓ = 0).
	function heightGeometry() {
		const p = model.p;
		const z = zOf(model.ll, model.grid.max);
		const foot = project(wx(p.mu), wy(p.sigma2), 0);
		const head = project(wx(p.mu), wy(p.sigma2), z);
		const f = (v: number) => v.toFixed(1);
		return {
			stem: `M${f(foot.x)},${f(foot.y)}L${f(head.x)},${f(head.y)}`,
			label: {
				at: { x: Math.max(foot.x, head.x) + 8, y: (foot.y + head.y) / 2 },
				text: `ℓ = ${model.ll.toFixed(2).replace('-', '−')}`
			}
		};
	}

	// Position the HTML axis labels at their world anchors and rebuild the SVG
	// gnomon (both can't be GL, so they overlay the canvas in CSS px each frame).
	function positionLabels() {
		dashUnit = scl * view.scale;
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
		waterline = waterlinePath();
		slopeGeo = !inference && (mark === 'mu' || mark === 's2') ? slopeGeometry(mark) : null;
		heightGeo = !inference && mark === 'll' ? heightGeometry() : null;
		const next = !inference && !model.running ? model.nextStep : null;
		ghost = next ? ghostGeometry(next) : null;
		capPaths = next && p.algo === 'fisherScoring' ? capGeometry() : [];
		if (inference) {
			headPos = null;
			floorPos = null;
		} else {
			const hz = zOf(logLikSum(p.sample, p.mu, p.sigma2), model.grid.max);
			headPos = project(wx(p.mu), wy(p.sigma2), hz);
			headBelow = onFloor(hz);
			// Near edge-on the floor projects to a line and can't be inverted, so
			// the handle (and floor dragging) switches off.
			floorPos = cb > 0.25 ? project(wx(p.mu), wy(p.sigma2), 0) : null;
		}

		// Wall peaks: both sit at ℓ̂, above μ̂ and σ̂², and mark the estimates.
		const top = model.grid.max;
		const zPk = zOf(profileMu(p.sample, model.muHat), top);
		const summit = project(wx(model.muHat), wy(model.sigma2Hat), zPk);
		const muWall = wallMuSign * RANGE;
		const s2Wall = wallS2Sign * RANGE;
		// Only walls that aren't edge-on get their peak dot and track.
		const wv = wallsVisible();
		peakDots = [
			...(wv.mu ? [project(wx(model.muHat), muWall, zPk)] : []),
			...(wv.s2 ? [project(s2Wall, wy(model.sigma2Hat), zPk)] : [])
		];
		if (inference) tracks = [];
		else {
			const f = (n: number) => n.toFixed(1);
			const seg = (a: Pt, b: Pt) => `M${f(a.x)},${f(a.y)}L${f(b.x)},${f(b.y)}`;
			const x = wx(p.mu);
			const y = wy(p.sigma2);
			const zPt = zOf(model.ll, top);
			const from = project(x, y, zPt);
			// Track to the wall at (wxw, wyw), whose curve stands at height zCurve.
			const track = (wxw: number, wyw: number, zCurve: number, len: number) => {
				const at = project(wxw, wyw, zPt);
				const onCurve = project(wxw, wyw, zCurve);
				return {
					guide: seg(from, at),
					len,
					gap: seg(at, onCurve),
					gapLen: Math.abs(zCurve - zPt),
					dot: onCurve
				};
			};
			tracks = [
				...(wv.mu
					? [track(x, muWall, zOf(profileMu(p.sample, p.mu), top), Math.abs(y - muWall))]
					: []),
				...(wv.s2
					? [
							track(
								s2Wall,
								y,
								zOf(logLikSum(p.sample, model.muHat, p.sigma2), top),
								Math.abs(x - s2Wall)
							)
						]
					: [])
			];
		}
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
		const guideLens: number[] = [];
		const labels: Label[] = [];
		let slopeTri = '';
		let slopeHyp = '';
		let slopeLegs = '';

		if (p.test === 'LRT') {
			const wallTop = project(mx, wallY, zPk);
			guides.push(seg(project(wx(model.muHat), wallY, zPk), wallTop));
			guideLens.push(Math.abs(wx(model.muHat) - mx));
			if (nullPt) {
				guides.push(seg(nullPt, wallNull));
				guideLens.push(Math.abs(wy(s0) - wallY));
			}
			lines.push(seg(wallTop, wallNull) + capH(wallTop) + capH(wallNull));
			const m = mid(wallTop, wallNull);
			// Past the floor the bracket is cut short; say so rather than understate LR.
			labels.push({
				at: { x: m.x + 8, y: m.y },
				text: onFloor(z0) ? '½·LR (continues below the floor)' : '½·LR',
				anchor: 'start'
			});
		} else if (p.test === 'score' && nullPt) {
			// Slope triangle on the μ-slice at (μ₀, σ̂₀²): run Δμ uphill, rise from
			// the surface's tangent, so rise over run is U (at the n-scaled height);
			// the label gives its value. No σ² leg: σ̂₀² maximizes ℓ in σ² under the
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
			guideLens.push(zPk);
			const m = mid(a, b);
			labels.push({ at: { x: m.x, y: m.y - 12 }, text: 'μ̂ − μ₀', anchor: 'middle' });
		}
		// The ridge: for each μ the best σ² is σ̂² + (μ̂ − μ)², at height ℓₚ(μ).
		// The constrained maximum slides along it as μ₀ moves; the amber μ-profile
		// on the wall is its shadow. Stops where σ² leaves the plotted range.
		const ridgeLine: W[] = [];
		for (let i = 0; i < SLICE_N; i++) {
			const mu = MU_MIN + ((MU_MAX - MU_MIN) * i) / (SLICE_N - 1);
			const s2 = model.sigma2Hat + (model.muHat - mu) ** 2;
			if (s2 > SIGMA2_MAX) continue;
			ridgeLine.push([wx(mu), wy(s2), zOf(profileMu(p.sample, mu), top)]);
		}
		const ridge = dashPath([ridgeLine], 0.01, 5);
		return {
			nullFloor: seg(project(mx, -RANGE, 0), project(mx, RANGE, 0)),
			ridge,
			guideLens,
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
		dirty = false;
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
		g.uniform1f(u.uClip, 1);
		g.uniform3f(u.uColor, mesh[0], mesh[1], mesh[2]);
		g.drawElements(g.LINE_STRIP, meshIdxCount, g.UNSIGNED_INT, 0);
		g.uniform1f(u.uClip, 0);

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

	// Model and prop changes draw through here: once per frame at most, and an
	// off-screen surface only goes stale until it scrolls back. Effects must not
	// call draw() directly: they would subscribe to everything it reads.
	let dirty = false;
	let onScreen = true;
	let drawRaf = 0;
	function requestDraw() {
		if (!gl) return;
		dirty = true;
		if (!onScreen || drawRaf) return;
		drawRaf = requestAnimationFrame(() => {
			drawRaf = 0;
			if (dirty) draw();
		});
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
		// Untracked: draw() reads reactive state, and any re-run of this effect
		// rebuilds GL and its teardown cancels the viewpoint animation.
		untrack(() => resize());

		const ro = new ResizeObserver(() => resize());
		ro.observe(canvas);

		const themeObs = new MutationObserver(() => {
			if (!gl) return;
			isDark = document.documentElement.getAttribute('data-theme') === 'dark';
			accent = cssVarRgb('--viz-accent', accent); // colours may differ per theme
			marginalCol = cssVarRgb('--marginal', marginalCol);
			const bg = pageBg();
			gl.clearColor(bg[0], bg[1], bg[2], 1);
			requestDraw();
		});
		themeObs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		// The margin draws a stale surface before it is actually in view, since
		// the callback lands a frame after the scroll.
		const io = new IntersectionObserver(
			([e]) => {
				onScreen = e.isIntersecting;
				if (onScreen && dirty) requestDraw();
			},
			{ rootMargin: '200px 0px' }
		);
		io.observe(canvas);

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
			cancelAnimationFrame(drawRaf);
			raf = 0;
			drawRaf = 0;
			ro.disconnect();
			io.disconnect();
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

	// The next-step preview changed (algorithm, step size, run state):
	// re-place the overlays. Explore only; inference draws none of them.
	$effect(() => {
		if (inference) return;
		void model.nextStep;
		void model.running;
		void mark;
		requestDraw();
	});

	// Key emphasis changed: redraw with the new fades.
	$effect(() => {
		void emphasis;
		requestDraw();
	});

	// New sample → new surface: re-upload the lattice heights.
	$effect(() => {
		const pos = surfacePositions(); // tracks model.grid
		if (!gl) return;
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
		requestDraw();
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
			// Sinks and fades below the floor with the mesh; floats above the wires.
			const z = zSink(logLikSum(sample, p.mu, p.sigma2), g.max);
			lineData[o++] = z + 0.015;
			lineData[o++] = sinkAlpha(z, 1);
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
			const z = zSink(logLikSum(sample, mu, muSliceS2), g.max);
			sliceData[o++] = z + 0.012;
			sliceData[o++] = sinkAlpha(z, 0.9);
		}
		const sqrtMax = Math.sqrt(SIGMA2_MAX);
		for (let i = 0; i < SLICE_N; i++) {
			const t = 1 + ((sqrtMax - 1) * i) / (SLICE_N - 1);
			const s2 = t * t;
			sliceData[o++] = wx(cur.mu);
			sliceData[o++] = wy(s2);
			const z = zSink(logLikSum(sample, cur.mu, s2), g.max);
			sliceData[o++] = z + 0.012;
			sliceData[o++] = sinkAlpha(z, 0.9);
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

		requestDraw();
	});

	// Swing to a named view: shortest way round in azimuth, eased.
	let viewRaf = 0;
	function goTo(id: ViewpointId) {
		const v = VIEWS[id];
		vel = 0;
		cancelAnimationFrame(viewRaf);
		if (prefersReducedMotion.current) {
			angle = ((v.angle % TAU) + TAU) % TAU;
			setTilt(v.tilt);
			draw();
			return;
		}
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
		// Grab the floor handle → move the point; anywhere else → rotate.
		if ((e.target as Element).closest('.handle-hit')) {
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
			viewpoint = null;
		}
		// +angle carries the near side rightward, so the surface follows the cursor.
		const dA = dx * DRAG_SENS;
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
		// No coasting under reduced motion: the surface stops where it is let go.
		vel = prefersReducedMotion.current ? 0 : flingVel;
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
	<svg class="gnomon" aria-hidden="true">
		{#each axisPaths as d, i (i)}
			<path {d} />
		{/each}
		<!-- Point → wall tracks: explore only (in inference they would compete
		     with the ½·LR level guide). -->
		{#each tracks as t, i (i)}
			<g class="track" class:faded={fadeOf('profile') < 1}>
				<path class="guide" d={t.guide} pathLength={t.len * dashUnit || undefined} />
				<path class="guide" d={t.gap} pathLength={t.gapLen * dashUnit || undefined} />
			</g>
		{/each}
		{#if waterline}<path class="waterline" d={waterline} />{/if}
		{#each capPaths as d, i (i)}
			<path class="cap" class:faded={fadeOf('next') < 1} {d} />
		{/each}
		{#if ghost}
			<g class="ghost" class:faded={fadeOf('next') < 1}>
				<path class="dashes" d={ghost.route} />
				{#if ghost.sunk}<path class="dashes sunk" d={ghost.sunk} />{/if}
				{#if ghost.head}<path class:sunk={ghost.endBelow} d={ghost.head} />{/if}
				{#if ghost.dot}<circle
						class:sunk={ghost.endBelow}
						cx={ghost.dot.x}
						cy={ghost.dot.y}
						r="5"
					/>{/if}
			</g>
		{/if}
		{#if slopeGeo}
			<g class="slope">
				<path class="slope-tri" d={slopeGeo.tri} />
				<path class="slope-legs" d={slopeGeo.legs} />
				<path class="slope-hyp" d={slopeGeo.hyp} />
				<text
					class="lr-label"
					x={slopeGeo.label.at.x}
					y={slopeGeo.label.at.y}
					text-anchor={slopeGeo.label.anchor}
					dominant-baseline="central">{slopeGeo.label.text}</text
				>
			</g>
		{/if}
		{#if heightGeo}
			<g class="height">
				<path class="height-stem" d={heightGeo.stem} />
				<text
					class="lr-label"
					x={heightGeo.label.at.x}
					y={heightGeo.label.at.y}
					dominant-baseline="central">{heightGeo.label.text}</text
				>
			</g>
		{/if}
		{#if headPos && !headBelow}
			<circle class="param-point" cx={headPos.x} cy={headPos.y} r="6" />
		{/if}
		{#each peakDots as pt, i (i)}
			<circle class="wall-peak" class:faded={fadeOf('profile') < 1} cx={pt.x} cy={pt.y} r="3.5" />
		{/each}
		{#each tracks as t, i (i)}
			<circle
				class="track-dot"
				class:faded={fadeOf('profile') < 1}
				cx={t.dot.x}
				cy={t.dot.y}
				r="3.5"
			/>
		{/each}
		{#if floorPos}
			<circle class="floor-handle" cx={floorPos.x} cy={floorPos.y} r="7" />
			<!-- Off the drawn hill: the floor ring alone marks the point. -->
			{#if headBelow}
				<text class="below-label" x={floorPos.x + 11} y={floorPos.y} dominant-baseline="central"
					>below the floor</text
				>
			{/if}
		{/if}
		{#if lrGeo}
			<!-- Each point's label sits on the side facing away from the other
			     point, so they never collide as the view rotates. -->
			{@const mleRight = !lrGeo.nullPt || lrGeo.summit.x >= lrGeo.nullPt.x}
			<g class="lr">
				<path
					class="null-floor"
					class:faded={fadeOf('null') < 1}
					d={lrGeo.nullFloor}
					pathLength={2 * RANGE * dashUnit}
				/>
				<path class="ridge" class:faded={fadeOf('ridge') < 1} d={lrGeo.ridge} />
				{#each lrGeo.guides as d, i (i)}<path
						class="guide"
						{d}
						pathLength={lrGeo.guideLens[i] * dashUnit || undefined}
					/>{/each}
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
	{#if floorPos}
		<div class="handle-hit" style:transform="translate({floorPos.x}px, {floorPos.y}px)"></div>
	{/if}
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
	/* The hill's cut edge on the floor: the ℓ̂ − FLOOR_D contour. Its dashes
	   (and the ghost route's, the Fisher curves' and the ridge's dots) are cut
	   in world space by dashPath, so no stroke-dasharray here. */
	.gnomon .waterline {
		fill: none;
		stroke: var(--muted);
		stroke-width: 1;
		opacity: 0.7;
	}
	.gnomon .ghost path {
		fill: none;
		stroke: #e17055;
		stroke-width: 2;
		opacity: 0.8;
	}
	/* Where the step dips below the floor it fades, like the mesh there. */
	.gnomon .ghost .sunk {
		opacity: 0.3;
	}
	.gnomon .ghost circle {
		fill: var(--bg);
		stroke: #e17055;
		stroke-width: 2;
		stroke-dasharray: 3 2;
	}
	/* Dotted so the teal slice shows through where the model is exact (in μ). */
	.gnomon .cap {
		fill: none;
		stroke: #e17055;
		stroke-width: 2;
		stroke-linecap: round;
	}
	.gnomon .below-label {
		font-size: 11px;
		fill: var(--muted);
		paint-order: stroke;
		stroke: var(--bg);
		stroke-width: 3px;
	}
	.gnomon .wall-peak {
		fill: var(--marginal);
		stroke: var(--bg);
		stroke-width: 1.5;
	}
	/* Hollow, so at the MLE the filled peak dot shows through it. */
	.gnomon .track-dot {
		fill: var(--bg);
		stroke: var(--marginal);
		stroke-width: 2;
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
	/* The point's color, not the accent: the stem runs beside the teal σ² slice. */
	.gnomon .height-stem {
		fill: none;
		stroke: var(--heading);
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
	   Purely visual; .handle-hit takes the pointer. */
	.gnomon .floor-handle {
		fill: color-mix(in srgb, var(--heading) 10%, transparent);
		stroke: var(--heading);
		stroke-width: 1.5;
		opacity: 0.75;
	}
	/* The ring's hit target, a finger's width on touch screens. An HTML box
	   rather than an SVG circle so touch-action applies: a drag that starts
	   here moves the point in any direction instead of scrolling the page. */
	.handle-hit {
		position: absolute;
		top: 0;
		left: 0;
		width: 32px;
		height: 32px;
		margin: -16px 0 0 -16px;
		border-radius: 50%;
		touch-action: none;
	}
	@media (pointer: coarse) {
		.handle-hit {
			width: 48px;
			height: 48px;
			margin: -24px 0 0 -24px;
		}
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
