import type {Loader, LoaderContext} from "astro/loaders";
import {
    existsUser,
    fetchFileContent,
    fetchRepoTree,
    getGithubRealnameFromUserName,
    getKeyValueList
} from "../helpers/github.ts";
import matter from "gray-matter";

export function entriesGitHubLoader(repository: string, branch: string, directory: string): Loader {
    return {
        name: 'github-entries-loader',
        load: async (context: LoaderContext): Promise<void> => {
            const regex = new RegExp(`^${directory}/[^/]+/entry\.mdx?$`);
            await loadFilesWithRegex(repository, branch, regex, context);
        }
    };
}

export function simpleGitHubLoader(repository: string, branch: string, directory: string): Loader {
    return {
        name: 'github-simple-loader',
        load: async (context: LoaderContext): Promise<void> => {
            const regex = new RegExp(`^${directory}/[^/]+\.mdx?$`);
            await loadSimpleFilesWithRegex(repository, branch, directory, regex, context);
        }
    };
}

export function kvpGitHubLoader(repository: string, branch: string, file: string, idKey: string, valueKey: string): Loader {
    return {
        name: 'github-kvp-loader',
        load: async (context: LoaderContext): Promise<void> => {
            let kvp = await getKeyValueList(repository, branch, file);

            let toStore = Object.entries(kvp).map(([key, value]) => ({
                id: key,
                data: {
                    [idKey]: key,
                    [valueKey]: value,
                }
            }));

            toStore.forEach(entry => context.store.set(entry));
        }
    };
}

async function loadFilesWithRegex(repository: string, branch: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository, branch);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    for (const file of entryFiles) {
        const rawContent = await fetchFileContent(repository, branch, file.path);
        const {data, content} = matter(rawContent);
        const id = file.path.replace('/entry.mdx', '').replace('entry.md', '')

        if (!await existsUser(data.author)) {
            data.author = "ghost";
            data.authorName = "Deleted user";
        }
        else if (data.author !== undefined) {
            data.authorName = await getGithubRealnameFromUserName(data.author);
        }

        context.store.set({
            id: id,
            body: content,
            data: data
        });
    }
}

async function loadSimpleFilesWithRegex(repository: string, branch: string, directory: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository, branch);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    for (const file of entryFiles) {
        const rawContent = await fetchFileContent(repository, branch, file.path);
        const {data, content} = matter(rawContent);
        const id = file.path.replace('.mdx', '').replace('.md', '').replace('/entry.mdx', '').replace(`${directory}/`, '')

        context.store.set({
            id: id,
            body: content,
            data: data
        });
    }
}