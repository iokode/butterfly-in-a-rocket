import rss from '@astrojs/rss';
import {getCollection} from "astro:content";

export async function GET() {
    const posts = await getCollection('posts');
    
    return rss({
        title: 'IOKode — The opinionated tech blog.',
        description: 'A software development blog.',
        site: "https://iokode.blog",
        trailingSlash: false,
        items: posts.map(post => {
            return {
                title: post.data.title,
                link: `post/${post.data.slug}`,
                pubDate: post.data.publishDate,
                author: post.data.authorName,
            }
        }),
        customData: `<language>en</language>`,
    });
}