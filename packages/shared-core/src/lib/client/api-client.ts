/**
 * Client-side API Client
 * Used for calling Next.js API routes from Client Components
 * 
 * NOTE: For data fetching in Server Components, use the server utilities in @/lib/server/
 * NOTE: For mutations (actions), prefer Server Actions over API routes where possible.
 */

export const apiClient = {
    async get<T>(path: string): Promise<T> {
        const res = await fetch(path);
        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('Too many attempts. Please wait a moment before trying again.');
            }
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    async post<T>(path: string, data: any): Promise<T> {
        const res = await fetch(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('Too many attempts. Please wait a moment before trying again.');
            }
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    async put<T>(path: string, data: any): Promise<T> {
        const res = await fetch(path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('Too many attempts. Please wait a moment before trying again.');
            }
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    },

    async delete<T>(path: string): Promise<T> {
        const res = await fetch(path, {
            method: 'DELETE'
        });
        if (!res.ok) {
            if (res.status === 429) {
                throw new Error('Too many attempts. Please wait a moment before trying again.');
            }
            const error = await res.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        return res.json();
    }
};
