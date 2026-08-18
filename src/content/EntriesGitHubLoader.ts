import type {Loader, LoaderContext} from "astro/loaders";
import {
    existsUser,
    fetchFileContent,
    fetchRepoTree,
    getGithubRealnameFromUserName,
    getKeyValueList
} from "../helpers/github.ts";
import matter from "gray-matter";

/**
 * Entries are keyed by their path within the repository, so switching source (say, previewing the
 * production content in dev) would otherwise leave the previous repository's entries behind in the
 * cached store, blending both blogs into one.
 */
function discardStoreOnSourceChange(context: LoaderContext, repository: string, branch: string): void {
    const source = `${repository}#${branch}`;

    if (context.meta.get('source') !== source) {
        context.store.clear();
        context.meta.set('source', source);
    }
}

export function entriesGitHubLoader(repository: string, branch: string, directory: string): Loader {
    return {
        name: 'github-entries-loader',
        load: async (context: LoaderContext): Promise<void> => {
            discardStoreOnSourceChange(context, repository, branch);
            const regex = new RegExp(`^${directory}/[^/]+/entry\.mdx?$`);
            await loadFilesWithRegex(repository, branch, regex, context);
        }
    };
}

export function simpleGitHubLoader(repository: string, branch: string, directory: string): Loader {
    return {
        name: 'github-simple-loader',
        load: async (context: LoaderContext): Promise<void> => {
            discardStoreOnSourceChange(context, repository, branch);
            const regex = new RegExp(`^${directory}/[^/]+\.mdx?$`);
            await loadSimpleFilesWithRegex(repository, branch, directory, regex, context);
        }
    };
}

export function kvpGitHubLoader(repository: string, branch: string, file: string, idKey: string, valueKey: string): Loader {
    return {
        name: 'github-kvp-loader',
        load: async (context: LoaderContext): Promise<void> => {
            discardStoreOnSourceChange(context, repository, branch);
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

/**
 * One request per entry adds up: fetched in series a full sync takes tens of seconds, and Astro runs
 * it twice per build (`astro check`, then `astro build`). GitHub serves this many parallel requests
 * happily; going much wider starts costing more in refused streams than it saves.
 */
const CONCURRENCY = 8;

async function mapWithConcurrency<TItem, TResult>(
    items: TItem[],
    mapper: (item: TItem) => Promise<TResult>
): Promise<TResult[]> {
    const results: TResult[] = new Array(items.length);
    let next = 0;

    const workers = Array.from({length: Math.min(CONCURRENCY, items.length)}, async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await mapper(items[index]);
        }
    });

    await Promise.all(workers);

    return results;
}

async function loadFilesWithRegex(repository: string, branch: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository, branch);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    const entries = await mapWithConcurrency(entryFiles, async file => {
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

        return {
            id: id,
            body: content,
            data: data
        };
    });

    entries.forEach(entry => context.store.set(entry));
}

async function loadSimpleFilesWithRegex(repository: string, branch: string, directory: string, regex: RegExp, context: LoaderContext): Promise<void> {
    const tree = await fetchRepoTree(repository, branch);
    const entryFiles = tree.filter(file =>
        file.type === 'blob' && regex.test(file.path)
    );

    const entries = await mapWithConcurrency(entryFiles, async file => {
        const rawContent = await fetchFileContent(repository, branch, file.path);
        const {data, content} = matter(rawContent);
        const id = file.path.replace('.mdx', '').replace('.md', '').replace('/entry.mdx', '').replace(`${directory}/`, '')

        return {
            id: id,
            body: content,
            data: data
        };
    });

    entries.forEach(entry => context.store.set(entry));
}