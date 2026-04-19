// @ts-check
import { access, copyFile } from "node:fs/promises";
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

import tailwindcss from "@tailwindcss/vite";

const publishSitemapXml = () => ({
  name: "publish-sitemap-xml",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const generatedSitemap = new URL("sitemap-0.xml", dir);
      const canonicalSitemap = new URL("sitemap.xml", dir);

      try {
        await access(generatedSitemap);
        await copyFile(generatedSitemap, canonicalSitemap);
      } catch {
        logger.warn("Could not publish /sitemap.xml from sitemap-0.xml");
      }
    },
  },
});

// https://astro.build/config
export default defineConfig({
  site: "https://acuriousmind.com",
  integrations: [
    mdx(),
    react(),
    sitemap({
      entryLimit: 50000,
      filter: (page) => !page.endsWith("/old/") && !page.endsWith("/404/"),
    }),
    publishSitemapXml(),
  ],

  server: {
    port: parseInt(process.env.PORT || "3000"),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
