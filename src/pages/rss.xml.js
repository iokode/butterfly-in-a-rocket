import rss from '@astrojs/rss';
import {getCollection} from "astro:content";

export async function GET() {
    const entries = await getCollection('entries');
    
    return rss({
        title: 'IOKode — The opinionated tech blog.',
        description: 'A software development blog.',
        site: "https://iokode.blog",
        trailingSlash: false,
        items: entries.map(entry => {
            return {
                title: entry.data.title,
                link: `post/${entry.data.slug}`,
                pubDate: entry.data.publishDate,
                author: entry.data.authorName,
            }
        }),
        customData: `<language>en</language>`,
    });
}