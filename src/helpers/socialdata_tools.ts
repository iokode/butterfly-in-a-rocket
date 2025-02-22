export type XPost = {
    id: string;
    content: string;
    url: string;
    author: {
        displayName: string;
        username: string;
        profilePictureUrl: string;
    };
    creationDate: Date;
    quoting: XPost | null;
};

export async function getPost(id: string): Promise<XPost> {
    let response = await request(`https://api.socialdata.tools/twitter/tweets/${id}`, 'GET');
    let json = await response.json();

    let post: XPost = {
        id: id,
        url: `https://x.com/${json.user.screen_name}/status/${id}`,
        creationDate: new Date(json.tweet_created_at),
        content: json.full_text,
        author: {
            displayName: json.user.name,
            username: json.user.screen_name,
            profilePictureUrl: json.user.profile_image_url_https,
        },
        quoting: null
    };

    if (json.quoted_status !== null) {
        post.quoting = {
            id: json.quoted_status.id_str,
            url: `https://x.com/${json.quoted_status.user.screen_name}/status/${json.quoted_status.id_str}`,
            creationDate: new Date(json.quoted_status.created_at),
            content: json.quoted_status.full_text,
            author: {
                displayName: json.quoted_status.user.name,
                profilePictureUrl: json.quoted_status.user.profile_image_url_https,
                username: json.quoted_status.user.screen_name,
            },
            quoting: null,
        };
    }

    return post;
}

async function request(uri: string, method: 'GET' | 'POST'): Promise<Response> {
    let apiKey = process.env.SOCIALDATA_API_KEY;

    let response = await fetch(uri, {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (response.status === 401) {
        throw new Error('Invalid SocialData.tools API key.');
    }

    if (response.status === 402) {
        throw new Error('Insufficient credit balance on SocialData.tools account.');
    }

    if (response.status === 404) {
        throw new Error('X Post not found on SocialData.tools.');
    }

    if (response.status === 429) {
        throw new Error('Rate limit exceeded on SocialData.tools.');
    }

    return response;
}