const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

/** "March 20, 2012" */
export function formatDate(date: Date): string {
  return formatter.format(date);
}

/** ISO 8601, for <time datetime> and structured data. */
export function isoDate(date: Date): string {
  return date.toISOString();
}
