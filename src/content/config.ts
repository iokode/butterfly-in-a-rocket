import {z, defineCollection} from "astro:content";
import {entriesGitHubLoader, kvpGitHubLoader, simpleGitHubLoader} from "./EntriesGitHubLoader.ts";

export const repository = 'iokode/blog-dev';
export const defaultLicense = {
    code: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/deed.en',
}

export const collections = {
    posts: defineCollection({
        loader: entriesGitHubLoader(repository, 'posts'),
        schema: z.object({
            title: z.string(),
            body: z.string(),
            slug: z.string(),
            license: z.string(), // license code in 'licenses' collection
            author: z.string(), // GitHub username
            authorName: z.string(),
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
        loader: kvpGitHubLoader(repository, 'licenses.json', 'code', 'url'),
        schema: z.object({
            code: z.string(),
            url: z.string().url(),
        }),
    }),
    partners: defineCollection({
        loader: kvpGitHubLoader(repository, 'partners.json', 'name', 'url'),
        schema: z.object({
            name: z.string(),
            url: z.string().url()
        })
    }),
    spanishLegacyPosts: defineCollection({
        loader: entriesGitHubLoader(repository, 'spanish-legacy-posts'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number()
        }),
    })
}