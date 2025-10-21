// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";

// 2. Import loader(s)
import { glob } from "astro/loaders";

// 3. Define your collection(s)
const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		abstract: z.string(),
		systems: z.array(z.string()),
		technologies: z.array(z.string()),
		tease: z.string(),
	}),
});

const decks = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/deck" }),
	schema: z.object({
		title: z.string(),
	}),
});

// 4. Export a single `collections` object to register your collection(s)
export const collections = { posts, projects, decks };
