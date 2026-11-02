import { defineChangelog } from '../core/changelog';
import raw from './changelog.json';

/** Canonical instance: the essay's cite block and its changelog page both read this. */
export const changelog = defineChangelog('odds-ratio', raw);
