import {z, defineCollection, reference} from "astro:content";
import {githubLoader} from "./GithubLoader.ts";

export const collections = {
    entries: defineCollection({
        loader: githubLoader('iokode/blog-dev', 'entries'),
        schema: z.object({
            title: z.string(),
            body: z.string(),
            slug: z.string(),
            license: z.string(), // todo reference to licenses collection
            author: z.string(), // GitHub username
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number() // GitHub discussion ID for comments
        }),
    }),
    essentials: defineCollection({
        loader: githubLoader('iokode/blog-dev', 'essentials'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
        }),
    }),
    licenses: defineCollection({
        loader: githubLoader('iokode/blog-dev', 'licenses'),
        schema: z.object({
            name: z.string(),
            code: z.string(),
        }),
    }),
    spanishLegacyEntries: defineCollection({
        loader: githubLoader('iokode/blog-dev', 'spanish-legacy-entries'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number()
        }),
    })
}