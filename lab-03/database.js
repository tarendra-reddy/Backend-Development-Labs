const path = require('path')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'database.db')

/**
 * Initializes the SQLite database connection, ensures the book table exists,
 * and seeds the initial 10 records if the table is empty.
 */
const initializeDB = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })

  // Create table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `)

  // Check if records already exist to prevent duplicate seed insertion on server restart
  const rowCount = await db.get(`SELECT COUNT(*) AS count FROM book;`)
  if (rowCount.count === 0) {
    await db.exec(`
      INSERT INTO book (title, author, price, pages) VALUES
      ('The Pragmatic Programmer', 'Andrew Hunt & David Thomas', 45, 352),
      ('Clean Code', 'Robert C. Martin', 40, 464),
      ('JavaScript: The Good Parts', 'Douglas Crockford', 30, 176),
      ('Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 55, 395),
      ('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', 85, 1312),
      ('You Don''t Know JS Yet', 'Kyle Simpson', 25, 142),
      ('Designing Data-Intensive Applications', 'Martin Kleppmann', 50, 616),
      ('Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 48, 448),
      ('Node.js Design Patterns', 'Mario Casciaro & Luciano Mammino', 42, 520),
      ('Eloquent JavaScript', 'Marijn Haverbeke', 35, 472);
    `)
    console.log('Database initialized and seeded with 10 records.')
  }

  return db
}

module.exports = { initializeDB }

