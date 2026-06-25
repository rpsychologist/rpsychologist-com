// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

// mdsvex documents imported as Svelte components.
declare module "*.svx" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}

export {};
