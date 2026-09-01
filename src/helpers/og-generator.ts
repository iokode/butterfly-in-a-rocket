import {type CanvasRenderingContext2D, createCanvas, loadImage, registerFont} from 'canvas';
import {join} from 'path';

/**
 * The Open Graph card for a post.
 *
 * Drawn from nothing rather than composited over a raster template. The old template carried the
 * retired branding — the rounded, joined-up circuit butterfly, a textured violet gradient, and
 * the wordmark mis-cased as "IOkode" — so every share of every post advertised the previous
 * identity. The design system rules out gradients and background textures, and fixes the casing
 * as "IOKode".
 *
 * Full-bleed violet with the mark reversed to white is the one place the system uses the accent as
 * a field, and it is what makes the card recognisable at thumbnail size in a timeline.
 */

const width = 1200;
const height = 630;

/* Straight from the design system's mark. Kept as a full SVG document because node-canvas has no
   Path2D, but does render SVG through librsvg. */
const markSvg = (size: number) => `<svg xmlns="http://www.w3.org/2000/svg"
    width="${size * 52 / 44}" height="${size}" viewBox="0 0 52 44">
<g fill="#ffffff">
<path d="M26 9 27.6 13.5 27.2 30 26 34.5 24.8 30 24.4 13.5z"/>
<path d="M27.3 8.5 33.4 2.6l1.9 1.7-6.1 5.9zM24.7 8.5 18.6 2.6l-1.9 1.7 6.1 5.9z"/>
<path d="M23.2 12 3 1.5 1 17.5l10.5 5.5 11.7-2.5z"/>
<path d="M28.8 12 49 1.5l2 16-10.5 5.5-11.7-2.5z"/>
<path d="M23.2 23.5 9.5 26.5 14.5 41l8.7-9.5z"/>
<path d="M28.8 23.5 42.5 26.5 37.5 41l-8.7-9.5z"/>
<circle cx="18.5" cy="2.8" r="2.6"/><circle cx="33.5" cy="2.8" r="2.6"/>
</g></svg>`;

let fontsRegistered = false;

function registerFonts() {
    if (fontsRegistered) return;
    const fonts = join(process.cwd(), 'src/assets/fonts');
    registerFont(join(fonts, 'ChakraPetch-SemiBold.ttf'), {family: 'Chakra Petch', weight: '600'});
    registerFont(join(fonts, 'ChakraPetch-Regular.ttf'), {family: 'Chakra Petch', weight: '400'});
    fontsRegistered = true;
}

export async function generateOGImage(title: string): Promise<Buffer> {
    registerFonts();

    const canvas = createCanvas(width, height);
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

    // Flat violet. No gradient, no texture — the brand has neither.
    ctx.fillStyle = 'hsl(285, 100%, 35%)';
    ctx.fillRect(0, 0, width, height);

    const padding = 72;

    // Lockup, top left. The wordmark is 0.95x the mark height at the system's ratio.
    const markHeight = 56;
    const mark = await loadImage(`data:image/svg+xml;base64,${Buffer.from(markSvg(markHeight)).toString('base64')}`);
    ctx.drawImage(mark, padding, padding, mark.width, mark.height);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(markHeight * 0.95)}px "Chakra Petch"`;
    ctx.fillText('IOKode', padding + mark.width + markHeight * 0.34, padding + markHeight / 2 + 1);

    // A 4px rule along the foot, the system's emphasis weight, in the reversed white.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(padding, height - padding, 96, 4);

    // The title fills the space between, set from the bottom up so short titles sit low and near
    // the rule rather than floating in the middle of the field.
    const fontSize = 68;
    const lineHeight = fontSize * 1.15;
    ctx.font = `600 ${fontSize}px "Chakra Petch"`;
    ctx.fillStyle = '#ffffff';

    const lines = getLinesForDisplay(title, ctx, width - padding * 2);
    const lastBaseline = height - padding - 48 - lineHeight / 2;

    lines.forEach((line, index) => {
        const y = lastBaseline - (lines.length - 1 - index) * lineHeight;
        ctx.fillText(line, padding, y);
    });

    return canvas.toBuffer('image/png');
}

function getLines(title: string, ctx: CanvasRenderingContext2D, maxWidth: number) {
    const words = title.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
}

function getLinesForDisplay(title: string, ctx: CanvasRenderingContext2D, maxWidth: number) {
    const lines = getLines(title, ctx, maxWidth);
    const displayLines = lines.slice(0, 3);

    if (lines.length > 3) {
        let trimmedLine = displayLines[2];
        while (ctx.measureText(`${trimmedLine}...`).width > maxWidth && trimmedLine.length > 0) {
            trimmedLine = trimmedLine.slice(0, -1);
        }
        displayLines[2] = `${trimmedLine}...`;
    }

    return displayLines;
}
