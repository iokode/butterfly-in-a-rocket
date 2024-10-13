import type {Loader, LoaderContext} from "astro/loaders";
import {fetchFileContent, fetchRepoTree} from "../helpers/github.ts";
import matter from "gray-matter";

export function githubLoader(repository: string, directory: string): Loader {
    return {
        name: 'github-loader',
        load: async (context: LoaderContext): Promise<void> => {
            const tree = await fetchRepoTree();
            const entryFiles = tree.filter(file =>
                file.type === 'blob' && /^entries\/[^/]+\/entry\.mdx?$/.test(file.path)
            );

            for (const file of entryFiles) {
                const rawContent = await fetchFileContent(file.path);
                const {data, content} = matter(rawContent);
                const id = file.path.replace('/entry.mdx', '').replace('entry.md', '')
                data.body = content;

                context.store.set({
                    id: id,
                    body: content,
                    data: data
                });
            }
        }
    };
}