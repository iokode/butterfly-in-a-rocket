import Alert from "./Alert.astro";
import Message from "./Message.astro";
import Heading from "./Heading.astro";
import CodeBlock from "./CodeBlock.astro";

/**
 * The components every Markdown body is rendered with.
 *
 * `Alert` and `Message` are written by authors in their posts. `Heading` and `CodeBlock` are
 * overrides astro-remote applies to ordinary Markdown syntax — they are why headings get anchors
 * and fenced code gets a copy control.
 *
 * Kept in one place so post bodies, tag descriptions, author bios and the static pages all render
 * identically. Anything rendering Markdown without this set silently loses those affordances.
 */
export const entryComponents = {Alert, Message, Heading, CodeBlock};
