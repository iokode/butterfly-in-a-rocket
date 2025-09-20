import {z, defineCollection} from "astro:content";
import {entriesGitHubLoader, kvpGitHubLoader, simpleGitHubLoader} from "./EntriesGitHubLoader.ts";
import {isDevelopment} from "../helpers/environment.ts";

const repository: string = isDevelopment() ? 'iokode/blog-dev' : 'iokode/blog';

export const defaultLicense = {
    code: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/deed.en',
}

export const collections = {
    posts: defineCollection({
        loader: entriesGitHubLoader(repository, 'posts'),
        schema: z.object({
            title: z.string(),
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

    pages: defineCollection({
        loader: simpleGitHubLoader(repository, 'pages'),
        schema: z.object({
            title: z.string(),
            slug: z.string(),
        }),
    }),

    licenses: defineCollection({
        loader: kvpGitHubLoader(repository, 'licenses.json', 'code', 'url'),
        schema: z.object({
            code: z.string(),
            url: z.string().url(),
        }),
    }),

    recommendedSites: defineCollection({
        loader: kvpGitHubLoader(repository, 'recommended-sites.json', 'name', 'url'),
        schema: z.object({
            name: z.string(),
            url: z.string().url()
        })
    }),

    tags: defineCollection({
        loader: simpleGitHubLoader(repository, 'tags'),
        schema: z.object({
            name: z.string(),
            description: z.string(),
        }),
    }),

    authors: defineCollection({
        loader: simpleGitHubLoader(repository, 'authors')
    })
}