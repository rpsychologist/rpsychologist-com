/**
 * APA sentence case for a Title Case title: capitalized words are lowercased
 * except the first word and the first after a colon. Acronyms and mixed-case
 * words (ANOVA, PowerLMM.js) are kept, but proper nouns can't be told apart
 * ("Cohen's"), so a title with one is passed to the citation explicitly.
 */
export function sentenceCase(title: string): string {
	let capitalize = true;
	return title
		.split(' ')
		.map((word) => {
			const first = capitalize;
			capitalize = word.endsWith(':');
			if (first) return word.charAt(0).toUpperCase() + word.slice(1);
			return word
				.split('-')
				.map((part) => (/^[A-Z][^A-Z]*$/.test(part) ? part.toLowerCase() : part))
				.join('-');
		})
		.join(' ');
}

/** A post's cited title: "Title: Subtitle", in sentence case. */
export function citationTitle(title: string, subtitle?: string): string {
	return sentenceCase(subtitle ? `${title}: ${subtitle}` : title);
}
