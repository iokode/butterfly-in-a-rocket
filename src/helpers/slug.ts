/**
 * Turns heading text into an anchor id.
 *
 * The table of contents and the headings themselves are rendered by different components that
 * never see each other, so both call this and rely on it being deterministic. Change it and both
 * sides move together; fork it and the anchors quietly stop matching.
 *
 * Two headings with identical text in one post collapse onto the same id, and the anchor lands on
 * the first. That is rare enough not to be worth a stateful de-duplicator that only one of the two
 * call sites could maintain.
 */
export function slugify(text: string): string {
    return text
        // Markdown emphasis and inline code survive into the raw heading text.
        .replace(/[*_`~]/g, '')
        // Keep the Spanish back catalogue's accents addressable rather than dropping them.
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/** Pulls the `##` headings out of a raw Markdown body, in document order. */
export function extractHeadings(markdown: string): { id: string, label: string }[] {
    const headings: { id: string, label: string }[] = [];
    let inFence = false;

    for (const line of markdown.split('\n')) {
        // A `## ` inside a fenced code block is code, not a heading.
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            continue;
        }
        if (inFence) continue;

        const match = /^##\s+(.*\S)\s*$/.exec(line);
        if (match) {
            const label = match[1].replace(/[*_`~]/g, '').trim();
            headings.push({id: slugify(match[1]), label});
        }
    }

    return headings;
}
