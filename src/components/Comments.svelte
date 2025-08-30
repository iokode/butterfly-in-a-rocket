<script lang="ts">
    import {type Comment, getComments} from "../helpers/github";
    import {onMount} from "svelte";

    export let discussionId: number;
    export let author: string;

    let comments: Comment[] = [];
    let loadingComments = true;
    let errorLoadingComments = false;

    async function main() {
        try {
            comments = await getComments('iokode/blog', discussionId);
        } catch (e) {
            errorLoadingComments = true;
        } finally {
            loadingComments = false;
        }
    }

    onMount(async () => await main());
</script>

<div class="comments">
    <h1>Comments</h1>
    {#if loadingComments}
        <p>Loading comments...</p>
    {:else if errorLoadingComments}
        <p>An error occurred while loading the comments for this post. <a href="https://github.com/iokode/blog/discussions/{discussionId}">Click here to view them on GitHub</a>.</p>
    {:else}
        {#if comments.length === 0}
            <p>No comments yet. Be the first to share your thoughts!</p>
        {:else}
            {#each comments as comment}
                <div class="group">
                    <div class="comment">
                        <p class="heading">Comment written by <a target="_blank" href="https://github.com/{comment.user.username}">{comment.user.realName}</a> on {comment.creationDate.toDateString()}</p>
                        <div class="avatar-container">
                            <img class="avatar" src={comment.user.avatarUrl} alt="GitHub avatar of {comment.user.username}"/>
                            {#if comment.user.username === author}
                                <div class="author">Post author</div>
                            {/if}
                        </div>
                        <div class="content">{@html comment.body}</div>
                    </div>

                    {#each comment.replies as reply}
                        <div class="reply">
                            <p class="heading">Reply written by <a target="_blank" href="https://github.com/{reply.user.username}">{reply.user.realName}</a> on {reply.creationDate.toDateString()}</p>
                            <div class="avatar-container">
                                <img class="avatar" src={reply.user.avatarUrl} alt="GitHub avatar of {reply.user.username}"/>
                                {#if reply.user.username === author}
                                    <div class="author">Post author</div>
                                {/if}
                            </div>
                            <div class="content">{@html reply.body}</div>
                        </div>
                    {/each}
                </div>
            {/each}
        {/if}
    {/if}

    <p><a href="https://github.com/iokode/blog/discussions/{discussionId}">Write a comment on GitHub!</a></p>
</div>

<style lang="scss">
    @use "../styles/variables/borders";
    @use "../styles/variables/colors";
    @use "../styles/variables/devices";
    @use "../styles/variables/fonts";

    .comments {
        // Boxing
        margin-top: 2em;
        padding-top: 2em;

        @media print {
            // Boxing
            display: none;
        }
    }

    .group {
        // Boxing
        margin-top: 1em;
        
        // Style
        border: borders.$default;
    }

    .comment, .reply {
        // Boxing
        display: grid;
        padding: 1em;

        // Grid
        column-gap: 1em;
        grid-template-rows: fit-content(100%) 1fr;

        grid-template-areas:
            "heading"
            "content";

        .avatar-container {
            display: none;
            
            @media (min-width: devices.$tablet) {
                display: block;
                grid-area: avatar;

                .avatar {
                    width: 6em;
                }

                .author {
                    border: borders.$thin;
                    padding: .5em;
                    font-size: .7em;
                    text-align: center;
                    font-weight: bold;
                }
            }
        }

        .heading {
            font-size: 1.2em;
            font-family: fonts.$titles;
            margin: 0;
            grid-area: heading;
        }

        .content {
            grid-area: content;
        }

        @media (min-width: devices.$tablet) {
            // Grid
            grid-template-columns: fit-content(100%) 1fr;
            grid-template-areas:
            "avatar heading"
            "avatar content";
        }
    }

    .reply {
        padding-top: 1em;
        border-top: borders.$thin-inset;
    }
</style>