/**
 * Serves the `/comments` endpoint in development, standing in for the Cloudflare worker that answers
 * it in production. Node ships with the blog's toolchain, so this keeps development free of a PHP
 * runtime; it deliberately duplicates the handful of lines in `.cloudflare/worker.js` rather than
 * sharing a module, since a worker deployed from a single self-contained file is simpler.
 *
 * Unlike production, the dev site is served from another port, so this answers with CORS headers.
 *
 *   GH_TOKEN=$(gh auth token) npm run dev:comments
 */
import {createServer} from 'node:http';

const PORT = 4322;
const REPOSITORY = 'blog';
const REPOSITORY_OWNER = 'iokode';
const GHOST_USER = {login: 'ghost', avatarUrl: 'https://avatars.githubusercontent.com/u/10137?v=4'};

const token = process.env.GH_TOKEN;

if (!token) {
    console.error('GH_TOKEN is required. Start it with: GH_TOKEN=$(gh auth token) npm run dev:comments');
    process.exit(1);
}

const query = `
query ($repository: String!, $repositoryOwner: String!, $discussionId: Int!) {
  repository(name: $repository, owner: $repositoryOwner) {
    discussion(number: $discussionId) {
      comments(first: 100) {
        nodes {
          bodyHTML
          createdAt
          upvoteCount
          author {
            login
            avatarUrl
          }
          replies(first: 100) {
            nodes {
              bodyHTML
              createdAt
              upvoteCount
              author {
                login
                avatarUrl
              }
            }
          }
        }
      }
    }
  }
}
`;

/** A discussion is usually a handful of people talking, so their names are worth keeping around. */
const realNames = new Map();

async function getGithubRealName(username) {
    let request = realNames.get(username);

    if (request === undefined) {
        request = fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'butterfly-dev'
            }
        })
            .then(response => response.ok ? response.json() : null)
            .then(data => data?.name || username)
            .catch(() => username);

        realNames.set(username, request);
    }

    return request;
}

async function toComment(node, replies) {
    const author = node.author ?? GHOST_USER;

    return {
        body: node.bodyHTML,
        user: {
            realName: await getGithubRealName(author.login),
            username: author.login,
            avatarUrl: author.avatarUrl
        },
        creationDate: node.createdAt,
        replies,
        positiveReactions: node.upvoteCount
    };
}

async function getComments(discussionId) {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'butterfly-dev'
        },
        body: JSON.stringify({
            query,
            variables: {
                repository: REPOSITORY,
                repositoryOwner: REPOSITORY_OWNER,
                discussionId: parseInt(discussionId)
            }
        })
    });

    if (!response.ok) {
        throw new Error('GitHub API request failed.');
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(`GraphQL API errors: ${JSON.stringify(data.errors)}`);
    }

    return await Promise.all(
        (data.data?.repository?.discussion?.comments?.nodes || []).map(async node => {
            // Only one level of replies is handled, matching the worker.
            const replies = await Promise.all(
                (node.replies?.nodes || []).map(replyNode => toComment(replyNode, []))
            );

            return toComment(node, replies);
        })
    );
}

createServer(async (request, response) => {
    const url = new URL(request.url, `http://localhost:${PORT}`);
    const discussionId = url.searchParams.get('discussionId');

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');

    if (!discussionId) {
        response.writeHead(400);
        response.end(JSON.stringify({error: 'Missing required "discussionId" query parameter.'}));
        return;
    }

    try {
        const comments = await getComments(discussionId);

        console.log(`discussion ${discussionId}: ${comments.length} comment(s)`);
        response.end(JSON.stringify(comments));
    } catch (error) {
        console.error(`discussion ${discussionId}: ${error.message}`);
        response.writeHead(500);
        response.end(JSON.stringify({error: error.message}));
    }
}).listen(PORT, () => console.log(`Comments available at http://localhost:${PORT}/comments`));
