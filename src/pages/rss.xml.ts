import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");
  return rss({
    title: "Kampa blog",
    description:
      "Marketing notes for small businesses running on a real budget: what the money buys, what the AI costs, which channels are worth the hours.",
    // context.site is the `site` config without `base`, so fold BASE_URL back in.
    site: new URL(import.meta.env.BASE_URL, context.site),
    items: posts
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `${import.meta.env.BASE_URL}blog/${post.id}/`,
      })),
    customData: "<language>en</language>",
  });
}
