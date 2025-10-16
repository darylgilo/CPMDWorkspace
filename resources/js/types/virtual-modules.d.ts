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
  const mod: any;
  export = mod;
  export default mod;
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
