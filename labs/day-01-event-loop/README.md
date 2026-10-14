# Day 01 — Node.js Event Loop: Can One Request Block a Server?

> **Beginner-friendly guided lab.** You don't need previous backend experience. We will build your understanding step by step, then you will complete one small piece of code yourself. The starter is intentionally incomplete.
>
> **Related:** [Learning Issue #3](https://github.com/FoushWare/fullstack-tech-lead-journey/issues/3) · [Coffee Break Web episode](https://app.notion.com/p/3f8dd0b9a267818e83b7c6bfb31c4000)

## What you'll learn

By the end you should be able to:
- Explain what a backend server, HTTP request, response, route, and port are.
- Start a native Node.js server without Express or external packages.
- Read a request handler and follow its execution.
- Explain what *synchronous*, *asynchronous*, *blocking*, and *non-blocking* mean.
- Demonstrate how CPU-heavy JavaScript in one request delays another.
- Explain the role of the main JavaScript thread, Event Loop, and Node.js runtime.
- Record evidence and discuss realistic mitigations.

**Time estimate:** 45–90 minutes, depending on your experience. Take your time.

---

## Part 0 — Understand the basics BEFORE writing code

### 0.1 What is a backend?

A frontend (for example React) runs in a user's browser and displays the interface. A backend receives requests, validates inputs, performs work (sometimes reads/writes a database), and sends responses.

For this lab:

```text
Terminal / Browser / React (client)
              |
              | HTTP request: GET /fast
              v
      Node.js server (backend)
              |
              | HTTP response: 200 + JSON
              v
         Client receives data
```

A **client** makes requests. A **server** listens for them.

### 0.2 HTTP vocabulary

| Term | Beginner explanation | In this lab |
| --- | --- | --- |
| HTTP | Rules for client/server communication | Your terminal uses `curl` to send requests |
| Request | Message sent to the server | `GET /fast` |
| Response | Message returned by the server | JSON body and status code |
| Method | Kind of operation | `GET` |
| Route / endpoint | Path the server handles | `/fast` or `/slow` |
| Port | Number used to reach the server process | `3000` |
| localhost / 127.0.0.1 | Your own computer | No public deployment |
| 200 | Successful HTTP response | `/fast` |
| 404 | Route not found | `/unknown` |
| 501 | Starter exercise not implemented yet | `/slow` before your work |
| JSON | Common text format for structured data | `{"route":"/fast"}` |

**Think about it:** Why does the same server respond differently to `/fast` and `/unknown`?

### 0.3 What is Node.js?

Node.js runs JavaScript outside the browser. It can create an HTTP server using the built-in `node:http` module. We deliberately use **no Express** so you can see the fundamentals.

**Important distinction:** JavaScript request callbacks normally execute on the **main JavaScript thread**. Node.js also uses operating-system facilities and libuv for asynchronous I/O, and can use Worker Threads for separate JavaScript execution. Saying "Node.js is entirely single-threaded" is inaccurate.

### 0.4 Blocking vs non-blocking

- **Synchronous CPU-heavy work:** keeps the JavaScript thread busy until it finishes; other JavaScript callbacks cannot execute on that thread in the meantime.
- **Asynchronous I/O:** can wait for an operation without keeping JavaScript busy for the entire wait.
- Adding `async` to a function **does not** automatically move synchronous CPU work to another thread.
- `setTimeout` schedules a callback; it is **not** a worker thread and cannot interrupt a busy JavaScript thread.

**Checkpoint:** Can you explain the difference between *waiting for I/O* and *actively using the CPU* in one sentence?

---

## Part 1 — Prepare your computer

### Step 1 — Check Node.js and npm

Open your terminal:

```bash
node --version
npm --version
```

You need **Node.js 20 or later**. If `node` is not found, install an appropriate supported Node.js release from [nodejs.org](https://nodejs.org/en/download) and reopen the terminal.

`npm` is Node.js's package manager. We won't download any third-party packages for this lab, but npm can run scripts defined in `package.json`.

### Step 2 — Get the correct branch

If you haven't cloned the repository:

```bash
git clone https://github.com/FoushWare/fullstack-tech-lead-journey.git
cd fullstack-tech-lead-journey
git switch learning/day-01-event-loop-starter
```

If you already cloned it:

```bash
cd fullstack-tech-lead-journey
git fetch origin
git switch learning/day-01-event-loop-starter
git pull --ff-only
```

If you have local changes, review them before switching or pulling; don't discard your work.

### Step 3 — Explore the files

```text
fullstack-tech-lead-journey/
├── package.json
├── .gitignore
└── labs/
    └── day-01-event-loop/
        ├── server.js       <-- code you will read and edit
        └── README.md       <-- these instructions
```

Open `package.json`. Find the scripts:
- `npm start` — starts the server.
- `npm run dev` — starts it with watch mode so Node restarts on file changes.
- `npm run check` — checks JavaScript syntax; **it does not prove behavior is correct**.

Run:

```bash
npm run check
```

**Expected:** the command finishes without a syntax error. If it fails, read the error and file/line number.

**Checkpoint:** Why is there no `npm install` step? (Hint: only Node.js built-in modules are used.)

---

## Part 2 — Start your first backend server

### Step 4 — Run the server

**Terminal A:**

```bash
npm start
```

**Expected startup message:**

```text
Learning lab: http://127.0.0.1:3000
TODO 5: Compare /fast alone and while /slow is running.
```

Leave this terminal running. The process is listening for incoming requests. To stop it later, press `Ctrl+C`.

### Step 5 — Send your first HTTP request

Open **Terminal B** (a second terminal window or tab):

```bash
curl -i http://127.0.0.1:3000/fast
```

What to look for:
1. The URL points to your own machine (`127.0.0.1`) on port `3000`.
2. The path is `/fast`.
3. The status should be **200**.
4. The response body should contain JSON with `route`, `message`, and `durationMs`.
5. Terminal A should log the request.

Try:

```bash
curl -i http://127.0.0.1:3000/unknown
curl -i http://127.0.0.1:3000/slow
```

**Expected:** `/unknown` returns **404**; `/slow` returns **501** because your assignment is not implemented yet. These are deliberate starter behaviors, not installation errors.

**Checkpoint:** Explain why `/fast` returns 200 but `/slow` returns 501.

---

## Part 3 — Read the code like a backend developer

Open `labs/day-01-event-loop/server.js`. Read it **top to bottom**:

1. `import { createServer } from 'node:http'` imports Node's built-in HTTP server function.
2. `PORT` reads `process.env.PORT` if set, otherwise defaults to 3000.
3. `createServer((req, res) => { ... })` registers a function Node calls when an HTTP request is handled.
4. `req` contains incoming request information, such as `req.url` and `req.method`.
5. `res` is used to send a response back to the client.
6. `new URL(...).pathname` extracts the route path.
7. `performance.now()` gives a monotonic clock useful for measuring elapsed durations.
8. `reply(statusCode, body)` writes an HTTP status and JSON body, then ends the response.
9. `if (path === '/fast')` and `if (path === '/slow')` choose which behavior to execute.
10. `server.listen(PORT, '127.0.0.1', ...)` starts listening **locally**, not on a public network interface.

**Important:** The `durationMs` value in the response measures the time **inside the request handler after it starts executing**. If the Event Loop is blocked *before* the `/fast` handler begins, this value may still look small! To observe that delay, use the client-side `curl -w '%{time_total}'` timing below. This difference is central to the experiment.

**Checkpoint:** In your own words, what happens between `curl /fast` and `res.end(...)`?

---

## Part 4 — Establish a baseline (before blocking)

### Step 6 — Measure /fast alone

With Terminal A still running, use Terminal B:

```bash
curl -sS -o /dev/null -w 'fast total=%{time_total}s\n' http://127.0.0.1:3000/fast
```

Run it **three times**. `curl`'s `time_total` measures total elapsed time from the client perspective.

Write your three real measurements in the experiment journal. Do not invent a benchmark or expect exact numbers; timings depend on your machine.

**Checkpoint:** What's the difference between the server's `durationMs` and the client's `time_total`?

---

## Part 5 — Your coding assignment (don't skip!)

### Step 7 — Implement the blocking /slow route

In `server.js`, find:

```js
if (path === '/slow') {
  // TODO 3: IMPLEMENT about 5 seconds of synchronous CPU work here.
  // ...
}
```

**Your task:** add a synchronous loop that keeps the JavaScript main thread busy for approximately five seconds.

Hints, **not the completed solution**:
1. Record a starting time with `performance.now()`.
2. Compute a deadline about 5000 milliseconds later.
3. Use a `while` loop whose condition checks whether that deadline has passed.
4. Don't use `await`, `setTimeout`, `setInterval`, `Promise.all`, or Worker Threads in this first blocking experiment.
5. After the loop finishes, change the placeholder `reply(501, ...)` to a successful `reply(200, ...)` with a meaningful message.

**Safety:** This loop is intentionally inefficient. Run it **only on your local lab server**; do not copy it into production request handlers. Keep the server bound to `127.0.0.1`.

Run `npm run check` again, then restart `npm start` if needed.

**Checkpoint:** Before testing, predict whether `/fast` can respond while the loop is running. Write your hypothesis down.

---

## Part 6 — Reproduce the Event Loop blocking behavior

### Step 8 — Test /slow on its own

```bash
curl -sS -w '\nslow total=%{time_total}s\n' http://127.0.0.1:3000/slow
```

After your implementation, you should get a successful response after roughly the duration of your synchronous loop. This is an **expected hypothesis**, not a measured result.

### Step 9 — Start /slow and request /fast while it's busy

With the server running in Terminal A, use **Terminal B**:

```bash
curl -sS -w '\nslow total=%{time_total}s\n' http://127.0.0.1:3000/slow &
sleep 0.2
curl -sS -w '\nfast total=%{time_total}s\n' http://127.0.0.1:3000/fast
wait
```

What these commands mean:
- `&` runs the first `curl` process in the background so the shell can continue.
- `sleep 0.2` gives the slow request a small head start. It does **not** guarantee scheduling order on every machine.
- The second `curl` requests `/fast`.
- `wait` waits for the background command to finish.

**Observe rather than assume:** What order do the responses arrive in? What does Terminal A log? How long does `/fast` take from the client's perspective?

If the result doesn't reproduce, confirm your loop is synchronous, `/slow` returns 200, both requests target the **same server process**, and the slow handler started before the fast request.

### Step 10 — Explain the mechanism

Fill this in **using your own words**:

```text
When /slow begins, the main JavaScript thread is ...
When /fast arrives, its JavaScript request handler ...
After /slow completes, the Event Loop can ...
```

Don't confuse waiting for a request handler to run with network transmission time.

---

## Part 7 — Go deeper (no extra implementation yet)

### Step 11 — Answer these interview questions

1. Is Node.js completely single-threaded? Explain the distinction.
2. Why does a CPU-bound synchronous loop block other JavaScript handlers?
3. If I mark the handler `async`, does the loop become non-blocking? Why?
4. If a `setTimeout(fn, 100)` timer is due while the main thread is blocked, when can `fn` run?
5. Why can a database query or file read be asynchronous without blocking the main JavaScript thread for the whole operation?
6. When might Worker Threads help? What costs do they introduce?
7. Why doesn't splitting an application into Microservices automatically fix CPU blocking within an individual service?

### Step 12 — Research mitigations

For each, write **one benefit and one trade-off**:
- Non-blocking APIs for I/O.
- Worker Threads for CPU-bound JavaScript.
- Child processes / separate services.
- Chunking computation to periodically yield to the Event Loop.

**Do not implement all four now.** That would distract from the Day 01 objective.

---

## Part 8 — Record evidence and connect it to Coffee Break Web

### Step 13 — Complete the learning journal

| Experiment | Node version | Client-side /fast time | /slow behavior | What you observed |
| --- | --- | --- | --- | --- |
| /fast baseline, run 1 | TODO | TODO | Not running | TODO |
| /fast baseline, run 2 | TODO | TODO | Not running | TODO |
| /fast baseline, run 3 | TODO | TODO | Not running | TODO |
| /fast during /slow | TODO | TODO | ~5s synchronous loop | TODO |

Write a 3–5 sentence explanation, paste relevant terminal output, and link your implementation commit or PR to [Issue #3](https://github.com/FoushWare/fullstack-tech-lead-journey/issues/3).

### Step 14 — Plan your Coffee Break Web demo

Suggested **demo-first** shot:
1. Show `/slow` running.
2. Trigger `/fast` and capture the real client-side delay.
3. Freeze the frame on the verified output.
4. Explain the Call Stack / Event Loop visually.
5. End with the takeaway: **one blocking handler can delay unrelated handlers in the same Node.js process**.

The video script is **not yet approved**. First verify your actual demo, then plan the scenes and record one scene at a time.

---

## Completion checklist

- [ ] I can explain request, response, route, port and HTTP status.
- [ ] I can start the server and test it with curl.
- [ ] I understand the server.js code line by line.
- [ ] I implemented /slow myself.
- [ ] I measured /fast alone and while /slow is running.
- [ ] I understand why server-side durationMs may not reveal queueing delay.
- [ ] I explained the Event Loop and blocking behavior accurately.
- [ ] I documented results and mitigation trade-offs.
- [ ] I updated Issue #3 with evidence and a learning journal entry.

## Further reading

- [Node.js — The Event Loop, Timers, and process.nextTick](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
- [Node.js — Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
- [Lydia Hallie — JavaScript Visualized: Event Loop](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif)

Lydia Hallie's article is an excellent **browser JavaScript** visualization reference. Node.js uses its own libuv Event Loop phases and runtime mechanisms, so the browser model is not a complete description of Node.js.
