// Ambient module declarations to satisfy TypeScript for virtual modules
// provided at runtime by Wayfinder or backend code generators.

declare module '@routes' {
    const mod: any;
    export = mod;
}

declare module '@routes/*' {
    const mod: any;
    export = mod;
}

declare module '@/routes' {
    // Default export remains a catch-all for runtime-provided helpers
    const mod: any;
    export = mod;
    export default mod;

    // Common named helpers used throughout the app; types kept broad to avoid drift
    export function dashboard(...args: any[]): any;
    export function home(...args: any[]): any;
    export function login(...args: any[]): any;
    export function register(...args: any[]): any;
    export function logout(...args: any[]): any;
}

declare module '@/routes/*' {
    const mod: any;
    export = mod;
    export default mod;
}

declare module '@/actions/*' {
    const mod: any;
    export = mod;
    export default mod;
}
