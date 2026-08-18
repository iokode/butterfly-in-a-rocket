/**
 * Reading time for an article byline, in the design system's "4 min read" form.
 *
 * It appears on the article only. The index cards deliberately omit it — `PostCard` does not pass
 * it to `PostMeta`, because a list of posts is for choosing one, not for budgeting an afternoon.
 *
 * 200 words per minute is the usual figure for technical prose. Code is counted at a quarter of
 * that: reading a snippet is slower per word than reading a sentence, but a fenced block of config
 * is not four minutes of anyone's life either.
 */

const proseWordsPerMinute = 200;
const codeWordsPerMinute = 50;

function countWords(text: string): number {
    const words = text.trim().match(/\S+/g);
    return words ? words.length : 0;
}

export function getReadingTime(markdown: string): string {
    const codeBlocks: string[] = [];

    const prose = markdown
        // Pull fenced code out first so it can be weighted differently.
        .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, match => {
            codeBlocks.push(match);
            return ' ';
        })
        // MDX components and raw HTML are markup, not reading.
        .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
        // Link and image syntax: keep the label, drop the target.
        .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
        // Leftover markdown punctuation.
        .replace(/[#>*_`|-]/g, ' ');

    const minutes =
        countWords(prose) / proseWordsPerMinute +
        countWords(codeBlocks.join(' ')) / codeWordsPerMinute;

    return `${Math.max(1, Math.round(minutes))} min read`;
}
