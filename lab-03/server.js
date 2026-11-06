const express = require('express')
const { initializeDB } = require('./database')

const app = express()
app.use(express.json())

const port = process.env.PORT || 3000
let db = null

// Initialize database connection and start listening
const startServer = async () => {
  try {
    db = await initializeDB()
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.log(`Database initialization error: ${error.message}`)
    process.exit(1)
  }
}

startServer()

// ============================================================================
// API 1: GET /books - Retrieve books with query parameters
// Supports: search_q, order_by, order, limit, offset, min_price, max_price
// ============================================================================
app.get('/books', async (request, response) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = request.query

    // 1. Validate order_by against an allowlist to prevent SQL injection
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages']
    const normalizedOrderBy = String(order_by).toLowerCase()
    if (!allowedColumns.includes(normalizedOrderBy)) {
      return response.status(400).send({
        error: `Invalid order_by column. Allowed fields: ${allowedColumns.join(', ')}`,
      })
    }

    // 2. Validate order direction against an allowlist
    const normalizedOrder = String(order).toUpperCase()
    if (!['ASC', 'DESC'].includes(normalizedOrder)) {
      return response.status(400).send({
        error: 'Invalid order direction. Allowed values: ASC, DESC',
      })
    }

    // 3. Validate numeric pagination parameters
    const parsedLimit = Number(limit)
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
      return response.status(400).send({
        error: 'limit must be a non-negative integer',
      })
    }

    const parsedOffset = Number(offset)
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      return response.status(400).send({
        error: 'offset must be a non-negative integer',
      })
    }

    // 4. Validate min_price and max_price if provided
    let parsedMinPrice = null
    let parsedMaxPrice = null

    if (min_price !== undefined) {
      parsedMinPrice = Number(min_price)
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return response.status(400).send({
          error: 'min_price must be a non-negative number',
        })
      }
    }

    if (max_price !== undefined) {
      parsedMaxPrice = Number(max_price)
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return response.status(400).send({
          error: 'max_price must be a non-negative number',
        })
      }
    }

    // Check that minimum price does not exceed maximum price
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return response.status(400).send({
        error: 'min_price cannot exceed max_price',
      })
    }

    // 5. Construct parameterized SQL query
    const conditions = ['title LIKE ?']
    const sqlParams = [`%${search_q}%`]

    if (parsedMinPrice !== null) {
      conditions.push('price >= ?')
      sqlParams.push(parsedMinPrice)
    }

    if (parsedMaxPrice !== null) {
      conditions.push('price <= ?')
      sqlParams.push(parsedMaxPrice)
    }

    const whereClause = conditions.join(' AND ')
    const getBooksQuery = `
      SELECT *
      FROM book
      WHERE ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `
    sqlParams.push(parsedLimit, parsedOffset)

    const books = await db.all(getBooksQuery, sqlParams)
    response.status(200).send(books)
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})

// ============================================================================
// API 2: GET /books/:bookId - Retrieve an individual book by ID
// ============================================================================
app.get('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const id = Number(bookId)

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).send({
        error: 'Invalid bookId. Must be a positive integer',
      })
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `
    const book = await db.get(getBookQuery, [id])

    if (!book) {
      return response.status(404).send({ error: 'Book Not Found' })
    }

    response.status(200).send(book)
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})

// ============================================================================
// API 3: POST /books - Insert a new book record
// ============================================================================
app.post('/books', async (request, response) => {
  try {
    const { title, author, price, pages } = request.body

    // Input Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).send({
        error: 'Title is required and cannot be empty',
      })
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).send({
        error: 'Author is required and cannot be empty',
      })
    }

    if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
      return response.status(400).send({
        error: 'Price must be a valid non-negative number',
      })
    }

    if (pages === undefined || pages === null || pages === '' || isNaN(Number(pages)) || !Number.isInteger(Number(pages)) || Number(pages) <= 0) {
      return response.status(400).send({
        error: 'Pages must be a positive integer',
      })
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `
    await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
    ])

    response.status(201).send({
      message: 'Book Added Successfully',
    })
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})

// ============================================================================
// API 4: PUT /books/:bookId - Update an existing book record
// ============================================================================
app.put('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const id = Number(bookId)

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).send({
        error: 'Invalid bookId. Must be a positive integer',
      })
    }

    const { title, author, price, pages } = request.body

    // Input Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return response.status(400).send({
        error: 'Title is required and cannot be empty',
      })
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return response.status(400).send({
        error: 'Author is required and cannot be empty',
      })
    }

    if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
      return response.status(400).send({
        error: 'Price must be a valid non-negative number',
      })
    }

    if (pages === undefined || pages === null || pages === '' || isNaN(Number(pages)) || !Number.isInteger(Number(pages)) || Number(pages) <= 0) {
      return response.status(400).send({
        error: 'Pages must be a positive integer',
      })
    }

    // Check whether the book exists
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`
    const existingBook = await db.get(checkBookQuery, [id])

    if (!existingBook) {
      return response.status(404).send({ error: 'Book Not Found' })
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Number(pages),
      id,
    ])

    response.status(200).send({
      message: 'Book Details Updated',
    })
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})

// ============================================================================
// API 5: DELETE /books/:bookId - Delete a book record by ID
// ============================================================================
app.delete('/books/:bookId', async (request, response) => {
  try {
    const { bookId } = request.params
    const id = Number(bookId)

    if (!Number.isInteger(id) || id <= 0) {
      return response.status(400).send({
        error: 'Invalid bookId. Must be a positive integer',
      })
    }

    // Check whether the book exists
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`
    const existingBook = await db.get(checkBookQuery, [id])

    if (!existingBook) {
      return response.status(404).send({ error: 'Book Not Found' })
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `
    await db.run(deleteBookQuery, [id])

    response.status(200).send({
      message: 'Book Deleted Successfully',
    })
  } catch (error) {
    response.status(500).send({ error: 'Internal Server Error' })
  }
})

module.exports = app

