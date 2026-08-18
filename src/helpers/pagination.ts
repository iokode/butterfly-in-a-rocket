import {getCollection} from "astro:content";
import {comparePostsByChronologicalPositionDescending} from "./posts";

/** Posts per page on the index. */
export const postsPerPage = 5;

/**
 * The posts the index paginates over: newest first, without the Spanish back catalogue, which has
 * its own archive.
 *
 * The filter runs before any slicing. Filtering a page after it has been cut is what made the old
 * index show fewer than five posts whenever a legacy post fell inside the window.
 */
export async function getIndexPosts() {
    return (await getCollection('posts'))
        .sort(comparePostsByChronologicalPositionDescending)
        .filter(post => !post.data.tags.includes('spanish-legacy-post'));
}

export function getPageCount(total: number): number {
    return Math.max(1, Math.ceil(total / postsPerPage));
}
