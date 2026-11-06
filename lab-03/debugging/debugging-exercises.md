# BDF Lab 3 – Debugging Common Backend & Database Errors

**Course:** Backend Development Fundamentals  
**Lab Number:** 03  
**Student Name:** Tarendra Reddy  
**Registration Number:** 252U1R9157  
**Academic Year:** Year II, Term II  
**University:** Aurora Deemed University  
**Faculty:** Joel Prashanth D  

---

## Overview

Debugging is one of the most critical skills in backend software development. In this laboratory module, we investigate four common runtime, configuration, and syntax errors that second-year engineering students frequently encounter when developing REST APIs using Node.js, Express.js, and SQLite:

1. `EADDRINUSE` (Port Conflict)
2. `MODULE_NOT_FOUND` (Wrong Module / Import Path)
3. `SQLITE_ERROR: no such table` (Database Table-Name Typo)
4. Missing `await` (Asynchronous Database Promise Handling)

Each exercise below documents the **Problem**, the **Incorrect Code or Command**, the exact **Error Message**, the **Corrected Code**, and an in-depth **Technical Explanation** suitable for laboratory exams and practical evaluations.

---

## Exercise 1: `EADDRINUSE` (Port Conflict)

### 1. Problem
When starting the Express server, Node.js throws an unhandled exception indicating `EADDRINUSE`. This occurs when the specified network port (e.g., port `3000`) is already bound to another active process or a previously running instance of the same application.

### 2. Incorrect Code / Scenario
Attempting to start the application with a hardcoded port when another instance is already listening on `3000`:

```javascript
// server.js
const port = 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
```

Running the start command again in another terminal window:
```bash
node server.js
```

### 3. Error Message
```text
node:events:497
      throw er; // Unhandled 'error' event
      ^

Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    at startServer (C:\Users\nandu\Desktop\tarendra bdf\lab-03\server.js:14:9)
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:1940:8)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

### 4. Corrected Code & Solutions

#### Solution A: Make the Port Configurable via Environment Variables
Allow dynamically changing the port through `process.env.PORT`:

```javascript
// server.js - Corrected
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
```

To run on an alternate free port without changing code:
```bash
# Windows PowerShell
$env:PORT=3001; node server.js

# Command Prompt
set PORT=3001 && node server.js

# Linux / macOS / Bash
PORT=3001 node server.js
```

#### Solution B: Identify and Terminate the Conflicting Process

**On Windows (PowerShell / Command Prompt):**
```powershell
# 1. Identify which process is holding port 3000
netstat -ano | findstr :3000

# Example output:
# TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       14820

# 2. Terminate the process using its PID (Process ID)
taskkill /F /PID 14820
```

**On Linux / macOS:**
```bash
# 1. Locate the PID
lsof -i :3000

# 2. Terminate the process
kill -9 <PID>
```

### 5. Explanation
An operating system assigns network sockets uniquely by protocol and port number. When an application binds to `0.0.0.0:3000` or `:::3000`, the operating system reserves that TCP socket exclusively. Any secondary attempt to bind to the identical socket raises the POSIX network error code `EADDRINUSE` (`Error: Address Already In Use`). The solution is either terminating the zombie process or providing a fallback port via environment configuration.

---

## Exercise 2: `MODULE_NOT_FOUND` (Wrong Import Path)

### 1. Problem
Node.js fails during module resolution because the relative file path supplied to `require()` is misspelled, refers to a non-existent folder, or omits the mandatory `./` or `../` prefix for local files.

### 2. Incorrect Code
```javascript
// server.js (Incorrect module path)
const express = require('express')
const { initializeDB } = require('./db/database') // Incorrect: database.js is in the root directory!
```
or:
```javascript
const { initializeDB } = require('database') // Incorrect: Missing './' causes Node to look in node_modules/
```

### 3. Error Message
```text
node:internal/modules/cjs/loader:1459
  throw err;
  ^

