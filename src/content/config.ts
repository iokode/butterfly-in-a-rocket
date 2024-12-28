import {z, defineCollection, reference} from "astro:content";
import {entriesGitHubLoader, simpleGitHubLoader} from "./EntriesGitHubLoader.ts";

const repository = 'iokode/blog-dev';

export const collections = {
    entries: defineCollection({
        loader: entriesGitHubLoader(repository, 'entries'),
        schema: z.object({
            title: z.string(),
            body: z.string(),
            slug: z.string(),
            license: z.string(), // todo reference to licenses collection
            author: z.string(), // GitHub username
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number().positive(), // GitHub discussion ID for comments
            series: z.string().optional(),
        }),
    }),
    essentials: defineCollection({
        loader: simpleGitHubLoader(repository, 'essentials'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            body: z.string(),
        }),
    }),
    licenses: defineCollection({
        loader: simpleGitHubLoader(repository, 'licenses'),
        schema: z.object({
            name: z.string(),
            code: z.string(),
        }),
    }),
    spanishLegacyEntries: defineCollection({
        loader: entriesGitHubLoader(repository, 'spanish-legacy-entries'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number()
        }),
    })
}