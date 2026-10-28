const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname);
const DB_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_BOOKS = [
  {
    id: "BK-101",
    title: "Cloud Computing: Concepts, Technology & Architecture",
    author: "Thomas Erl, Ricardo Puttini",
    category: "Cloud Computing",
    price: 49.99,
    stock: 18,
    isbn: "978-0133387520",
    rating: 4.8,
    coverColor: "from-sky-500 to-indigo-600",
    publishedYear: 2023,
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
    coverColor: "from-amber-500 to-orange-600",
    publishedYear: 2022,
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
    coverColor: "from-emerald-500 to-teal-700",
    publishedYear: 2021,
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
    coverColor: "from-purple-500 to-violet-700",
    publishedYear: 2024,
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
    coverColor: "from-rose-500 to-pink-700",
    publishedYear: 2023,
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
    coverColor: "from-blue-600 to-cyan-700",
    publishedYear: 2022,
    description: "Members of the Google SRE team share key insights on building scalable, reliable, and efficient cloud platforms at enterprise scale."
  }
];

const INITIAL_ORDERS = [
  {
    id: "ORD-901",
    customerName: "Mohana Priya",
    customerEmail: "mohana.priya@example.com",
    customerPhone: "+91 98765 43210",
    shippingAddress: "42 Cloud Avenue, Tech City, Chennai, India",
    items: [
      {
        bookId: "BK-101",
        title: "Cloud Computing: Concepts, Technology & Architecture",
        quantity: 1,
        price: 49.99
      },
      {
        bookId: "BK-103",
        title: "Clean Code: A Handbook of Agile Software Craftsmanship",
        quantity: 1,
        price: 37.95
      }
    ],
    totalAmount: 87.94,
    orderDate: "2026-10-25T10:30:00.000Z",
    status: "Delivered",
    paymentMethod: "Credit Card",
    notes: "Priority dispatch requested"
  },
  {
    id: "ORD-902",
    customerName: "Alexander Vance",
    customerEmail: "alex.vance@example.com",
    customerPhone: "+1 (555) 789-0123",
    shippingAddress: "108 Innovation Way, Austin, TX 78701, USA",
    items: [
      {
        bookId: "BK-102",
        title: "Designing Data-Intensive Applications",
        quantity: 2,
        price: 42.50
      }
    ],
    totalAmount: 85.00,
    orderDate: "2026-10-27T14:15:00.000Z",
    status: "Shipped",
    paymentMethod: "UPI / PaaS Wallet",
    notes: "Leave with security desk"
  },
  {
    id: "ORD-903",
    customerName: "Samantha Chen",
    customerEmail: "samantha.chen@example.org",
    customerPhone: "+65 8123 4567",
    shippingAddress: "12 Marina Boulevard, Singapore",
    items: [
      {
        bookId: "BK-105",
        title: "Artificial Intelligence: A Modern Approach (4th Ed)",
        quantity: 1,
        price: 89.00
      }
    ],
    totalAmount: 89.00,
    orderDate: "2026-10-28T07:45:00.000Z",
    status: "Processing",
    paymentMethod: "Net Banking",
    notes: "Gift wrap if possible"
  }
];

