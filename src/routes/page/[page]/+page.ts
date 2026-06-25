import { error } from "@sveltejs/kit";
import { pageCount } from "$lib/content";
import type { EntryGenerator, PageLoad } from "./$types";

export const prerender = true;

// Page 1 lives at "/", so this route covers pages 2..N.
export const entries: EntryGenerator = () =>
  Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
    page: String(i + 2)
  }));

export const load: PageLoad = ({ params }) => {
  const page = Number(params.page);
  if (!Number.isInteger(page) || page < 2 || page > pageCount) {
    error(404, "Page not found");
  }
  return { page };
};
