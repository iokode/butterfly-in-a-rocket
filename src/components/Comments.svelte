<script lang="ts">
    import {type Comment, getComments} from "../helpers/github";
    import {onMount} from "svelte";
    import Icon from "./Icon.svelte";

    export let discussionId: number;
    export let author: string;

    let comments: Comment[] = [];
    let loadingComments = true;
    let errorLoadingComments = false;

    const discussionUrl = `https://github.com/iokode/blog/discussions/${discussionId}`;

    $: total = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

    async function main() {
        try {
            comments = await getComments(discussionId);
        } catch (e) {
            errorLoadingComments = true;
        } finally {
            loadingComments = false;
        }
    }

    onMount(async () => await main());
</script>

<!--
  Comments are mirrored read-only from the post's GitHub discussion. There is deliberately no
  compose box: a local textarea would imply a connection that does not exist. The thread closes
  with an invitation pointing at the discussion, not a disclaimer about what the page cannot do.
-->
<section class="comments">
    <header class="header">
        <h2>Comments</h2>
        {#if !loadingComments && !errorLoadingComments && total > 0}
            <span class="count">{total} on this post, from the GitHub discussion</span>
        {/if}
    </header>

    {#if loadingComments}
        <p class="status">Loading comments...</p>
    {:else if errorLoadingComments}
        <p class="status">
            An error occurred while loading the comments for this post.
            {' '}<a href={discussionUrl}>View them on GitHub</a>.
        </p>
    {:else if comments.length === 0}
        <p class="status">No comments yet. Be the first to share your thoughts.</p>
    {:else}
        <div class="thread">
            {#each comments as comment}
                <article class="comment" class:by-author={comment.user.username === author}>
                    <span class="avatar">
                        <img src={comment.user.avatarUrl} alt="GitHub avatar of {comment.user.username}"/>
                    </span>

                    <p class="heading">
                        <strong>
                            <a target="_blank" rel="noopener" href="https://github.com/{comment.user.username}">{comment.user.realName}</a>
                        </strong>
                        {#if comment.user.username === author}
                            <span class="badge accent">Author</span>
                        {/if}
                        <span class="date">{comment.creationDate.toDateString()}</span>
                    </p>

                    <div class="content">{@html comment.body}</div>

                    {#if comment.replies.length > 0}
                        <div class="replies">
                            {#each comment.replies as reply}
                                <article class="comment" class:by-author={reply.user.username === author}>
                                    <span class="avatar">
                                        <img src={reply.user.avatarUrl} alt="GitHub avatar of {reply.user.username}"/>
                                    </span>

                                    <p class="heading">
                                        <strong>
                                            <a target="_blank" rel="noopener" href="https://github.com/{reply.user.username}">{reply.user.realName}</a>
                                        </strong>
                                        {#if reply.user.username === author}
                                            <span class="badge accent">Author</span>
                                        {/if}
                                        <span class="date">{reply.creationDate.toDateString()}</span>
                                    </p>

                                    <div class="content">{@html reply.body}</div>
                                </article>
                            {/each}
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    {/if}

    <div class="invitation">
        <p>
            Have something to add? Comments live in this post's GitHub discussion — join the
            conversation there.
        </p>
        <a class="button small" href={discussionUrl} target="_blank" rel="noopener">
            <Icon name="github" size={15}/>
            Join the discussion
        </a>
    </div>
</section>

