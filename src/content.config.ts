import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const samples = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/samples" }),
  schema: z.object({
    title: z.string(),
    business: z.string(),
    budget: z.number(),
    hours: z.number(),
    channels: z.array(z.string()),
    date: z.coerce.date(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    keywords: z.array(z.string()).min(3).max(5),
  }),
});

export const collections = { samples, blog };
