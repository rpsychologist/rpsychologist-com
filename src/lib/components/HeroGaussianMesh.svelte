<script lang="ts">
	/* Hero signature: a bivariate-normal density drawn as a slowly turning wireframe
	   surface — R's persp() plot restyled as a demoscene vector mesh. It's the site's
	   thesis object: a *surface* (2D density), so it shares its image with none of the
	   1D gallery tiles (bell overlap, scatter, tail, curve, intervals).

	   It's also a small toy: amber "climbers" ascend the density's log-gradient from a
	   random rim start up to the mode — hill-climbing / mode-finding made literal, a
	   nod to the likelihood viz. The off-diagonal (RHO) bends each path onto the
	   correlation ridge before the summit. Trials auto-launch on a slow timer (the
	   discoverability hint) and on click. Drag to spin by hand; inertia on release.

	   Rendered with WebGL2. A wireframe this size should cost ~nothing at 60fps, and it
	   does on the GPU: the lattice lives in one static vertex buffer, the vertex shader
	   does the rotate+project (angle is a uniform) and the per-vertex depth fade, the
	   whole grid draws in a single primitive-restart LINE_STRIP call, and the edge
	   vignette is in the fragment shader. Per frame the CPU sets a couple of uniforms
	   and issues a handful of draw calls — no per-frame geometry, no main-thread
	   rasterization. The dominant recurring cost is the browser *presenting* the
	   canvas each frame — fixed per frame, independent of resolution or draw work
	   (unaffected by DPR; in Firefox it is ~all the GPU-process CPU, dropping to ~0
	   when scrolled off-screen), so the loop is gated on visibility and
	   prefers-reduced-motion, and idle presents are capped near 30fps — full rate
	   only while dragging or while a fling still spins fast. alpha/antialias are
	   left at defaults:
	   on Apple-Silicon tile GPUs MSAA is ~free and measured faster *and* smoother
	   than the opaque, aliased config an earlier revision assumed was cheaper
	   (worth re-checking on weak/integrated GPUs, where MSAA fill can cost more).
	   The canvas still clears to the page bg, so it reads as an opaque panel and its
	   square corners stay invisible. Climbers are a small dynamic buffer; heads are GL
	   points with a shader-drawn glow. Decorative: no SSR frame (canvas is empty
	   without JS/WebGL), motion gated on prefers-reduced-motion and visibility, GL
	   init deferred to first intersection (phones hide the hero via display:none and
	   skip the context/shader cost entirely), the low-power GPU requested, and a
	   lost context parks the loop until the browser restores it. */

	let { class: klass = '' }: { class?: string } = $props();

	const N = 22; // grid divisions per axis
	const RANGE = 2.75; // x,y span
	const RHO = 0.5; // correlation -> a tilted ridge, not a textbook dome
	const Z_HEIGHT = 3.2; // world height the density peak maps to
	const TILT = 1.06; // view elevation (rad from top-down); ~persp phi≈29°
	const SPEED = (2 * Math.PI) / 120; // one revolution / 120s — ambient, not busy

	const W = 560; // virtual drawing space; fitted into the canvas with "meet"
	const H = 440;
	const SCALE = 82;
	const CX = W / 2;
	const CY = 250;
	const EXT = RANGE * Math.SQRT2; // rotating footprint radius, for depth normalisation

	// Climber trials
	const CLIMB_TIME = 5; // rim to summit; paced so the head steps ~1.4px per 30fps frame
	const LINGER = 1.1; // seconds the dot rests at the mode, fading, before removal
	const MAX_TRIALS = 4; // concurrent climbers (click can spawn; oldest drops)
	const MAX_CLIMB_VERTS = 260; // scratch-buffer cap (≈ RANGE/STEP + 2 per trail × trials)

	// Drag-to-rotate
	const DRAG_SENS = 0.012; // radians of azimuth per pixel dragged
	const FLING_MAX = 6; // cap release velocity (rad/s) so a hard flick can't blur out
	const EASE_TAU = 0.5; // seconds for the post-fling spin to relax back to SPEED
	const CLICK_SLOP = 4; // px of movement below which a press counts as a click
	const TAU = Math.PI * 2;

	// Present cap. Each presented frame has a fixed compositor cost (see header), so
	// idle frames present at ~30fps: the ambient spin moves the mesh edge <1px per
	// 30fps frame, and CLIMB_TIME paces climbers to a similar step. A drag or a fast
	// fling (~80px/s at the rim and up) would visibly judder, so those run at full rate.
	const IDLE_FRAME = 1 / 32; // min seconds between idle presents (~30fps, rAF-jitter tolerant)
	const FAST_VEL = 0.25; // rad/s beyond SPEED at which a fling forces full rate

	// Mesh flips with the theme; amber is the one warm, non-blue pop (RGB in 0..1).
	const MESH_DARK: [number, number, number] = [1, 1, 1];
	const MESH_LIGHT: [number, number, number] = [8 / 255, 9 / 255, 10 / 255];
	const AMBER: [number, number, number] = [232 / 255, 147 / 255, 23 / 255];

	// Correlated bivariate-normal density, peak 1, then lifted to Z_HEIGHT.
	const inv = 1 / (1 - RHO * RHO);
	const dens = (x: number, y: number) => Math.exp(-0.5 * inv * (x * x - 2 * RHO * x * y + y * y));

	const cb = Math.cos(TILT);
	const sb = Math.sin(TILT);
	const S = N + 1; // vertices per axis

	// Gradient ascent along the *normalised* log-gradient by a fixed arc length, so
	// samples are evenly spaced and the head glides at constant speed.
	const STEP = 0.05;
	type V = { x: number; y: number; z: number };
	function ascentPath(x: number, y: number): V[] {
		const pts: V[] = [{ x, y, z: dens(x, y) * Z_HEIGHT }];
		for (let k = 0; k < 200; k++) {
			const gx = -inv * (x - RHO * y);
			const gy = -inv * (y - RHO * x);
			const g = Math.hypot(gx, gy);
			if (g < 1e-4 || x * x + y * y < STEP * STEP) break;
			x += (gx / g) * STEP;
			y += (gy / g) * STEP;
			pts.push({ x, y, z: dens(x, y) * Z_HEIGHT });
		}
		pts.push({ x: 0, y: 0, z: Z_HEIGHT }); // land exactly on the mode
		return pts;
	}

	type Trial = { pts: V[]; head: number; done: number; speed: number };

	// Plain (non-reactive) state — mutated in the rAF loop, drawn imperatively.
	let angle = 0.7;
	let trials: Trial[] = [];
	let vel = SPEED;
	let dragging = false;
	let flingVel = 0;
	let running = false;

	let canvas: HTMLCanvasElement;
	let dpr = 1;
	let view = { scale: 1, ox: 0, oy: 0, cw: 0, ch: 0 };
	let isDark = false;
	let bg: [number, number, number] = [1, 1, 1]; // opaque clear = page bg (cheap composite)

	// The rendered page background, so an opaque canvas is invisible against the paper.
	function pageBg(): [number, number, number] {
		for (const el of [document.body, document.documentElement]) {
			const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
			if (m && m.length >= 3 && !(m.length >= 4 && +m[3] === 0))
				return [+m[0] / 255, +m[1] / 255, +m[2] / 255];
		}
		return isDark ? [0.05, 0.05, 0.06] : [0.98, 0.97, 0.96];
	}

	// GL objects/locations, assigned during setup, read by draw().
	let gl: WebGL2RenderingContext | null = null;
	let prog: WebGLProgram;
	let vaoMesh: WebGLVertexArrayObject;
	let vaoLines: WebGLVertexArrayObject;
	let vaoHeads: WebGLVertexArrayObject;
	let lineBuf: WebGLBuffer;
	let headBuf: WebGLBuffer;
	let meshIdxCount = 0;
	let u: Record<string, WebGLUniformLocation | null> = {};
	let glBuffers: WebGLBuffer[] = [];
	let glVaos: WebGLVertexArrayObject[] = [];

	const lineData = new Float32Array(MAX_CLIMB_VERTS * 4); // x,y,z,alpha per vertex
	const headData = new Float32Array(MAX_TRIALS * 4);

	function spawn(start?: { x: number; y: number }) {
		if (!running) return; // static under reduced motion / off-screen
		let x: number;
		let y: number;
		if (start) {
			const r = Math.hypot(start.x, start.y);
			const m = r > RANGE ? RANGE / r : 1; // clamp a click into the domain
			x = start.x * m;
			y = start.y * m;
		} else {
			const a = Math.random() * TAU;
			const r = RANGE * (0.8 + Math.random() * 0.14);
			x = r * Math.cos(a);
			y = r * Math.sin(a);
		}
		const pts = ascentPath(x, y);
		if (pts.length < 2) return;
		trials = [
			...trials.slice(-(MAX_TRIALS - 1)),
			{ pts, head: 0, done: 0, speed: (pts.length - 1) / CLIMB_TIME }
		];
	}

	// --- WebGL setup ---------------------------------------------------------------

	const glf = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n));

	const VERT = `#version 300 es
	precision highp float;
	precision highp int;
	layout(location = 0) in vec3 aPos;
	layout(location = 1) in float aAlpha;
	uniform vec2 uRot;      // cos, sin of azimuth
	uniform vec2 uTilt;     // cos, sin of elevation
	uniform float uFit;     // meet scale (CSS px per virtual unit)
	uniform vec2 uOff;      // fit offset (CSS px)
	uniform vec2 uCanvas;   // CSS px size
	uniform int uMode;      // 0 mesh (depth fade), 1 climber line, 2 head point
	uniform float uPoint;   // point size (device px)
	out float vAlpha;
	out vec2 vUV;
	const float CX = ${glf(CX)};
	const float CY = ${glf(CY)};
	const float SCL = ${glf(SCALE)};
	const float EXT = ${glf(EXT)};
	void main() {
		float x1 = aPos.x * uRot.x - aPos.y * uRot.y;
		float y1 = aPos.x * uRot.y + aPos.y * uRot.x;
		float sx = CX + x1 * SCL;
		float sy = CY - (y1 * uTilt.x + aPos.z * uTilt.y) * SCL;
		vec2 uv = vec2((uOff.x + sx * uFit) / uCanvas.x, (uOff.y + sy * uFit) / uCanvas.y);
		vUV = uv;
		gl_Position = vec4(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
		float depthA = 0.92 - 0.78 * ((y1 + EXT) / (2.0 * EXT));
		vAlpha = uMode == 0 ? depthA : aAlpha;
		gl_PointSize = uMode == 2 ? uPoint : 1.0;
	}`;

	const FRAG = `#version 300 es
	precision highp float;
	precision highp int;
	in float vAlpha;
	in vec2 vUV;
	uniform vec3 uColor;
	uniform int uMode;
	out vec4 frag;
	void main() {
		// Edge vignette — the old CSS radial mask, now free on the GPU.
		vec2 d = vUV - vec2(0.5, 0.45);
		float r = length(vec2(d.x / 1.15, d.y));
		float a = vAlpha * (1.0 - smoothstep(0.58, 1.0, r));
		if (uMode == 2) {
			float pr = length(gl_PointCoord - 0.5) * 2.0; // 0 centre .. 1 edge
			float core = smoothstep(0.55, 0.32, pr);
			float halo = exp(-pr * 3.0) * 0.5;
			a *= clamp(core + halo, 0.0, 1.0);
		}
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
		for (const name of ['uRot', 'uTilt', 'uFit', 'uOff', 'uCanvas', 'uMode', 'uPoint', 'uColor']) {
			u[name] = g.getUniformLocation(prog, name);
		}

		// Static lattice positions.
		const pos = new Float32Array(S * S * 3);
		let o = 0;
		for (let i = 0; i < S; i++) {
			const x = -RANGE + (2 * RANGE * i) / N;
			for (let j = 0; j < S; j++) {
				const y = -RANGE + (2 * RANGE * j) / N;
				pos[o++] = x;
				pos[o++] = y;
				pos[o++] = dens(x, y) * Z_HEIGHT;
			}
		}
		const posBuf = g.createBuffer()!;
		glBuffers.push(posBuf);
		g.bindBuffer(g.ARRAY_BUFFER, posBuf);
		g.bufferData(g.ARRAY_BUFFER, pos, g.STATIC_DRAW);

		// One LINE_STRIP over all rows then all cols, split by the fixed restart index
		// (WebGL2 always enables PRIMITIVE_RESTART_FIXED_INDEX for UNSIGNED_INT).
		const RESTART = 0xffffffff;
		const idx: number[] = [];
		for (let i = 0; i < S; i++) {
			for (let j = 0; j < S; j++) idx.push(i * S + j);
			idx.push(RESTART);
		}
		for (let j = 0; j < S; j++) {
			for (let i = 0; i < S; i++) idx.push(i * S + j);
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
		// aAlpha (loc 1) stays a disabled array -> generic value below.

		// Dynamic climber lines + heads: interleaved x,y,z,alpha (16-byte stride).
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
		headBuf = g.createBuffer()!;
		glBuffers.push(headBuf);
		g.bindBuffer(g.ARRAY_BUFFER, headBuf);
		g.bufferData(g.ARRAY_BUFFER, headData.byteLength, g.DYNAMIC_DRAW);
		vaoHeads = dynVAO(headBuf);

		g.bindVertexArray(null);
		g.vertexAttrib1f(1, 1.0); // generic aAlpha for the mesh pass
		g.enable(g.BLEND);
		g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
		bg = pageBg();
		g.clearColor(bg[0], bg[1], bg[2], 1);
	}

	function resize() {
		if (!gl) return;
		// Compositing this layer costs ~pixels² in DPR; a subtle wireframe doesn't need
		// full retina, so cap below 2. Drop to 1 if the GPU process is still busy.
		dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const cw = canvas.clientWidth;
		const ch = canvas.clientHeight;
		canvas.width = Math.round(cw * dpr);
		canvas.height = Math.round(ch * dpr);
		gl.viewport(0, 0, canvas.width, canvas.height);
		const scale = Math.min(cw / W, ch / H);
		view = { scale, ox: (cw - W * scale) / 2, oy: (ch - H * scale) / 2, cw, ch };
		if (!running) draw();
	}

	function draw() {
		const g = gl;
		if (!g) return;
		const { scale, ox, oy, cw, ch } = view;
		g.clear(g.COLOR_BUFFER_BIT);
		g.useProgram(prog);
		g.uniform2f(u.uRot, Math.cos(angle), Math.sin(angle));
		g.uniform2f(u.uTilt, cb, sb);
		g.uniform1f(u.uFit, scale);
		g.uniform2f(u.uOff, ox, oy);
		g.uniform2f(u.uCanvas, cw, ch);

		// Mesh — one draw call.
		const mesh = isDark ? MESH_DARK : MESH_LIGHT;
		g.bindVertexArray(vaoMesh);
		g.uniform1i(u.uMode, 0);
		g.uniform3f(u.uColor, mesh[0], mesh[1], mesh[2]);
		g.drawElements(g.LINE_STRIP, meshIdxCount, g.UNSIGNED_INT, 0);

		if (!trials.length) return;

		// Build climber geometry (world space + per-vertex alpha) into the scratch buffers.
		let vCount = 0;
		let hCount = 0;
		const draws: { first: number; count: number }[] = [];
		for (const tr of trials) {
			const pts = tr.pts;
			const hi = Math.min(Math.floor(tr.head), pts.length - 1);
			const f = tr.head - hi;
			const p = pts[hi];
			const q = pts[Math.min(hi + 1, pts.length - 1)];
			const head = { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, z: p.z + (q.z - p.z) * f };
			const wl: V[] = [];
			for (let k = 0; k <= hi; k++) wl.push(pts[k]);
			wl.push(head);

			const alpha = tr.done > 0 ? Math.max(0, 1 - tr.done / LINGER) : 1;
			let shown = wl;
			if (tr.done > 0) {
				// Retract the tail into the head so the comet collapses onto the dot.
				const startF = (wl.length - 1) * (1 - alpha);
				const lo = Math.floor(startF);
				const fr = startF - lo;
				const a = wl[lo];
				const b = wl[Math.min(lo + 1, wl.length - 1)];
				shown = [
					{ x: a.x + (b.x - a.x) * fr, y: a.y + (b.y - a.y) * fr, z: a.z + (b.z - a.z) * fr },
					...wl.slice(lo + 1)
				];
			}

			if (shown.length >= 2 && vCount + shown.length <= MAX_CLIMB_VERTS) {
				draws.push({ first: vCount, count: shown.length });
				for (let m = 0; m < shown.length; m++) {
					const s = shown[m];
					const off = vCount * 4;
					lineData[off] = s.x;
					lineData[off + 1] = s.y;
					lineData[off + 2] = s.z;
					// Solid along its whole length while climbing: no head-relative
					// gradient, or the trail would visibly dim behind the moving dot.
					// The whole trail fades together (via `alpha`) only once the head
					// reaches the mode; the glowing head point supplies the comet tip.
					lineData[off + 3] = alpha;
					vCount++;
				}
			}
			if (hCount < MAX_TRIALS) {
				const off = hCount * 4;
				headData[off] = head.x;
				headData[off + 1] = head.y;
				headData[off + 2] = head.z;
				headData[off + 3] = alpha;
				hCount++;
			}
		}

		g.uniform3f(u.uColor, AMBER[0], AMBER[1], AMBER[2]);

		if (vCount) {
			g.bindVertexArray(vaoLines);
			g.bindBuffer(g.ARRAY_BUFFER, lineBuf);
			g.bufferSubData(g.ARRAY_BUFFER, 0, lineData, 0, vCount * 4);
			g.uniform1i(u.uMode, 1);
			for (const d of draws) g.drawArrays(g.LINE_STRIP, d.first, d.count);
		}
		if (hCount) {
			g.bindVertexArray(vaoHeads);
			g.bindBuffer(g.ARRAY_BUFFER, headBuf);
			g.bufferSubData(g.ARRAY_BUFFER, 0, headData, 0, hCount * 4);
			g.uniform1i(u.uMode, 2);
			g.uniform1f(u.uPoint, 13 * scale * dpr);
			g.drawArrays(g.POINTS, 0, hCount);
		}
	}

	// --- lifecycle -----------------------------------------------------------------

	$effect(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

		let raf = 0;
		let last = 0;
		let acc = 0; // time since the last present, for the idle cap
		let inView = false;
		let nextSpawn = 1.3; // first climber lands soon after load — the hint

		const step = (t: number) => {
			const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
			last = t;

			if (!dragging) {
				angle = (angle + dt * vel) % TAU;
				vel += (SPEED - vel) * Math.min(1, dt / EASE_TAU);
			}
			for (const tr of trials) {
				if (tr.head < tr.pts.length - 1)
					tr.head = Math.min(tr.pts.length - 1, tr.head + dt * tr.speed);
				else tr.done += dt;
			}
			if (trials.some((tr) => tr.done >= LINGER)) trials = trials.filter((tr) => tr.done < LINGER);

			nextSpawn -= dt;
			if (nextSpawn <= 0) {
				spawn();
				nextSpawn = 6 + Math.random() * 4;
			}

			// Skipping draw() leaves the framebuffer untouched, so no present happens —
			// the simulation above is dt-based and unaffected by the lower draw rate.
			acc += dt;
			if (dragging || Math.abs(vel - SPEED) > FAST_VEL || acc >= IDLE_FRAME) {
				draw();
				acc = 0;
			}
			raf = requestAnimationFrame(step);
		};
		const start = () => {
			if (gl && !raf && !reduce.matches && !document.hidden) {
				running = true;
				last = 0;
				raf = requestAnimationFrame(step);
			}
		};
		const stop = () => {
			running = false;
			cancelAnimationFrame(raf);
			raf = 0;
		};

		// GL init is deferred to the first intersection: below the layout breakpoint
		// the hero is display:none, so phones would otherwise pay context creation and
		// shader compilation for an element that never paints. 'low-power' keeps a
		// decoration from waking the discrete GPU on dual-GPU machines.
		const init = () => {
			gl = canvas.getContext('webgl2', {
				alpha: true,
				antialias: true,
				powerPreference: 'low-power'
			});
			if (!gl) return; // no WebGL2 -> empty decorative panel
			try {
				setupGL(gl);
			} catch (err) {
				console.error('HeroGaussianMesh: WebGL setup failed', err);
				gl = null;
				return;
			}
			isDark = document.documentElement.getAttribute('data-theme') === 'dark';
			resize(); // sizes the drawing buffer and draws the first frame
		};
		const onReducedMotionChange = () => {
			if (reduce.matches) stop();
			else if (inView) start();
			if (!running) draw();
		};
		reduce.addEventListener('change', onReducedMotionChange);
		const onVisibilityChange = () => {
			if (document.hidden) stop();
			else if (inView) start();
		};
		document.addEventListener('visibilitychange', onVisibilityChange);

		// Pause the loop while scrolled past — no draw calls, no GPU work.
		const io = new IntersectionObserver(([e]) => {
			inView = e.isIntersecting;
			if (inView) {
				if (!gl) init();
				start();
			} else stop();
		});
		io.observe(canvas);

		const ro = new ResizeObserver(() => resize());
		ro.observe(canvas);

		const themeObs = new MutationObserver(() => {
			isDark = document.documentElement.getAttribute('data-theme') === 'dark';
			if (!gl) return; // pre-init: setupGL reads the current theme via pageBg()
			bg = pageBg();
			gl.clearColor(bg[0], bg[1], bg[2], 1);
			if (!running) draw();
		});
		themeObs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});

		// Browsers can evict the context (GPU pressure, mobile backgrounding); without
		// this the panel would stay blank while the loop kept drawing into a dead one.
		const onLost = (e: Event) => {
			e.preventDefault(); // signal we handle restoration
			stop();
		};
		const onRestored = () => {
			if (!gl) return;
			try {
				setupGL(gl); // old handles died with the context; rebuild everything
			} catch (err) {
				console.error('HeroGaussianMesh: WebGL setup failed', err);
				gl = null;
				return;
			}
			resize(); // also redraws the static frame when the loop stays stopped
			if (inView) start();
		};
		canvas.addEventListener('webglcontextlost', onLost);
		canvas.addEventListener('webglcontextrestored', onRestored);

		return () => {
			stop();
			io.disconnect();
			ro.disconnect();
			themeObs.disconnect();
			reduce.removeEventListener('change', onReducedMotionChange);
			document.removeEventListener('visibilitychange', onVisibilityChange);
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

	// --- pointer -------------------------------------------------------------------

	function worldFromClient(clientX: number, clientY: number) {
		const rect = canvas.getBoundingClientRect();
		const sx = (clientX - rect.left - view.ox) / view.scale; // -> virtual space
		const sy = (clientY - rect.top - view.oy) / view.scale;
		const ca = Math.cos(angle);
		const sa = Math.sin(angle);
		const x1 = (sx - CX) / SCALE;
		let y1 = (CY - sy) / (SCALE * cb); // z = 0 first guess
		let x = x1 * ca + y1 * sa;
		let y = -x1 * sa + y1 * ca;
		for (let i = 0; i < 2; i++) {
			const z = dens(x, y) * Z_HEIGHT; // refine for the surface height under the cursor
			y1 = ((CY - sy) / SCALE - z * sb) / cb;
			x = x1 * ca + y1 * sa;
			y = -x1 * sa + y1 * ca;
		}
		return { x, y };
	}

	let downX = 0;
	let downY = 0;
	let lastX = 0;
	let lastPT = 0;
	let moved = 0;

	function onPointerDown(e: PointerEvent) {
		downX = lastX = e.clientX;
		downY = e.clientY;
		lastPT = e.timeStamp;
		moved = 0;
		flingVel = 0;
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (e.buttons === 0) return; // only while pressed
		const dx = e.clientX - lastX;
		moved += Math.abs(dx);
		if (moved > CLICK_SLOP) dragging = true;
		if (dragging) {
			const dA = -dx * DRAG_SENS;
			angle = (((angle + dA) % TAU) + TAU) % TAU;
			const dt = (e.timeStamp - lastPT) / 1000;
			if (dt > 0) flingVel = Math.max(-FLING_MAX, Math.min(FLING_MAX, dA / dt));
			if (!running) draw(); // reduced-motion: reflect the manual spin
		}
		lastX = e.clientX;
		lastPT = e.timeStamp;
	}

	function onPointerEnd(e: PointerEvent) {
		(e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
		if (Math.hypot(e.clientX - downX, e.clientY - downY) < CLICK_SLOP) {
			spawn(worldFromClient(e.clientX, e.clientY)); // launch where clicked
		} else if (dragging) {
			vel = flingVel; // hand off drag momentum; the loop eases it back to SPEED
		}
		dragging = false;
	}
</script>

<div
	class="screen {klass}"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerEnd}
	onpointercancel={onPointerEnd}
	role="presentation"
>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
	.screen {
		position: relative;
		width: 100%;
		height: 100%;
		background: none;
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 6px;
		/* No `overflow: hidden`: a rounded clip on the per-frame-animating canvas costs
		   ~10 points of Firefox GPU-process CPU (A/B in about:processes: 37% with the
		   clip, 27% without) — the mask forces an intermediate surface the compositor
		   recomposites every frame. The canvas clears to page bg, so its square corners
		   are invisible against the paper; the rounded border still reads as the frame. */
		cursor: grab;
		/* Rotate only reads horizontal movement, so vertical swipes must keep
		   scrolling the page — the hero is a big touch target on tablets. */
		touch-action: pan-y;
		user-select: none;
	}
	.screen:active {
		cursor: grabbing;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
