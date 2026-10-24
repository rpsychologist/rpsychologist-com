// Pinned zone: without it the prerender (UTC) and the reader's browser could
// show different days for the same post, and hydration would change the text.
// Matches POST_TIME_ZONE in vite-plugin-posts.js.
const formatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Europe/Stockholm',
	year: 'numeric',
	month: 'short',
	day: 'numeric'
});

/** "Mar 20, 2012" */
export function formatDate(date: Date): string {
	return formatter.format(date);
}

/** ISO 8601, for <time datetime> and structured data. */
export function isoDate(date: Date): string {
	return date.toISOString();
}
