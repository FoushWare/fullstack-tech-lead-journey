# Day 01 — Event Loop: Can a request block the server?

Related: [Issue #3](https://github.com/FoushWare/fullstack-tech-lead-journey/issues/3).

**This is an intentionally incomplete learning starter.** The `/slow` endpoint returns HTTP 501 until you complete its TODOs.

## Setup

Requires Node.js 20+.

```bash
npm run check
npm start
```

No npm installation is needed: this lab uses Node.js built-in modules only.

Open another terminal:

```bash
curl -i http://127.0.0.1:3000/fast
curl -i http://127.0.0.1:3000/slow
```

## Step-by-step tasks

- [ ] **1 — Understand the starter:** Explain `createServer`, `listen`, routing, `reply()`, and where callbacks execute.
- [ ] **2 — Baseline:** Make several `/fast` requests. Record real observations.
- [ ] **3 — Implement blocking:** Put roughly 5 seconds of *synchronous CPU work* in the `/slow` handler. Use `performance.now()` and a tight loop, not a timer.
- [ ] **4 — Mark completion:** Change the placeholder HTTP 501 to HTTP 200 after the blocking loop.
- [ ] **5 — Reproduce:** Start `/slow`, then call `/fast` while the first handler is executing.
- [ ] **6 — Explain:** Why does `/fast` wait? Distinguish main JavaScript thread from Node.js runtime mechanisms.
- [ ] **7 — Mitigations:** Research non-blocking I/O, Worker Threads, processes and CPU work chunking. Document trade-offs.
- [ ] **8 — Teaching:** Explain the result aloud and prepare one verified Coffee Break Web demo.

## Two-terminal experiment

Terminal A:

```bash
npm start
```

Terminal B, **after** completing TODO 3 and TODO 4:

```bash
curl -sS -w '\nslow total=%{time_total}s\n' http://127.0.0.1:3000/slow &
sleep 0.2
curl -sS -w '\nfast total=%{time_total}s\n' http://127.0.0.1:3000/fast
wait
```

Check response order and measured timing; do not assume results before running it.

## Learning questions

1. Is Node.js entirely single threaded?
2. Does `async` make synchronous CPU work non-blocking?
3. What happens if the timer is ready while JavaScript is busy?
4. What is the difference between asynchronous I/O and parallel CPU work?
5. When would you use Worker Threads rather than another microservice?

## Experiment log

| Test | Node version | /slow behavior | /fast observed timing | Notes |
| --- | --- | --- | --- | --- |
| Baseline | TODO | None | TODO | TODO |
| Blocking | TODO | CPU loop | TODO | TODO |

## References

- [Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Lydia Hallie — JavaScript Visualized: Event Loop](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif)

Lydia's explanation is a useful conceptual reference for browser JavaScript. Node.js's libuv phases are not identical to the browser runtime.
