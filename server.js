const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 📚 BOOKS API (CRUD)
// ==========================================

// 1. READ: Get all books (supports optional search and category filters)
app.get('/api/books', (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const books = db.getAllBooks({ search, category, sort });
    res.json({ success: true, count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. READ: Get single book details
app.get('/api/books/:id', (req, res) => {
  try {
    const book = db.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE: Add a new book
app.post('/api/books', (req, res) => {
  try {
    const { title, author, price, category, stock, isbn, description } = req.body;

    if (!title || !author || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, price, and stock.'
      });
    }

    const newBook = db.createBook({
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
      message: 'Book added successfully!',
      data: newBook
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. UPDATE: Update book information
app.put('/api/books/:id', (req, res) => {
  try {
    const updatedBook = db.updateBook(req.params.id, req.body);
    if (!updatedBook) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({
      success: true,
      message: 'Book updated successfully!',
      data: updatedBook
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. DELETE: Remove a book
app.delete('/api/books/:id', (req, res) => {
  try {
    const deleted = db.deleteBook(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Book deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 🛒 CUSTOMER ORDERS API (CRUD & Management)
// ==========================================

// 1. READ: List all customer orders
app.get('/api/orders', (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = db.getAllOrders({ status, search });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. CREATE: Place a new customer order
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, bookId, quantity, paymentMethod, notes } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name, email, shipping address, and book selection.'
      });
    }

    const order = db.createOrder({
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
      message: 'Customer order placed successfully!',
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. UPDATE: Update order status (Pending -> Processing -> Shipped -> Delivered -> Cancelled)
app.put('/api/orders/:id', (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = db.updateOrderStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. DELETE: Cancel/delete an order
app.delete('/api/orders/:id', (req, res) => {
  try {
    const deleted = db.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order removed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 📊 STATS API
// ==========================================
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve frontend index.html for any unmatched route (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Bookstore App is running on port ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(` Developer: MohanaPriya-29`);
  console.log(`===============================================`);
});