Error: Cannot find module './db/database'
Require stack:
- C:\Users\nandu\Desktop\tarendra bdf\lab-03\server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1456:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1066:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1071:22)
    at Module._load (node:internal/modules/cjs/loader:1242:25)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.require (node:internal/modules/cjs/loader:1556:12)
    at require (node:internal/modules/helpers:152:16)
    at Object.<anonymous> (C:\Users\nandu\Desktop\tarendra bdf\lab-03\server.js:2:26) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [ 'C:\\Users\\nandu\\Desktop\\tarendra bdf\\lab-03\\server.js' ]
}
```

### 4. Corrected Code
```javascript
// server.js (Corrected)
const express = require('express')
const { initializeDB } = require('./database') // Correct relative path in the same directory
```

### 5. Explanation
Node.js CommonJS module resolution differentiates between external packages and local project files:
- If a path does **not** begin with `./` or `../`, Node.js searches the `node_modules` directory and core built-in modules (e.g., `fs`, `path`).
- If a path begins with `./` or `../`, Node.js resolves relative to the current file's directory.
Specifying an invalid path or omitting `./` causes the file system resolver to fail and throw `MODULE_NOT_FOUND`.

---

## Exercise 3: `SQLITE_ERROR: no such table` (Table-Name Typo)

### 1. Problem
An SQL query fails at runtime because the referenced table name does not exist in the connected SQLite database. This typically happens when developers pluralize table names (e.g., `books` instead of `book`) or make spelling mistakes.

### 2. Incorrect Code
```javascript
// server.js (Typo in SQL table name: "books" instead of "book")
app.get('/books', async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM books; -- Incorrect! Schema defines table as "book", not "books"
    `
    const books = await db.all(getBooksQuery)
    response.status(200).send(books)
  } catch (error) {
    console.error(error.message)
    response.status(500).send({ error: error.message })
  }
})
```

### 3. Error Message
```text
SQLITE_ERROR: no such table: books
--> in Database#all('SELECT * FROM books;', ...)
```

The HTTP client (Postman/browser) receives:
```json
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "SQLITE_ERROR: no such table: books"
}
```

### 4. Corrected Code
```javascript
// server.js (Corrected)
app.get('/books', async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book; -- Corrected to match CREATE TABLE book
    `
    const books = await db.all(getBooksQuery)
    response.status(200).send(books)
  } catch (error) {
    console.error(error.message)
    response.status(500).send({ error: 'Internal Server Error' })
  }
})
```

### 5. Explanation
SQLite creates an internal master table catalog (`sqlite_schema` / `sqlite_master`). Whenever an SQL query is prepared, SQLite validates all referenced table and column identifiers against the registered schema. If an identifier is not found, SQLite halts query execution and returns `SQLITE_ERROR: no such table: <name>`. Developers must ensure that all queries strictly adhere to the table name defined in `database.js` (`CREATE TABLE IF NOT EXISTS book ...`).

---

## Exercise 4: Missing `await` (Asynchronous Database Promise)

### 1. Problem
Methods on the `sqlite` database wrapper (such as `db.all()`, `db.get()`, and `db.run()`) perform asynchronous I/O and return a JavaScript `Promise`. Omitting the `await` keyword causes the execution to continue immediately without waiting for the database to complete the operation.

### 2. Incorrect Code
```javascript
// server.js (Missing await before db.all)
app.get('/books', async (request, response) => {
  try {
    const getBooksQuery = `SELECT * FROM book;`
    
    // Bug: Missing 'await' here
    const books = db.all(getBooksQuery)
    
    // At this point, `books` is Promise { <pending> }
    console.log('Books value:', books)
    
    // Express serializes a pending Promise into an empty object {}
    response.status(200).send(books)
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})
```

### 3. Error / Bug Behavior
- In the server console:
  ```text
  Books value: Promise { <pending> }
  ```
- In Postman / Client response:
  ```json
  HTTP/1.1 200 OK
  Content-Type: application/json

  {}
  ```
- If downstream code attempts to read array properties (e.g. `books.length` or `books.map(...)`), Node throws:
  ```text
  TypeError: books.map is not a function
      at ...
  ```

### 4. Corrected Code
```javascript
// server.js (Corrected with await)
app.get('/books', async (request, response) => {
  try {
    const getBooksQuery = `SELECT * FROM book;`
    
    // Corrected: 'await' pauses handler until Promise resolves with data
    const books = await db.all(getBooksQuery)
    
    console.log(`Fetched ${books.length} books successfully.`)
    response.status(200).send(books)
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})
```

### 5. Explanation
Node.js operates on a single-threaded event loop with non-blocking I/O. Database calls take non-zero time to access the file system disk. The `sqlite` library wraps these I/O operations in Promises. When `await` is used inside an `async` function, JavaScript halts the local execution frame until the Promise settles into either resolved data or rejected error. Without `await`, the code proceeds synchronously with the unsettled `Promise` reference, leading to empty JSON outputs (`{}`), undefined properties, or unhandled promise rejections.

---

## Summary Reference Table for Practical Viva

| Error Category | Typical Trigger | Symptom / Message | Primary Fix |
|---|---|---|---|
| **EADDRINUSE** | Two servers on port 3000 | `Error: listen EADDRINUSE :::3000` | Kill process via PID or change `PORT=3001` |
| **MODULE_NOT_FOUND** | Typo or missing `./` in path | `Cannot find module './db/database'` | Correct relative path: `require('./database')` |
| **SQLITE_ERROR** | Schema mismatch (`books` vs `book`) | `SQLITE_ERROR: no such table: books` | Align query table name with `CREATE TABLE book` |
| **Missing `await`** | Omitted `await db.all(...)` | Empty response `{}` or pending Promise | Add `await` before asynchronous database calls |

