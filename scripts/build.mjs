import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const [html, threeLicense] = await Promise.all([
  readFile(join(root, 'index.html'), 'utf8'),
  readFile(new URL('../LICENSE', import.meta.resolve('three')), 'utf8'),
]);
const stylesheet = '<link rel="stylesheet" href="style.css" />';
const deferredScript = /^ +<script defer src="([a-z0-9-]+\.js)"><\/script>\r?\n/gm;
const scripts = Array.from(html.matchAll(deferredScript), (match) => match[1]);
const scriptCount = [...html.matchAll(/<script\b/gi)].length;
if (!html.includes(stylesheet) || scripts.length === 0 || scripts.length !== scriptCount) {
  throw new Error('Expected the stylesheet and ordered classic scripts in index.html.');
}

const [styles, ...sources] = await Promise.all(
  ['style.css', ...scripts].map((name) => readFile(join(root, name), 'utf8')),
);
const [js, css, runtime] = await Promise.all([
  // Keep the same initialization order as the local file:// version of the game.
  transform(sources.join('\n;\n'), {
    loader: 'js',
    minify: true,
    sourcefile: 'fluff.js',
  }),
  transform(styles, { loader: 'css', minify: true, sourcefile: 'style.css' }),
  build({
    entryPoints: [join(root, 'scripts/three-runtime.mjs')],
    bundle: true,
    minify: true,
    legalComments: 'inline',
    banner: { js: `/*!\n${threeLicense.trim()}\n*/` },
    write: false,
    format: 'iife',
    globalName: 'FluffThree',
  }),
]);

const hashedName = (extension, code) => {
  const hash = createHash('sha256').update(code).digest('hex').slice(0, 16);
  return `fluff-${hash}.${extension}`;
};
const jsName = hashedName('js', js.code);
const cssName = hashedName('css', css.code);
const three = runtime.outputFiles[0].text;
const threeName = hashedName('js', three);
const entry = html
  .replace(deferredScript, '')
  .replace(
    stylesheet,
    `<link rel="stylesheet" href="${cssName}" />\n    <script defer src="${threeName}"></script>\n    <script defer src="${jsName}"></script>`,
  );

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(join(output, 'index.html'), entry),
  writeFile(join(output, jsName), js.code),
  writeFile(join(output, threeName), three),
  writeFile(join(output, cssName), css.code),
  cp(join(root, 'assets'), join(output, 'assets'), { recursive: true }),
]);
