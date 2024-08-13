import { repository } from "../config";
import { Author, Post, PostResume } from "../models/Post";

/**
 * @returns The lasts five posts.
 */
export async function getLastPosts(): Promise<PostResume[]> {
    return [
        new PostResume(
            "The Unit of Work pattern",
            "uow-pattern",
            new Date(),
            new Author("Ivan Montilla", "montyclt")
        ),
        new PostResume(
            "Semantic HTML is more than writting semantic tags",
            "semantic",
            new Date(),
            new Author("Ivan Montilla", "montyclt")
        ),
        new PostResume(
            "How to avoid teamwork problems",
            "el-patron",
            new Date(),
            new Author("Ivan Montilla", "montyclt")
        ),
        new PostResume(
            "My opinion about software bootcamps",
            "bootcamps",
            new Date(),
            new Author("Ivan Montilla", "montyclt")
        ),
        new PostResume(
            "El patrón Unit of Work",
            "el-patron",
            new Date(),
            new Author("Ivan Montilla", "montyclt")
        ),
    ];
}

export async function getTheWhy(): Promise<string> {
    const url = `https://raw.githubusercontent.com/${repository}/main/why.md`;
    const content = (await fetch(url)).text();

    return content;
}
