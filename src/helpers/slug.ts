/**
 * Turns heading text into an anchor id, so every `##` of a post is linkable from outside it.
 *
 * Two headings with identical text in one post collapse onto the same id, and the anchor lands on
 * the first. That is rare enough not to be worth a stateful de-duplicator.
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
