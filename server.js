const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./data/sqlDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ⚡ REAL-TIME SERVER-SENT EVENTS (SSE)
// ==========================================
// Holds all active client browser connections for real-time live updates
const sseClients = new Set();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time SQL connection established' })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Broadcast database changes to all open browser windows in real time
db.onDatabaseChange((eventPayload) => {
  const dataString = `data: ${JSON.stringify(eventPayload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(dataString);
    } catch (err) {
      sseClients.delete(client);
    }
  }
});

// ==========================================
// 📚 BOOKS SQL API (CRUD)
// ==========================================

// 1. READ: Get all books
app.get('/api/books', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const books = await db.getAllBooks({ search, category, sort });
    res.json({ success: true, count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. READ: Get single book details
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await db.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE: Add a new book (SQL INSERT)
app.post('/api/books', async (req, res) => {
  try {
    const { title, author, price, category, stock, isbn, description } = req.body;

    if (!title || !author || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, price, and stock.'
      });
    }

    const newBook = await db.createBook({
      title,
      author,
      price: parseFloat(price),
      category: category || 'General',
      stock: parseInt(stock, 10),
      isbn,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Book added to SQL Database successfully!',
      data: newBook
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. UPDATE: Update book information (SQL UPDATE)
app.put('/api/books/:id', async (req, res) => {
  try {
    const updatedBook = await db.updateBook(req.params.id, req.body);
    if (!updatedBook) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({
      success: true,
      message: 'Book updated in SQL Database!',
      data: updatedBook
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. DELETE: Remove a book (SQL DELETE)
app.delete('/api/books/:id', async (req, res) => {
  try {
    const deleted = await db.deleteBook(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book removed from SQL Database!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛒 CUSTOMER ORDERS SQL API (CRUD)
// ==========================================

// 1. READ: List all customer orders
app.get('/api/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = await db.getAllOrders({ status, search });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1b. READ: Get single order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. CREATE: Place a new customer order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, bookId, quantity, paymentMethod, notes } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, email, shipping address, and book selection.'
      });
    }

    const order = await db.createOrder({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      notes,
      items: [
        {
          bookId,
          quantity: parseInt(quantity, 10) || 1
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Customer order placed in SQL Database!',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. UPDATE: Update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status} in SQL Database`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. DELETE: Cancel/delete an order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deleted = await db.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted from SQL Database!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 📊 STATS API
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🗄️ LIVE DATABASE INSPECTOR API
// ==========================================
app.get('/api/database/raw', async (req, res) => {
  try {
    const books = await db.getAllBooks();
    const orders = await db.getAllOrders();
    const stats = await db.getStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      engine: 'SQLite Relational Database (SQL)',
      stats,
      data: {
        books,
        orders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve frontend index.html for any unmatched route (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize SQLite database and Start Server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` Bookstore App (SQLite Relational DB) running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Real-time Live Sync: Active (SSE /api/events)`);
    console.log(` Developer: MohanaPriya-19`);
    console.log(`===============================================`);
  });
}).catch(err => {
  console.error('Fatal: Failed to initialize SQL database:', err);
  process.exit(1);
});
