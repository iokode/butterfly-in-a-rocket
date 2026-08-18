import {getCollection} from "astro:content";
import {repository} from "../content.config";

/**
 * Comment counts for post index cards, read at build time.
 *
 * The design system's PostCard shows "N comments" and only falls back to "Discuss" when no count
 * is available, so the number has to exist before the page is rendered. The thread itself is still
 * fetched in the browser through the `/comments` worker — this is only the headline figure.
 *
 * Every discussion is asked for in one aliased GraphQL query rather than one request per post, and
 * the whole thing is best-effort: without a token, or if GitHub is unreachable, callers get an
 * empty map and the cards say "Discuss" exactly as they did before. A missing count must never
 * fail a build.
 */

/** Top-level comments plus their replies, matching what the rendered thread totals up. */
type Counts = Map<number, number>;

let cached: Promise<Counts> | undefined;

const endpoint = 'https://api.github.com/graphql';

function buildQuery(ids: number[]): string {
    const [owner, name] = repository.split('/');
    const fields = ids
        .map(id => `d${id}: discussion(number: ${id}) {
            comments(first: 100) { totalCount nodes { replies(first: 100) { totalCount } } }
        }`)
        .join('\n');

    return `query { repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${fields} } }`;
}

async function fetchChunk(ids: number[], token: string, into: Counts): Promise<void> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'butterfly-in-a-rocket',
        },
        body: JSON.stringify({query: buildQuery(ids)}),
    });

    if (!response.ok) {
        throw new Error(`GitHub GraphQL returned ${response.status}`);
    }

    const payload = await response.json();
    const discussions = payload?.data?.repository ?? {};

    for (const id of ids) {
        const discussion = discussions[`d${id}`];
        if (!discussion) continue; // A deleted or renumbered discussion just has no count.

        const nodes = discussion.comments?.nodes ?? [];
        const replies = nodes.reduce(
            (sum: number, node: { replies?: { totalCount?: number } }) => sum + (node.replies?.totalCount ?? 0),
            0,
        );

        into.set(id, (discussion.comments?.totalCount ?? 0) + replies);
    }
}

async function load(ids: number[]): Promise<Counts> {
    const counts: Counts = new Map();
    const token = process.env.GH_TOKEN;

    if (!token || ids.length === 0) {
        return counts;
    }

    // Aliased queries share one complexity budget, so they go out in modest batches.
    const chunkSize = 25;
    for (let index = 0; index < ids.length; index += chunkSize) {
        try {
            await fetchChunk(ids.slice(index, index + chunkSize), token, counts);
        } catch (error) {
            console.warn(`[discussions] comment counts unavailable: ${(error as Error).message}`);
        }
    }

    return counts;
}

/**
 * Counts for every discussion on the site, fetched once per build.
 *
 * The whole post collection is read here rather than accepting ids from the caller, so the set is
 * always complete on the first call and every card on every page is served from one batch.
 */
export function getCommentCounts(): Promise<Counts> {
    cached ??= getCollection('posts')
        .then(posts => load(posts.map(post => post.data.discussionId).filter(Boolean)));
    return cached;
}
