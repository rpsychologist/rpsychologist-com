/**
 * One type scale for every card's SVG text, in rendered pixels. The SVGs
 * scale to their box, so each card's viewBox font is the target size times
 * W / rendered width; without this, cards with different viewBox widths set
 * the same role at visibly different sizes.
 */
type Variant = 'desktop' | 'mobile';
type Role = 'label' | 'title';

/** Ticks and annotations (label); headings and axis titles (title). */
const PX: Record<Variant, Record<Role, number>> = {
	desktop: { label: 14, title: 15.5 },
	mobile: { label: 12.5, title: 13.5 }
};

/** A `.wide` card's chart width in the article: desktop from 1280px windows
 *  up, mobile in a 390px window. A chart capped by --fig-max-h passes its own. */
export const RENDERED_W: Record<Variant, number> = { desktop: 950, mobile: 340 };

export function svgFont(variant: Variant, W: number, role: Role, rendered = RENDERED_W[variant]) {
	return Math.round(((PX[variant][role] * W) / rendered) * 10) / 10;
}
