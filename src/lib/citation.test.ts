import { describe, it, expect } from 'vitest';
import { citationTitle, sentenceCase } from '#lib/citation.js';

describe('citationTitle', () => {
	it('joins title and subtitle in APA sentence case', () => {
		expect(
			citationTitle('Understanding Odds Ratios and Risk Ratios', 'An Interactive Explanation')
		).toBe('Understanding odds ratios and risk ratios: An interactive explanation');
		// The form the viz apps already cite by hand.
		expect(
			citationTitle('Understanding Maximum Likelihood Estimation', 'An Interactive Visualization')
		).toBe('Understanding maximum likelihood estimation: An interactive visualization');
	});

	it('cites the title alone when there is no subtitle', () => {
		expect(
			citationTitle('Why Adjusted Regression Coefficients Are Less Descriptive Than They Look')
		).toBe('Why adjusted regression coefficients are less descriptive than they look');
	});
});

describe('sentenceCase', () => {
	it('keeps acronyms and mixed-case names', () => {
		expect(sentenceCase('Introducing PowerLMM.js and ANOVA Tables')).toBe(
			'Introducing PowerLMM.js and ANOVA tables'
		);
	});

	it('lowercases each part of a hyphenated word', () => {
		expect(sentenceCase('Equivalence, Non-Inferiority and Superiority Testing')).toBe(
			'Equivalence, non-inferiority and superiority testing'
		);
	});
});
