export function paginate<T>(items: T[], page: number = 1, perPage: number = 10): T[] {
  const offset = (page - 1) * perPage;
  return items.slice(offset, offset + perPage);
}
