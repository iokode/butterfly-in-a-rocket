export async function getGithubRealnameFromUserName(username: string): Promise<string> {
    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
        let json = await response.json();
        
        if (json.message) {
            throw new Error(`GitHub error: ${json.message}`);
        }
        
        throw new Error(`GitHub user not found: ${username}`);
    }

    const userData = await response.json();
    return userData.name || username; // Return username if name is not set
}

export async function fetchRepoTree(repository: string): Promise<{
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

export async function fetchFileContent(repository: string, filePath: string): Promise<string> {
    const rawUrl = `https://raw.githubusercontent.com/${repository}/main/${filePath}`;
    const response = await fetch(rawUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch file ${filePath}: ${response.statusText}`);
    }
    return await response.text();
}