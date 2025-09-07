import {getCollection} from "astro:content";

export type SeriesIndex = {
    title: string;
    slug: string;
    current: boolean;
}

export async function getSeriesPost(author: string, series: string, currentSlug: string): Promise<SeriesIndex[]> {
    let collection = await getCollection('posts');
    collection = collection
        .filter(post => post.data.series === series && post.data.author === author)
        .sort((a, b) => new Date(a.data.publishDate).getTime() - new Date(b.data.publishDate).getTime());
    collection = collection.filter(post => post.data.series === series);

    return collection.map(post => {
        return {
            title: post.data.title,
            slug: post.data.slug,
            current: post.data.slug === currentSlug,
        }
    })
}