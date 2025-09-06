import {existsSync, cpSync} from 'fs';
import {join} from 'path';

const src = join(process.cwd(), '.generated');
const dest = join(process.cwd(), 'dist');

if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`✅ Copied all files from .generated to dist/, preserving structure.`);
} else {
    console.warn(`⚠️ No .generated directory found. Skipped copying.`);
}
