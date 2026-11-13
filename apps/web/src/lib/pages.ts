export type PageSlice<T> = { items: T[]; page: number; pageCount: number };

export function pageOf<T>(items: readonly T[], perPage: number, page: number): PageSlice<T> {
  const size = Math.max(1, Math.floor(perPage));
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(pageCount - 1, Math.max(0, Math.floor(page)));
  return { items: items.slice(current * size, current * size + size), page: current, pageCount };
}
