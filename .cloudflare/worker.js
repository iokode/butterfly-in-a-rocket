export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (request.method !== 'GET') {
            return createJsonResponse(null, 405);
        }

        if (url.pathname === '/comments') {
            return handleComments(request, env);
        }

        const matchLegacyUrl = url.pathname.match(/^\/post\/\d{4}\/(.+)$/);
        if (matchLegacyUrl) {
            const slug = matchLegacyUrl[1];
            return handleRedirectFromLegacyURL(request, slug);
        }

        return serveStaticAsset(request, env);
    },
};

function handleRedirectFromLegacyURL(request, slug) {
    const redirectUrl = new URL(`/posts/${slug}`, request.url);
    return new Response(null, {
        status: 301,
        headers: {
            'Location': redirectUrl.href
        }
    });
}

function createJsonResponse(data, status = 200) {
    const body = data === null ? null : JSON.stringify(data);

    return new Response(body, {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

async function getGithubRealName(username, token) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Cloudflare-Worker'
            }
        });

        if (!response.ok) {
            return username;
        }

        const data = await response.json();
        return data.name || username;
    } catch (error) {
        return username;
    }
}

function getGhostUser() {
    return {
        login: 'ghost',
        avatarUrl: 'https://avatars.githubusercontent.com/u/10137?v=4'
    };
}

async function handleComments(request, env) {
    const url = new URL(request.url);
    const repository = env.REPOSITORY;
    const repositoryOwner = env.REPOSITORY_OWNER;
    const discussionId = url.searchParams.get('discussionId');
    const token = env.GITHUB_TOKEN;

    if (!repository || !repositoryOwner || !token) {
        return createJsonResponse({
            error: 'Missing required environment variables.'
        }, 500);
    }

    if (!discussionId) {
        return createJsonResponse({
            error: 'Missing required "discussionId" query parameter.'
        }, 400);
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

    const variables = {
        repository,
        repositoryOwner,
        discussionId: parseInt(discussionId)
    };

    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Cloudflare-Worker'
        },
        body: JSON.stringify({query, variables})
    });

    if (!response.ok) {
        return createJsonResponse({
            error: 'GitHub API request failed.'
        }, 500);
    }

    const data = await response.json();
    const comments = await Promise.all(
        (data.data?.repository?.discussion?.comments?.nodes || []).map(async (node) => {
            if (!node.author) {
                node.author = getGhostUser();
            }

            const replies = await Promise.all(
                (node.replies?.nodes || []).map(async (replyNode) => {
                    if (!replyNode.author) {
                        replyNode.author = getGhostUser();
                    }

                    return {
                        body: replyNode.bodyHTML,
                        user: {
                            realName: await getGithubRealName(replyNode.author.login, token),
                            username: replyNode.author.login,
                            avatarUrl: replyNode.author.avatarUrl
                        },
                        creationDate: replyNode.createdAt,
                        replies: [], // Only handle one level of replies
                        positiveReactions: replyNode.upvoteCount
                    };
                })
            );

            return {
                body: node.bodyHTML,
                user: {
                    realName: await getGithubRealName(node.author.login, token),
                    username: node.author.login,
                    avatarUrl: node.author.avatarUrl
                },
                creationDate: node.createdAt,
                replies,
                positiveReactions: node.upvoteCount
            };
        })
    );

    return createJsonResponse(comments);
}

async function serveStaticAsset(request, env) {
    const response = await env.ASTRO.fetch(request);

    if (response.status === 404) {
        const notFoundRequest = new Request(new URL('/404.html', request.url).href, {
            method: 'GET'
        });
        const notFoundResponse = await env.ASTRO.fetch(notFoundRequest);

        return new Response(notFoundResponse.body, {
            status: 404,
            headers: notFoundResponse.headers
        });
    }

    return response;
}