// adapter-static removes Vite's server manifest after prerendering. Serve the
// actual build (including clean .html URLs) rather than relying on vite preview.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('build');
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.xml': 'application/xml',
	'.ico': 'image/x-icon',
	'.wasm': 'application/wasm'
};
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex === -1 ? process.env.PORT || 4173 : process.argv[portIndex + 1]);

createServer(async (req, res) => {
	const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
	const target = resolve(root, `.${pathname}`);
	if (target !== root && !target.startsWith(root + sep)) {
		res.writeHead(403).end();
		return;
	}
	const candidates = pathname.endsWith('/')
		? [`${target}/index.html`]
		: [target, `${target}.html`, `${target}/index.html`];
	for (const file of candidates) {
		try {
			const contents = await readFile(file);
			res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
			res.end(contents);
			return;
		} catch (error) {
			if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
		}
	}
	res.writeHead(404, { 'Content-Type': types['.html'] });
	res.end(await readFile(resolve(root, '404.html')).catch(() => 'Not found'));
}).listen(port, () => console.log(`Serving build/ on http://localhost:${port}`));
