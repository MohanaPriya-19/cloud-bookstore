const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const SQLITE_FILE = path.join(DB_DIR, 'bookstore.sqlite');

class SqlDatabase {
  constructor() {
    this.db = null;
    this.changeListeners = [];
  }

  // Register listener for real-time broadcasts
  onDatabaseChange(callback) {
    this.changeListeners.push(callback);
  }

  notifyChange(eventType, details = {}) {
    for (const listener of this.changeListeners) {
      try {
        listener({ eventType, timestamp: new Date().toISOString(), details });
      } catch (err) {
        console.error('Error notifying change listener:', err);
      }
    }
  }

  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(SQLITE_FILE, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err);
          return reject(err);
        }
        console.log(`Connected to SQLite SQL Database at ${SQLITE_FILE}`);
        this.createTables()
          .then(() => this.seedInitialData())
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createTables() {
    // 1. Books Table
    await this.run(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL,
        isbn TEXT,
        rating REAL DEFAULT 4.5,
        published_year INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Orders Table
    await this.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        payment_method TEXT DEFAULT 'Credit/Debit Card',
        notes TEXT,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Order Items Table
    await this.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        title TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id)
      )
    `);
  }

  async seedInitialData() {
    const bookCount = await this.get('SELECT COUNT(*) as count FROM books');
    if (bookCount && bookCount.count > 0) {
      return; // Already seeded
    }

    console.log('Seeding initial SQL books and customer orders...');

    const sampleBooks = [
      {
        id: "BK-101",
        title: "Cloud Computing: Concepts, Technology & Architecture",
        author: "Thomas Erl, Ricardo Puttini",
        category: "Cloud Computing",
        price: 49.99,
        stock: 18,
        isbn: "978-0133387520",
        rating: 4.8,
        published_year: 2023,
        description: "The definitive guide to understanding cloud computing architectural models, cloud infrastructure mechanisms, and cloud security frameworks."
      },
      {
        id: "BK-102",
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        category: "Data Science",
        price: 42.50,
        stock: 12,
        isbn: "978-1449373320",
        rating: 4.9,
        published_year: 2022,
        description: "An indispensable handbook for software architects and engineers navigating the complex landscape of distributed data systems."
      },
      {
        id: "BK-103",
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        author: "Robert C. Martin",
        category: "Software Engineering",
        price: 37.95,
        stock: 25,
        isbn: "978-0132350884",
        rating: 4.7,
        published_year: 2021,
        description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Master writing readable, maintainable code."
      },
      {
        id: "BK-104",
        title: "Modern Full-Stack Development with Node.js & React",
        author: "Ethan Brown",
        category: "Web Development",
        price: 34.99,
        stock: 14,
        isbn: "978-1492053514",
        rating: 4.6,
        published_year: 2024,
        description: "Build scalable and responsive full-stack applications with modern JavaScript frameworks, RESTful APIs, and cloud deployments."
      },
      {
        id: "BK-105",
        title: "Artificial Intelligence: A Modern Approach (4th Ed)",
        author: "Stuart Russell, Peter Norvig",
        category: "Artificial Intelligence",
        price: 89.00,
        stock: 8,
        isbn: "978-0134610993",
        rating: 4.9,
        published_year: 2023,
        description: "The comprehensive textbook used worldwide covering probabilistic reasoning, deep learning, multi-agent systems, and ethics in AI."
      },
      {
        id: "BK-106",
        title: "Site Reliability Engineering: How Google Runs Production Systems",
        author: "Betsy Beyer, Chris Jones, Niall Murphy",
        category: "Cloud Computing",
        price: 45.00,
        stock: 9,
        isbn: "978-1491929124",
        rating: 4.8,
        published_year: 2022,
        description: "Members of the Google SRE team share key insights on building scalable, reliable, and efficient cloud platforms at enterprise scale."
      }
    ];

    for (const b of sampleBooks) {
      await this.run(
        `INSERT INTO books (id, title, author, category, price, stock, isbn, rating, published_year, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.title, b.author, b.category, b.price, b.stock, b.isbn, b.rating, b.published_year, b.description]
      );
    }

    // Seed Sample Orders
    await this.run(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "ORD-901",
        "Mohana Priya",
        "mohana.priya@example.com",
        "+91 98765 43210",
        "42 Cloud Avenue, Tech City, Chennai, India",
        87.94,
        "Delivered",
        "Credit Card",
        "Priority dispatch requested"
      ]
    );

    await this.run(
      `INSERT INTO order_items (order_id, book_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)`,
      ["ORD-901", "BK-101", "Cloud Computing: Concepts, Technology & Architecture", 1, 49.99]
    );
    await this.run(
      `INSERT INTO order_items (order_id, book_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)`,
      ["ORD-901", "BK-103", "Clean Code: A Handbook of Agile Software Craftsmanship", 1, 37.95]
    );

    await this.run(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "ORD-902",
        "Alexander Vance",
        "alex.vance@example.com",
        "+1 (555) 789-0123",
        "108 Innovation Way, Austin, TX 78701, USA",
        85.00,
        "Shipped",
        "UPI / PaaS Wallet",
        "Leave with security desk"
      ]
    );
    await this.run(
      `INSERT INTO order_items (order_id, book_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)`,
      ["ORD-902", "BK-102", "Designing Data-Intensive Applications", 2, 42.50]
    );
  }

  // ==========================================
  // 📚 BOOKS SQL CRUD
  // ==========================================

  async getAllBooks({ search, category, sort } = {}) {
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(description) LIKE ? OR isbn LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term, term);
    }

    if (category && category !== 'All') {
      sql += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (sort === 'price-asc') sql += ' ORDER BY price ASC';
    else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
    else if (sort === 'title-asc') sql += ' ORDER BY title ASC';
    else if (sort === 'stock-asc') sql += ' ORDER BY stock ASC';
    else sql += ' ORDER BY created_at DESC';

    const rows = await this.all(sql, params);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      author: r.author,
      category: r.category,
      price: r.price,
      stock: r.stock,
      isbn: r.isbn,
      rating: r.rating,
      publishedYear: r.published_year,
      description: r.description,
      createdAt: r.created_at
    }));
  }

  async getBookById(id) {
    const r = await this.get('SELECT * FROM books WHERE id = ?', [id]);
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      author: r.author,
      category: r.category,
      price: r.price,
      stock: r.stock,
      isbn: r.isbn,
      rating: r.rating,
      publishedYear: r.published_year,
      description: r.description
    };
  }

  async createBook(data) {
    const id = `BK-${Date.now().toString().slice(-4)}`;
    const price = parseFloat(data.price) || 0.0;
    const stock = parseInt(data.stock, 10) || 0;
    const rating = parseFloat(data.rating) || 4.5;
    const publishedYear = parseInt(data.publishedYear, 10) || new Date().getFullYear();
    const isbn = data.isbn ? data.isbn.trim() : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const description = data.description ? data.description.trim() : "No description provided.";

    await this.run(
      `INSERT INTO books (id, title, author, category, price, stock, isbn, rating, published_year, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.title.trim(), data.author.trim(), data.category || 'General', price, stock, isbn, rating, publishedYear, description]
    );

    const newBook = await this.getBookById(id);
    this.notifyChange('BOOK_CREATED', newBook);
    return newBook;
  }

  async updateBook(id, data) {
    const existing = await this.getBookById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title.trim() : existing.title;
    const author = data.author !== undefined ? data.author.trim() : existing.author;
    const category = data.category !== undefined ? data.category : existing.category;
    const price = data.price !== undefined ? parseFloat(data.price) : existing.price;
    const stock = data.stock !== undefined ? parseInt(data.stock, 10) : existing.stock;
    const description = data.description !== undefined ? data.description.trim() : existing.description;

    await this.run(
      `UPDATE books SET title = ?, author = ?, category = ?, price = ?, stock = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title, author, category, price, stock, description, id]
    );

    const updated = await this.getBookById(id);
    this.notifyChange('BOOK_UPDATED', updated);
    return updated;
  }

  async deleteBook(id) {
    const existing = await this.getBookById(id);
    if (!existing) return false;

    await this.run('DELETE FROM books WHERE id = ?', [id]);
    this.notifyChange('BOOK_DELETED', { id, title: existing.title });
    return true;
  }

  // ==========================================
  // 🛒 CUSTOMER ORDERS SQL CRUD
  // ==========================================

  async getAllOrders({ status, search } = {}) {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND LOWER(status) = LOWER(?)';
      params.push(status);
    }

    if (search) {
      sql += ' AND (LOWER(id) LIKE ? OR LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ?)';
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY order_date DESC';
    const orders = await this.all(sql, params);

    // Fetch items for each order
    const result = [];
    for (const o of orders) {
      const items = await this.all('SELECT book_id as bookId, title, quantity, price FROM order_items WHERE order_id = ?', [o.id]);
      result.push({
        id: o.id,
        customerName: o.customer_name,
        customerEmail: o.customer_email,
        customerPhone: o.customer_phone,
        shippingAddress: o.shipping_address,
        totalAmount: o.total_amount,
        status: o.status,
        paymentMethod: o.payment_method,
        notes: o.notes,
        orderDate: o.order_date,
        items
      });
    }

    return result;
  }

  async getOrderById(id) {
    const o = await this.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!o) return null;
    const items = await this.all('SELECT book_id as bookId, title, quantity, price FROM order_items WHERE order_id = ?', [o.id]);
    return {
      id: o.id,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      customerPhone: o.customer_phone,
      shippingAddress: o.shipping_address,
      totalAmount: o.total_amount,
      status: o.status,
      paymentMethod: o.payment_method,
      notes: o.notes,
      orderDate: o.order_date,
      items
    };
  }

  async createOrder(orderData) {
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of (orderData.items || [])) {
      const book = await this.getBookById(item.bookId);
      if (!book) {
        throw new Error(`Book not found for ID: ${item.bookId}`);
      }
      const qty = parseInt(item.quantity, 10) || 1;
      if (book.stock < qty) {
        throw new Error(`Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${qty}`);
      }

      // Deduct stock in SQL
      await this.run('UPDATE books SET stock = stock - ? WHERE id = ?', [qty, book.id]);

      const subtotal = book.price * qty;
      calculatedTotal += subtotal;
      validatedItems.push({
        bookId: book.id,
        title: book.title,
        quantity: qty,
        price: book.price
      });
    }

    const totalAmount = parseFloat((orderData.totalAmount || calculatedTotal).toFixed(2));

    await this.run(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        orderData.customerName.trim(),
        orderData.customerEmail.trim(),
        orderData.customerPhone ? orderData.customerPhone.trim() : 'N/A',
        orderData.shippingAddress.trim(),
        totalAmount,
        orderData.status || 'Pending',
        orderData.paymentMethod || 'Credit/Debit Card',
        orderData.notes ? orderData.notes.trim() : ''
      ]
    );

    for (const item of validatedItems) {
      await this.run(
        `INSERT INTO order_items (order_id, book_id, title, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [id, item.bookId, item.title, item.quantity, item.price]
      );
    }

    const newOrder = await this.getOrderById(id);
    this.notifyChange('ORDER_CREATED', newOrder);
    return newOrder;
  }

  async updateOrderStatus(id, newStatus) {
    const order = await this.getOrderById(id);
    if (!order) return null;

    if (newStatus === 'Cancelled' && order.status !== 'Cancelled') {
      // Restock books
      for (const item of order.items) {
        await this.run('UPDATE books SET stock = stock + ? WHERE id = ?', [item.quantity, item.bookId]);
      }
    }

    await this.run('UPDATE orders SET status = ? WHERE id = ?', [newStatus, id]);
    const updated = await this.getOrderById(id);
    this.notifyChange('ORDER_STATUS_CHANGED', updated);
    return updated;
  }

  async deleteOrder(id) {
    const existing = await this.getOrderById(id);
    if (!existing) return false;

    await this.run('DELETE FROM order_items WHERE order_id = ?', [id]);
    await this.run('DELETE FROM orders WHERE id = ?', [id]);
    this.notifyChange('ORDER_DELETED', { id });
    return true;
  }

  // ==========================================
  // 📊 STATS
  // ==========================================

  async getStats() {
    const bookRow = await this.get('SELECT COUNT(*) as total_books, COALESCE(SUM(stock), 0) as total_stock FROM books');
    const lowStockRow = await this.get('SELECT COUNT(*) as low_stock FROM books WHERE stock < 10');
    const orderRow = await this.get('SELECT COUNT(*) as total_orders, COALESCE(SUM(CASE WHEN status != "Cancelled" THEN total_amount ELSE 0 END), 0) as total_revenue, COUNT(CASE WHEN status IN ("Pending", "Processing") THEN 1 END) as pending_orders FROM orders');

    return {
      databaseType: 'SQLite Relational Database (SQL)',
      totalBooks: bookRow.total_books || 0,
      totalStock: bookRow.total_stock || 0,
      lowStockBooks: lowStockRow.low_stock || 0,
      totalOrders: orderRow.total_orders || 0,
      totalRevenue: parseFloat((orderRow.total_revenue || 0).toFixed(2)),
      pendingOrders: orderRow.pending_orders || 0
    };
  }
}

module.exports = new SqlDatabase();
