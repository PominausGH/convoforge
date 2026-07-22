#!/usr/bin/env node
/**
 * One-shot: synthesise every lesson's avatar script via OpenAI TTS and write
 * the MP3s into apps/web/public/audio/lesson-<id>.mp3. Re-run after editing
 * lesson copy. Skips files that already exist unless --force is passed.
 *
 *   OPENAI_API_KEY=sk-... node scripts/generate-lesson-audio.mjs
 *   node scripts/generate-lesson-audio.mjs --force
 *   node scripts/generate-lesson-audio.mjs --only 3,7,12
 */
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CURRICULUM = join(ROOT, 'curriculum', 'sessions.json');
const OUT_DIR = join(ROOT, 'apps', 'web', 'public', 'audio');

const VOICE = process.env.OPENAI_TTS_VOICE || 'nova';
const MODEL = process.env.OPENAI_TTS_MODEL || 'tts-1';

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyIdx = args.indexOf('--only');
const onlyIds =
    onlyIdx >= 0 && args[onlyIdx + 1]
        ? new Set(args[onlyIdx + 1].split(',').map((s) => Number(s.trim())))
        : null;

async function loadEnv() {
    if (process.env.OPENAI_API_KEY) return;
    try {
        const raw = await readFile(join(ROOT, '.env'), 'utf8');
        for (const line of raw.split('\n')) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
            if (!m) continue;
            const [, k, v] = m;
            if (!process.env[k]) {
                process.env[k] = v.replace(/^['"]|['"]$/g, '');
            }
        }
    } catch {
        /* no .env, rely on process env */
    }
}

function buildLessonScript(lesson) {
    return [
        `Today's Carnegie principle: ${lesson.carnegie_principle}`,
        lesson.modern_context,
        `Your forge challenge: ${lesson.practice_prompt}`,
    ].join(' ');
}

async function fileExists(path) {
    try {
        await access(path, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

async function synth(text, apiKey) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            voice: VOICE,
            input: text,
            response_format: 'mp3',
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI TTS ${res.status}: ${body.slice(0, 300)}`);
    }
    return Buffer.from(await res.arrayBuffer());
}

async function main() {
    await loadEnv();
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
        console.error('OPENAI_API_KEY missing. Set it in .env or the environment.');
        process.exit(1);
    }

    await mkdir(OUT_DIR, { recursive: true });
    const lessons = JSON.parse(await readFile(CURRICULUM, 'utf8'));

    let generated = 0;
    let skipped = 0;
    for (const lesson of lessons) {
        if (onlyIds && !onlyIds.has(lesson.lesson_id)) continue;
        const outPath = join(OUT_DIR, `lesson-${lesson.lesson_id}.mp3`);
        if (!force && (await fileExists(outPath))) {
            skipped++;
            console.log(`· skip  lesson ${lesson.lesson_id} (exists)`);
            continue;
        }
        const script = buildLessonScript(lesson);
        process.stdout.write(`→ synth lesson ${lesson.lesson_id} (${script.length} chars)... `);
        const audio = await synth(script, apiKey);
        await writeFile(outPath, audio);
        generated++;
        console.log(`${(audio.length / 1024).toFixed(1)} KB`);
    }
    console.log(`\nDone. generated=${generated} skipped=${skipped} → ${OUT_DIR}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
