import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 3000);

/**
 * Day 01: Complete TODOs in sequence. This is deliberately NOT a solution.
 * CPU-heavy synchronous JavaScript runs on the main JS thread and can
 * delay unrelated request handlers. A timer does not create a new thread.
 */
const server = createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const start = performance.now();

  console.log(`[request:start] ${req.method} ${path}`);

  // TODO 1: Read this helper. What does writeHead do?
  function reply(statusCode, body) {
    res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ...body, durationMs: Math.round(performance.now() - start) }));
  }

  if (path === '/fast') {
    // TODO 2: Record how this endpoint behaves on its own.
    reply(200, { route: '/fast', message: 'Fast response' });
    return;
  }

  if (path === '/slow') {
    // TODO 3: IMPLEMENT about 5 seconds of synchronous CPU work here.
    // Hint: compare performance.now() against a deadline in a tight loop.
    // Do NOT use await or setTimeout for the first experiment.
    // WARNING: Deliberately blocking code — use ONLY on localhost.

    // TODO 4: After adding the loop, return HTTP 200 rather than 501.
    reply(501, { route: '/slow', message: 'TODO: implement blocking CPU work' });
    return;
  }

  reply(404, { error: 'Not found', availableRoutes: ['/fast', '/slow'] });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Learning lab: http://127.0.0.1:${PORT}`);
  console.log('TODO 5: Compare /fast alone and while /slow is running.');
});
