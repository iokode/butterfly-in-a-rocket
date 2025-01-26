import type {Loader, LoaderContext} from "astro/loaders";
import {fetchFileContent, fetchRepoTree, getGithubRealnameFromUserName, getKeyValueList} from "../helpers/github.ts";
import matter from "gray-matter";

export function entriesGitHubLoader(repository: string, directory: string): Loader {
    return {
        name: 'github-entries-loader',
        load: async (context: LoaderContext): Promise<void> => {
            const regex = new RegExp(`^${directory}/[^/]+/entry\.mdx?$`);
            await loadFilesWithRegex(repository, regex, context);
        }
    };
}

export function simpleGitHubLoader(repository: string, directory: string): Loader {
    return {
        name: 'github-simple-loader',
        load: async (context: LoaderContext): Promise<void> => {
            const regex = new RegExp(`^${directory}/[^/]+\.mdx?$`);
            await loadSimpleFilesWithRegex(repository, directory, regex, context);
        }
    };
}

export function kvpGitHubLoader(repository: string, file: string, idKey: string, valueKey: string): Loader {
    return {
        name: 'github-kvp-loader',
        load: async (context: LoaderContext): Promise<void> => {
            let kvp =  await getKeyValueList(repository, file);

            let toStore = Object.entries(kvp).map(([key, value]) => ({
                id: key,
                data: {
                    [idKey]: key,
                    [valueKey]: value,
                }
            }));
            
            console.log("toStore:");
            console.log(toStore);

            toStore.forEach(entry => context.store.set(entry));
        }
    };
}

async function loadFilesWithRegex(repository: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    for (const file of entryFiles) {
        const rawContent = await fetchFileContent(repository, file.path);
        const {data, content} = matter(rawContent);
        const id = file.path.replace('/entry.mdx', '').replace('entry.md', '')
        data.body = content;

        if (data.author !== undefined) {
            data.authorName = await getGithubRealnameFromUserName(data.author);
        }

        context.store.set({
            id: id,
            body: content,
            data: data
        });
    }
}

async function loadSimpleFilesWithRegex(repository: string, directory: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    for (const file of entryFiles) {
        const rawContent = await fetchFileContent(repository, file.path);
        const {data, content} = matter(rawContent);
        const id = file.path.replace('.mdx', '').replace('.md', '').replace('/entry.mdx', '').replace(`${directory}/`, '')
        data.body = content;

        context.store.set({
            id: id,
            body: content,
            data: data
        });
    }
}