import { Post } from "../models/Post";

function getLastTwoPosts(): Post[] {
    return [
        new Post(),
        new Post()
    ];
}
