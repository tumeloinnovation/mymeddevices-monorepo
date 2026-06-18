import '@testing-library/jest-dom';

if (typeof window !== 'undefined') {
  // JSDom environment
  if (!window.localStorage) {
    const store: Record<string, string> = {};
    window.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(key => delete store[key]); },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
    };
  }
  global.localStorage = window.localStorage;
} else {
  // Node fallback
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}
