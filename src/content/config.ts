import {z, defineCollection, reference} from "astro:content";
import matter from "gray-matter";
import {fetchFileContent, fetchRepoTree } from "../helpers/github";

export const collections = {
    entries: defineCollection({
        loader: async () => {
            const entries = [];
            const tree = await fetchRepoTree();

            const entryFiles = tree.filter(file =>
                file.type === 'blob' && /^entries\/[^/]+\/entry\.mdx?$/.test(file.path)
            );

            for (const file of entryFiles) {
                const rawContent = await fetchFileContent(file.path);
                const {data: frontmatter, content} = matter(rawContent);

                entries.push({
                    id: file.path.replace('/entry.mdx', '').replace('entry.md', ''),
                    ...frontmatter,
                    rendered: content,
                });
            }

            return entries;
        },
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            license: z.string(), // todo reference to licenses collection
            author: z.string(), // GitHub username
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number() // GitHub discussion ID for comments
        }),
    }),
    essentials: defineCollection({
        schema: z.object({
            title: z.string(),
            slug: z.string(),
        }),
    }),
    licenses: defineCollection({
        schema: z.object({
            name: z.string(),
            code: z.string(),
        }),
    }),
    spanishLegacyEntries: defineCollection({
        schema: z.object({
            title: z.string(),
            slug: z.string(),
            publishDate: z.date(),
            tags: z.array(z.string()),
            discussionId: z.number()
        }),
    })
}