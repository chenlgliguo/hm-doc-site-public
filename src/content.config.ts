import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const documents = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/documents",
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    section: z.string(),
    topic: z.string(),
    audience: z.string(),
    version: z.string(),
    summary: z.string(),
    sourceFile: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = {
  documents,
};
