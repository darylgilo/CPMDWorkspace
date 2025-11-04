// Ambient module declarations to satisfy TypeScript for virtual modules
// provided at runtime by Wayfinder or backend code generators.

type RouteParams = Record<string, string | number | boolean>;
type RouteQuery = Record<string, string | number | boolean | (string | number | boolean)[]>;

interface RouteOptions {
    absolute?: boolean;
    preserveState?: boolean;
    preserveScroll?: boolean;
    replace?: boolean;
    data?: RouteParams;
    query?: RouteQuery;
    [key: string]: unknown;
}

type RouteFunction = (params?: RouteParams, options?: RouteOptions) => string;

// Route modules
declare module '@routes' {
    const mod: Record<string, RouteFunction>;
    export = mod;
}

declare module '@routes/*' {
    const mod: Record<string, RouteFunction>;
    export = mod;
}

// Application routes
declare module '@/routes' {
    const mod: Record<string, RouteFunction>;
    export = mod;
    export default mod;

    // Common route helpers
    export const dashboard: RouteFunction;
    export const home: RouteFunction;
    export const login: RouteFunction;
    export const register: RouteFunction;
    export const logout: RouteFunction;
    export const profile: RouteFunction & {
        edit: RouteFunction;
        update: RouteFunction;
    };
}

declare module '@/routes/*' {
    const mod: Record<string, RouteFunction>;
    export = mod;
    export default mod;
}

// Action modules
declare module '@/actions/*' {
    const mod: {
        [key: string]: <T = unknown>(...args: unknown[]) => Promise<T>;
    };
    export = mod;
    export default typeof mod;
}
