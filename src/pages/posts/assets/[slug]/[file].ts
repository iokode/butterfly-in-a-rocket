import {getCollection} from "astro:content";
import {fetchRepoTree, getRawContent} from "../../../../helpers/github.ts";
import {repository} from "../../../../content/config.ts";

export async function getStaticPaths() {
    const posts = await getCollection('posts');
    const tree = await fetchRepoTree(repository);

    const paths: { params: { slug: string; file: string }; props: { filePath: string } }[] = [];

    for (const post of posts) {
        const postDirectory = post.id; // This will be like "posts/123-my-post"

        const files = tree.filter(file =>
            file.type === 'blob' &&
            file.path.startsWith(postDirectory + '/') &&
            !file.path.endsWith('/entry.md') &&
            !file.path.endsWith('/entry.mdx')
        );

        for (const file of files) {
            const fileName = file.path.split('/').pop() || '';
            if (fileName) {
                paths.push({
                    params: {
                        slug: post.data.slug,
                        file: fileName
                    },
                    props: {
                        filePath: file.path
                    }
                });
            }
        }
    }

    return paths;
}

export async function GET(context: { props: { filePath: string } }) {
    const {filePath} = context.props;

    const buffer = await getRawContent(repository, filePath);
    return new Response(buffer);
}