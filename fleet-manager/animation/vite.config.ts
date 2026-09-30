import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';

const animationRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(animationRoot, '..');

const TYPES: Record<string, string> = { '.json': 'application/json', '.wav': 'audio/wav', '.png': 'image/png', '.txt': 'text/plain' };

/** Serve files from the project root under /project/* (timeline.json, audio …), uncached. */
function projectFiles(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = path.resolve(projectRoot, '.' + rel);
    if (!file.startsWith(projectRoot + path.sep)) return next();
    readFile(file).then(
      (buf) => {
        res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store');
        res.end(buf);
      },
      () => {
        res.statusCode = 404;
        res.end();
      },
    );
  };
  return {
    name: 'project-files',
    configureServer: (server) => void server.middlewares.use('/project', handler),
    configurePreviewServer: (server) => void server.middlewares.use('/project', handler),
  };
}

export default defineConfig({
  root: animationRoot,
  plugins: [projectFiles()],
  server: { fs: { allow: [projectRoot] } },
  clearScreen: false,
});
