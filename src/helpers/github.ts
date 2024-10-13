import {getRepository} from "../config.ts";

const repository = getRepository();

export async function getGithubRealnameFromUserName(username: string): Promise<string> {
    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
        throw new Error(`GitHub user not found: ${username}`);
    }

    const userData = await response.json();
    return userData.name || username; // Return username if name is not set
}

export async function fetchRepoTree(): Promise<{
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
}[]> {
    const response = await fetch(`https://api.github.com/repos/${repository}/git/trees/main?recursive=1`);
    if (!response.ok) {
        throw new Error(`Failed to fetch repository tree: ${response.statusText}`);
    }
    const data = await response.json();
    return data.tree; // Array of all files and directories in the repo
}

export async function fetchFileContent(filePath: string): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${repository}/main/${filePath}`;
    const response = await fetch(rawUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file ${filePath}: ${response.statusText}`);
    }
    return await response.text();
}