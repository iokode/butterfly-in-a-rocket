import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import svelte from "@astrojs/svelte";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: "https://iokode.blog",
    integrations: [mdx(), svelte(), sitemap()],
    image: {
        domains: ['github.com', 'avatars.githubusercontent.com', 'iokode.blog']
    }
});