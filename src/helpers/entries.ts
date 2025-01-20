import {getCollection} from "astro:content";

export type SeriesIndex = {
    title: string;
    slug: string;
    current: boolean;
}

export async function getSeriesPost(author: string, series: string, currentSlug: string): Promise<SeriesIndex[]> {
    let collection = await getCollection('entries');
    collection = collection
        .filter(entry => entry.data.series === series && entry.data.author === author)
        .sort((a, b) => new Date(a.data.publishDate).getTime() - new Date(b.data.publishDate).getTime());
    collection = collection.filter(entry => entry.data.series === series);

    return collection.map(entry => {
        return {
            title: entry.data.title,
            slug: entry.data.slug,
            current: entry.data.slug === currentSlug,
        }
    })
}