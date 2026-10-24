import { defineChangelog } from '../core/changelog';
import raw from './changelog.json';

/** Canonical instance: the cite block and /correlation/changelog both read this. */
export const changelog = defineChangelog('correlation', raw);
