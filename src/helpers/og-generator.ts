import {type CanvasRenderingContext2D, createCanvas, loadImage, registerFont} from 'canvas';
import {join} from 'path';

export async function generateOGImage(title: string): Promise<Buffer> {
    const width = 1200;
    const height = 630;
    const fontSize = 64;
    const textColor = 'hsl(285, 100%, 35%)';
    const maxWidth = width - 120;
    const lineHeight = fontSize * 1.2;

    registerFont(join(process.cwd(), 'src/assets/fonts/ChakraPetch-Regular.ttf'), {family: 'Chakra Petch'});
    const canvas = createCanvas(width, height);
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

    const templatePath = join(process.cwd(), 'src/assets/images/og-card.png');
    const baseImage = await loadImage(templatePath);
    ctx.drawImage(baseImage, 0, 0, width, height);

    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayLines = getLinesForDisplay(title, ctx, maxWidth);
    let startY = calculateStarYPosition(displayLines, lineHeight, height);

    displayLines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        ctx.fillText(line, width / 2, y);
    });

    return canvas.toBuffer('image/png');
}

function calculateStarYPosition(displayLines: string[], lineHeight: number, height: number) {
    const totalTextHeight = displayLines.length * lineHeight;
    let startY = (height - totalTextHeight) / 2 + (lineHeight / 2);

    if (displayLines.length == 2) {
        startY += 15;
    } else if (displayLines.length == 3) {
        startY += 30;
    }
    return startY;
}

function getLines(title: string, ctx: CanvasRenderingContext2D, maxWidth: number) {
    const words = title.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
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
        while (ctx.measureText(trimmedLine + '...').width > maxWidth && trimmedLine.length > 0) {
            trimmedLine = trimmedLine.slice(0, -1);
        }
        displayLines[2] = trimmedLine + '...';
    }
    return displayLines;
}
