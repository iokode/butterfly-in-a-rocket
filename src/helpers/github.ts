import {getImage} from "astro:assets";
import type {GetImageResult} from "astro";
import {isDevelopment} from "./environment.ts";

/**
 * Every post asks for its author, and a blog has far fewer authors than posts. Keeping the in-flight
 * promise (rather than the resolved value) also collapses the concurrent lookups the loader fires.
 */
const userRequests = new Map<string, Promise<{ name: string | null } | null>>();

function fetchUser(username: string): Promise<{ name: string | null } | null> {
    let request = userRequests.get(username);

    if (request === undefined) {
        request = requestUser(username);
        userRequests.set(username, request);
    }

    return request;
}

/** Resolves to `null` when the account does not exist. */
async function requestUser(username: string): Promise<{ name: string | null } | null> {
    const response = await authenticatedFetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
        let json = await response.json();

        if (json.message) {
            if (json.message.includes('Not Found')) {
                return null;
            }

            throw new Error(`GitHub error: ${json.message}`);
        }

        throw new Error(`Unknown GitHub error: ${response.statusText}`);
    }

    return await response.json();
}

export async function getGithubRealnameFromUserName(username: string): Promise<string> {
    const user = await fetchUser(username);

    if (user === null) {
        return "Deleted user";
    }

    return user.name || username; // Return username if the name is not set
}

export async function existsUser(username: string): Promise<boolean> {
    return await fetchUser(username) !== null;
}

export async function getGithubAvatar(username: string): Promise<GetImageResult> {
    if (!await existsUser(username)) {
        return await getImage({
            src: `https://github.com/ghost.png?size=120`,
            formats: ['webp'],
            inferSize: true,
            quality: 'max',
        });
    }

    return await getImage({
        src: `https://github.com/${username}.png?size=120`,
        formats: ['webp'],
        inferSize: true,
        quality: 'max',
    });
}

export async function fetchRepoTree(repository: string, branch: string): Promise<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
}[]> {
    const response = await authenticatedFetch(`https://api.github.com/repos/${repository}/git/trees/${branch}?recursive=1`);
    if (!response.ok) {
        throw new Error(`Failed to fetch repository tree: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.tree; // Array of all files and directories in the repo
}

export async function fetchFileContent(repository: string, branch: string, filePath: string): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${repository}/${branch}/${filePath}`;
    const response = await authenticatedFetch(rawUrl);
    if (!response.ok) {
        // HTTP/2 sends no status text, so the code is all there is to report.
        throw new Error(`Failed to fetch file ${filePath}: ${response.status} ${response.statusText}`);
    }

    console.log(filePath);
    return await response.text();
}

export type Comment = {
    body: string;
    user: {
        realName: string;
        username: string;
        avatarUrl: string;
    };
    creationDate: Date;
    replies: Comment[];
    positiveReactions: number;
};

export async function getComments(discussionId: number): Promise<Comment[]> {
    let entryPoint: string;
    if (isDevelopment()) {
        entryPoint = "http://localhost:4322/comments";
    } else {
        entryPoint = "/comments";
    }

    const request = await fetch(`${entryPoint}?discussionId=${discussionId}`);

    if (request.status !== 200) {
        throw new Error(`Failed to fetch comments: ${request.statusText}`);
    }

    let json = await request.json();

    if (json.error) {
        throw new Error(json.error);
    }

    json = json.map((comment: Comment) => ({
        ...comment,
        creationDate: new Date(comment.creationDate),
        replies: comment.replies.map(reply => ({
            ...reply,
            creationDate: new Date(reply.creationDate)
        }))
    }));

    return json;
}

export async function getRawContent(repository: string, filePath: string): Promise<Buffer> {
    const url = `https://api.github.com/repos/${repository}/contents/${filePath}`;
    const response = await authenticatedFetch(url);
    if (!response.ok) {
        // HTTP/2 sends no status text, so the code is all there is to report.
        throw new Error(`Failed to fetch file ${filePath}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Buffer.from(data.content, 'base64');
}

export async function getKeyValueList(repository: string, branch: string, file: string): Promise<Record<string, string>> {
    let response = await authenticatedFetch(`https://raw.githubusercontent.com/${repository}/refs/heads/${branch}/${file}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch file ${file}: ${response.statusText}`);
    }

    return await response.json();
}

function authenticatedFetch(input: string | URL | globalThis.Request, init?: RequestInit) {
    let token: string | undefined = process.env.GH_TOKEN;

    if (token !== undefined) {
        if (init === undefined) {
            init = {};
        }

        if (init.headers === undefined) {
            init.headers = {};
        }

        (init.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return fetchWithRetry(input, init);
}

/**
 * Loading a collection fires many requests at once, and GitHub answers a few of them by dropping the
 * HTTP/2 stream (NGHTTP2_REFUSED_STREAM) or by throttling — either one aborts the whole build. Both
 * are transient, so they are retried; any other HTTP response is handed back for the caller to read.
 */
async function fetchWithRetry(input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response> {
    const attempts = 4;

    for (let attempt = 1; ; attempt++) {
        const lastAttempt = attempt === attempts;
        let response: Response;

        try {
            response = await fetch(input, init);
        } catch (error) {
            if (lastAttempt) {
                throw error;
            }

            await delay(backoff(attempt));
            continue;
        }

        if (isTransient(response) && !lastAttempt) {
            const wait = retryAfter(response) ?? backoff(attempt);

            // Retries are silent otherwise, and throttling would just look like an inexplicably slow build.
            console.warn(`GitHub answered ${response.status}, retrying in ${wait}ms: ${input}`);
            await delay(wait);
            continue;
        }

        return response;
    }
}

function isTransient(response: Response): boolean {
    if (response.status === 429 || response.status >= 500) {
        return true;
    }

    // GitHub also reports rate limits as 403, but a 403 is otherwise a permanent "no": only treat it
    // as transient when it carries the headers that mark an exhausted budget.
    return response.status === 403
        && (response.headers.has('retry-after') || response.headers.get('x-ratelimit-remaining') === '0');
}

function backoff(attempt: number): number {
    return 300 * 2 ** (attempt - 1);
}

/** GitHub states how long to wait either as a delay in seconds or as the epoch second to resume at. */
function retryAfter(response: Response): number | null {
    const header = response.headers.get('retry-after') ?? response.headers.get('x-ratelimit-reset');

    if (header === null) {
        return null;
    }

    const value = Number(header);

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    const milliseconds = response.headers.has('retry-after') ? value * 1000 : value * 1000 - Date.now();

    // A rate limit that resets in an hour is not something to sit and wait for.
    return milliseconds > 0 && milliseconds <= 30_000 ? milliseconds : null;
}

function delay(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}