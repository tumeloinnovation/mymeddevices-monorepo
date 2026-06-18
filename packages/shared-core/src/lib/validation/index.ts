export * from './auth';
export * from './admin';
export * from './address';
export * from './catalog';

export const paginationSchema = {
  page: (defaultPage = 1) => ({ page: defaultPage, limit: 20 }),
  validate: (page: number, limit: number) => {
    const p = Math.max(1, page);
    const l = Math.max(1, Math.min(100, limit));
    return { page: p, limit: l };
  },
};