class Database {
  constructor() {
    this.books = [];
    this.orders = [];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.books = data.books || INITIAL_BOOKS;
        this.orders = data.orders || INITIAL_ORDERS;
      } else {
        this.books = [...INITIAL_BOOKS];
        this.orders = [...INITIAL_ORDERS];
        this.save();
      }
    } catch (err) {
      console.warn('Could not read store.json, using in-memory dataset:', err.message);
      this.books = [...INITIAL_BOOKS];
      this.orders = [...INITIAL_ORDERS];
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify({ books: this.books, orders: this.orders }, null, 2), 'utf8');
    } catch (err) {
      console.warn('Warning: Could not save store to file system (read-only environment):', err.message);
    }
  }

  // --- Books CRUD ---
  getAllBooks({ search, category, sort } = {}) {
    let result = [...this.books];

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      );
    }

    if (category && category !== 'All') {
      result = result.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }

    if (sort) {
      if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
      else if (sort === 'title-asc') result.sort((a, b) => a.title.localeCompare(b.title));
      else if (sort === 'stock-asc') result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }

  getBookById(id) {
    return this.books.find(b => b.id === id);
  }

  createBook(bookData) {
    const id = `BK-${Date.now().toString().slice(-4)}`;
    const newBook = {
      id,
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      category: bookData.category || 'General',
      price: parseFloat(bookData.price) || 0.0,
      stock: parseInt(bookData.stock, 10) || 0,
      isbn: bookData.isbn ? bookData.isbn.trim() : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      rating: parseFloat(bookData.rating) || 4.5,
      publishedYear: parseInt(bookData.publishedYear, 10) || new Date().getFullYear(),
      description: bookData.description ? bookData.description.trim() : "No description provided."
    };

    this.books.unshift(newBook);
    this.save();
    return newBook;
  }

  updateBook(id, updateData) {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) return null;

    const current = this.books[index];
    this.books[index] = {
      ...current,
      title: updateData.title !== undefined ? updateData.title.trim() : current.title,
      author: updateData.author !== undefined ? updateData.author.trim() : current.author,
      category: updateData.category !== undefined ? updateData.category : current.category,
      price: updateData.price !== undefined ? parseFloat(updateData.price) : current.price,
      stock: updateData.stock !== undefined ? parseInt(updateData.stock, 10) : current.stock,
      isbn: updateData.isbn !== undefined ? updateData.isbn.trim() : current.isbn,
      rating: updateData.rating !== undefined ? parseFloat(updateData.rating) : current.rating,
      publishedYear: updateData.publishedYear !== undefined ? parseInt(updateData.publishedYear, 10) : current.publishedYear,
      description: updateData.description !== undefined ? updateData.description.trim() : current.description
    };

    this.save();
    return this.books[index];
  }

  deleteBook(id) {
    const index = this.books.findIndex(b => b.id === id);
    if (index === -1) return false;

    this.books.splice(index, 1);
    this.save();
    return true;
  }

  // --- Orders Management ---
  getAllOrders({ status, search } = {}) {
    let result = [...this.orders];

    if (status && status !== 'All') {
      result = result.filter(o => o.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.items.some(it => it.title.toLowerCase().includes(q))
      );
    }

    // Sort newest orders first
    result.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    return result;
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id);
  }

  createOrder(orderData) {
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    // Verify and adjust stock
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of (orderData.items || [])) {
      const book = this.getBookById(item.bookId);
      if (!book) {
        throw new Error(`Book not found for ID: ${item.bookId}`);
      }
      const qty = parseInt(item.quantity, 10) || 1;
      if (book.stock < qty) {
        throw new Error(`Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${qty}`);
      }

      // Deduct stock
      book.stock -= qty;
      const itemSubtotal = book.price * qty;
      calculatedTotal += itemSubtotal;

      validatedItems.push({
        bookId: book.id,
        title: book.title,
        quantity: qty,
        price: book.price
      });
    }

    const newOrder = {
      id,
      customerName: orderData.customerName.trim(),
      customerEmail: orderData.customerEmail.trim(),
      customerPhone: orderData.customerPhone ? orderData.customerPhone.trim() : 'N/A',
      shippingAddress: orderData.shippingAddress.trim(),
      items: validatedItems,
      totalAmount: parseFloat((orderData.totalAmount || calculatedTotal).toFixed(2)),
      orderDate: new Date().toISOString(),
      status: orderData.status || "Pending",
      paymentMethod: orderData.paymentMethod || "Credit/Debit Card",
      notes: orderData.notes ? orderData.notes.trim() : ""
    };

    this.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(id, newStatus) {
    const order = this.getOrderById(id);
    if (!order) return null;

    // If cancelling, optionally restock
    if (newStatus === 'Cancelled' && order.status !== 'Cancelled') {
      order.items.forEach(item => {
        const book = this.getBookById(item.bookId);
        if (book) {
          book.stock += item.quantity;
        }
      });
    }

    order.status = newStatus;
    this.save();
    return order;
  }

  deleteOrder(id) {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return false;

    this.orders.splice(index, 1);
    this.save();
    return true;
  }

  // --- Statistics ---
  getStats() {
    const totalBooks = this.books.length;
    const totalStock = this.books.reduce((acc, b) => acc + b.stock, 0);
    const lowStockBooks = this.books.filter(b => b.stock < 10).length;
    const totalOrders = this.orders.length;
    const totalRevenue = this.orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.totalAmount, 0);
    const pendingOrders = this.orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;

    return {
      totalBooks,
      totalStock,
      lowStockBooks,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      pendingOrders
    };
  }

  // Reset to initial seed
  resetData() {
    this.books = [...INITIAL_BOOKS];
    this.orders = [...INITIAL_ORDERS];
    this.save();
    return true;
  }
}

module.exports = new Database();
