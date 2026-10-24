<script lang="ts">
	import { cohendPath, getCohendI18n } from './i18n';

	// Shown at the foot of the `/cohend/embed` route so an embedded copy still
	// credits the source (the old app's <EmbedAttribution>).
	const { locale, m } = getCohendI18n();
	// English keeps the trailing-slash form already in print.
	const path = locale === 'en' ? '/cohend/' : cohendPath(locale);
</script>

<p class="attribution">
	{m.created_by}
	<a href="https://rpsychologist.com/" target="_blank" rel="noopener">Kristoffer Magnusson</a>
	·
	<a href="https://rpsychologist.com{path}" target="_blank" rel="noopener"
		>rpsychologist.com{path.replace(/\/$/, '')}</a
	>
</p>

<style>
	.attribution {
		margin-top: 1rem;
		text-align: right;
		font-size: 0.85rem;
		color: var(--muted);
	}
	.attribution a {
		color: var(--ink);
		text-decoration: underline;
		text-decoration-color: var(--link-underline-quiet);
		text-decoration-thickness: 1px;
		text-underline-offset: var(--link-offset);
	}
	.attribution a:hover {
		color: var(--accent);
		text-decoration-color: var(--accent);
	}
</style>
