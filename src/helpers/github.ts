import {isDevelopment} from "./environment.ts";
import {getImage} from "astro:assets";
import type {GetImageResult} from "astro";

export async function getGithubRealnameFromUserName(username: string): Promise<string> {
    const response = await authenticatedFetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
        let json = await response.json();

        if (json.message) {
            if (json.message.includes('Not Found')) {
                return "Deleted user";
            }

            throw new Error(`GitHub error: ${json.message}`);
        }

        throw new Error(`Unknown GitHub error: ${response.statusText}`);
    }

    const userData = await response.json();
    return userData.name || username; // Return username if the name is not set
}

export async function existsUser(username: string): Promise<boolean> {
    const response = await authenticatedFetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
        let json = await response.json();
        if (json.message) {
            if (json.message.includes('Not Found')) {
                return false;
            }
        }

        throw new Error(`Unknown GitHub error: ${response.statusText}`);
    }

    return true;
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

export async function fetchRepoTree(repository: string): Promise<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
}[]> {
    const response = await authenticatedFetch(`https://api.github.com/repos/${repository}/git/trees/main?recursive=1`);
    if (!response.ok) {
        throw new Error(`Failed to fetch repository tree: ${response.statusText}`);
    }
    const data = await response.json();
    return data.tree; // Array of all files and directories in the repo
}

export async function fetchFileContent(repository: string, filePath: string): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${repository}/main/${filePath}`;
    const response = await authenticatedFetch(rawUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file ${filePath}: ${response.statusText}`);
    }
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

export async function getComments(repository: string, discussionId: number): Promise<Comment[]> {
    let repositorySplit = repository.split('/');
    let repositoryName = repositorySplit[1];
    let repositoryOwner = repositorySplit[0];

    let entryPoint: string;
    if (isDevelopment()) {
        entryPoint = "http://localhost:4322/comments.php";
    } else {
        entryPoint = "/comments.php";
    }

    let request = await fetch(`${entryPoint}?discussionId=${discussionId}&repository=${repositoryName}&repositoryOwner=${repositoryOwner}`);

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

export async function getKeyValueList(repository: string, file: string): Promise<Record<string, string>> {
    let response = await authenticatedFetch(`https://raw.githubusercontent.com/${repository}/refs/heads/main/${file}`);
    return await response.json();
}

function authenticatedFetch(input: string | URL | globalThis.Request, init?: RequestInit) {
    let token: string | undefined = process.env.GITHUB_TOKEN;

    if (typeof token !== undefined) {
        if (init === undefined) {
            init = {};
        }

        if (init.headers === undefined) {
            init.headers = {};
        }

        (init.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return fetch(input, init);
}