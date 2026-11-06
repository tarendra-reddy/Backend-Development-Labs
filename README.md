# Backend Development Labs

This repository contains independent Node.js lab projects for Backend Development Fundamentals:

```text
Backend/
├── lab-01/
├── lab-02/
└── lab-03/
```

## Lab 1

```powershell
cd lab-01
npm install
npm start
```

To run the plain Node.js HTTP server instead, use `node plain-server.js`.

## Lab 2

```powershell
cd lab-02
npm install
npm start
```

Lab 2 serves its book API at `http://localhost:3000/books/` by default. Set the
`PORT` environment variable to use a different port.

## Lab 3: REST API, Query Parameters, Validation and Debugging

Student: **Tarendra Reddy** (Reg No: **252U1R9157**)

```powershell
cd lab-03
npm install
npm start
```

Lab 3 extends Lab 2 with advanced query parameters (searching with `LIKE`, sorting with `ORDER BY`, pagination with `LIMIT` & `OFFSET`, price-range filtering), strict input validation, correct HTTP status codes, and debugging exercises. Serves at `http://localhost:3000/books`.

