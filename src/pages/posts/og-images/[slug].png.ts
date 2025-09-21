import {getCollection} from "astro:content";
import {generateOGImage} from "../../../helpers/og-generator.ts";

export async function getStaticPaths() {
    const posts = await getCollection('posts');

    const paths: { params: { slug: string }; props: { title: string } }[] = [];

    for (const post of posts) {
        const title = post.data.title;
        const slug = post.data.slug;

        paths.push({
            params: {
                slug: slug
            },
            props: {
                title: title
            }
        });
    }

    return paths;
}

export async function GET(context: { props: { title: string } }) {
    const {title} = context.props;
    const buffer = await generateOGImage(title);

    return new Response(buffer);
}