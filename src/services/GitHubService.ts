import { Post } from "../models/Post";

/**
 * @returns The lasts five posts.
 */
function getLastPosts(): Post[] {
    return [
        new Post(),
        new Post()
    ];
}
