// CSV in/out for the correlation app (old saveCsv.js + CsvLoad.js, d3-dsv for
// parsing as before). Shared by the toolbar download menu and the settings
// drawer's Download/Load buttons.

import { csvParse } from 'd3-dsv';
import { downloadBlob } from '../core/util/svgExport';
import { toCsv, type Point } from './model';

export function downloadCsv(data: Point[], xLabel: string, yLabel: string) {
	const blob = new Blob([toCsv(data, xLabel, yLabel)], { type: 'text/csv;charset=utf-8' });
	downloadBlob(blob, 'rpsychologist-correlation.csv');
}

export interface ParsedCsv {
	points: Point[];
	xLabel: string;
	yLabel: string;
}

/**
 * First column = x, second = y, header row becomes the axis labels; all other
 * columns are ignored (documented old behavior). Non-numeric rows are dropped
 * (the old app let them through as NaN and broke the chart); null when fewer
 * than 2 usable rows remain so the caller can show an error instead.
 */
export function parseCsvPoints(text: string): ParsedCsv | null {
	const rows = csvParse(text);
	const [xCol, yCol] = rows.columns;
	if (xCol === undefined || yCol === undefined) return null;
	const points: Point[] = [];
	for (const row of rows) {
		const x = Number(row[xCol]);
		const y = Number(row[yCol]);
		if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y]);
	}
	if (points.length < 2) return null;
	return { points, xLabel: xCol, yLabel: yCol };
}
