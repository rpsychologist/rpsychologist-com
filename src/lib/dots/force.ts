// Force-directed cluster layouts, computed synchronously so every layout state
// is a pure function of (nodes, geometry, seed). The prerendered HTML and the
// hydrated page then agree to the pixel, and a state never depends on the order
// a reader clicked through earlier ones. Transitions between states are CSS.

import { forceCollide, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import { mulberry32 } from '#lib/stats/sample.js';
import { hexDisc, type Pt } from './grid';

export interface ClusterNode {
	cluster: string;
	/** Lower keys start on the left of their cluster (e.g. events before non-events). */
	order?: number;
}

export interface ClusterOptions {
	r: number;
	pad?: number;
	ticks?: number;
	seed?: number;
	/** Extra pull toward the cluster center; higher packs tighter. */
	strength?: number;
	bounds?: { x0: number; y0: number; x1: number; y1: number };
}

type SimNode = SimulationNodeDatum & { tx: number; ty: number };

export function clusterLayout(
	nodes: ClusterNode[],
	centers: Record<string, Pt>,
	{ r, pad = 1, ticks = 16, seed = 1, strength = 0.04, bounds }: ClusterOptions
): Pt[] {
	const spacing = 2 * r + pad;
	const rand = mulberry32(seed);
	const sim: SimNode[] = nodes.map(() => ({ x: 0, y: 0, tx: 0, ty: 0 }));

	// Seed each cluster as a hex disc with a little seeded jitter, so the force
	// pass relaxes into an organic packing instead of starting from d3's spiral.
	const byCluster = new Map<string, number[]>();
	nodes.forEach((n, i) => {
		const list = byCluster.get(n.cluster) ?? [];
		list.push(i);
		byCluster.set(n.cluster, list);
	});
	for (const [key, idx] of byCluster) {
		const c = centers[key];
		idx.sort((a, b) => (nodes[a].order ?? 0) - (nodes[b].order ?? 0) || a - b);
		const pts = hexDisc(idx.length, c, spacing);
		idx.forEach((i, k) => {
			sim[i].x = pts[k].x + (rand() - 0.5) * r * 0.6;
			sim[i].y = pts[k].y + (rand() - 0.5) * r * 0.6;
			sim[i].tx = c.x;
			sim[i].ty = c.y;
		});
	}

	forceSimulation(sim)
		.randomSource(rand)
		.force('x', forceX<SimNode>((d) => d.tx).strength(strength))
		.force('y', forceY<SimNode>((d) => d.ty).strength(strength))
		.force('collide', forceCollide<SimNode>(r + pad / 2).iterations(2))
		.stop()
		.tick(ticks);

	return sim.map((d) => {
		let x = d.x ?? 0;
		let y = d.y ?? 0;
		if (bounds) {
			x = Math.min(bounds.x1 - r, Math.max(bounds.x0 + r, x));
			y = Math.min(bounds.y1 - r, Math.max(bounds.y0 + r, y));
		}
		return { x, y };
	});
}
