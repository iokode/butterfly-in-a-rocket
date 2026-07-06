import {type CollectionEntry, getCollection} from "astro:content";

type Post = CollectionEntry<'posts'>;

export type SeriesIndex = {
    title: string;
    slug: string;
    current: boolean;
}

export function comparePostsByChronologicalPositionAscending(a: Post, b: Post) {
    return a.data.publishDate.valueOf() - b.data.publishDate.valueOf() || (a.data.order ?? 0) - (b.data.order ?? 0);
}

export function comparePostsByChronologicalPositionDescending(a: Post, b: Post) {
    return b.data.publishDate.valueOf() - a.data.publishDate.valueOf() || (b.data.order ?? 0) - (a.data.order ?? 0);
}

export async function getSeriesPost(author: string, series: string, currentSlug: string): Promise<SeriesIndex[]> {
    let collection = await getCollection('posts');
    collection = collection
        .filter(post => post.data.series === series && post.data.author === author)
        .sort(comparePostsByChronologicalPositionAscending);
    collection = collection.filter(post => post.data.series === series);

    return collection.map(post => {
        return {
            title: post.data.title,
            slug: post.data.slug,
            current: post.data.slug === currentSlug,
        }
    })
}