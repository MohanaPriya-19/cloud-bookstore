// ========================================================
// Cloud Bookstore Client Application (Vanilla JavaScript)
// Author: MohanaPriya-19
// ========================================================

const API_BASE = '/api';
let allBooksCache = [];
let searchDebounceTimer = null;

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadBooks();
  loadOrders();
});

// --- Tab Switching ---
function switchTab(tabName) {
  const booksBtn = document.getElementById('tab-books-btn');
  const ordersBtn = document.getElementById('tab-orders-btn');
  const dbBtn = document.getElementById('tab-db-btn');

  const booksSection = document.getElementById('books-section');
  const ordersSection = document.getElementById('orders-section');
  const dbSection = document.getElementById('database-section');

  // Reset all
  booksBtn.classList.remove('active');
  ordersBtn.classList.remove('active');
  if (dbBtn) dbBtn.classList.remove('active');

  booksSection.classList.remove('active');
  ordersSection.classList.remove('active');
  if (dbSection) dbSection.classList.remove('active');

  if (tabName === 'books') {
    booksBtn.classList.add('active');
    booksSection.classList.add('active');
  } else if (tabName === 'orders') {
    ordersBtn.classList.add('active');
    ordersSection.classList.add('active');
  } else if (tabName === 'database') {
    if (dbBtn) dbBtn.classList.add('active');
    if (dbSection) dbSection.classList.add('active');
    loadLiveDatabaseView();
  }
}

// --- Live Database Inspector ---
async function loadLiveDatabaseView() {
  const jsonPre = document.getElementById('live-db-json');
  const updatedBadge = document.getElementById('db-last-updated');
  const countBadge = document.getElementById('db-records-count');

  if (!jsonPre) return;

  try {
    const res = await fetch(`${API_BASE}/database/raw`);
    const result = await res.json();

    if (result.success) {
      jsonPre.innerText = JSON.stringify(result.data, null, 2);
      if (updatedBadge) {
        updatedBadge.innerText = `Last Synced: ${new Date(result.timestamp).toLocaleTimeString()}`;
      }
      if (countBadge) {
        countBadge.innerText = `Books: ${result.data.books.length} | Orders: ${result.data.orders.length}`;
      }
    } else {
      jsonPre.innerText = `Error retrieving live database: ${result.message}`;
    }
  } catch (err) {
    jsonPre.innerText = `Failed to fetch live database from server: ${err.message}`;
  }
}

// --- Toast Feedback Messages ---
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast show toast-${type}`;
  toast.innerText = message;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3200);
}

// --- Load Dashboard Overview Stats ---
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    const result = await res.json();
    if (result.success) {
      document.getElementById('stat-books').innerText = result.data.totalBooks;
      document.getElementById('stat-orders').innerText = result.data.totalOrders;
      document.getElementById('stat-revenue').innerText = `$${result.data.totalRevenue.toFixed(2)}`;
      document.getElementById('stat-low-stock').innerText = result.data.lowStockBooks;
      loadLiveDatabaseView();
    }
  } catch (err) {
    console.error('Error fetching statistics:', err);
  }
}

// ==========================================
// 📚 BOOKS MANAGEMENT (CRUD)
// ==========================================

// 1. READ: Load & display books
async function loadBooks() {
  const search = document.getElementById('book-search').value.trim();
  const category = document.getElementById('book-filter-category').value;
  const sort = document.getElementById('book-sort').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);
  if (sort) params.append('sort', sort);

  const tbody = document.getElementById('books-list-body');

  try {
    const res = await fetch(`${API_BASE}/books?${params.toString()}`);
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">No books found matching criteria.</td></tr>`;
      allBooksCache = [];
      updateOrderBookSelect([]);
      return;
    }

    allBooksCache = data.data;
    updateOrderBookSelect(allBooksCache);

    tbody.innerHTML = data.data.map(book => {
      const stockBadge = book.stock <= 0
        ? `<span class="badge badge-red">Out of Stock</span>`
        : book.stock < 10
        ? `<span class="badge badge-amber">${book.stock} left (Low)</span>`
        : `<span class="badge badge-green">${book.stock} in stock</span>`;

      return `
        <tr>
          <td><span class="badge badge-gray">${book.id}</span></td>
          <td>
            <div class="book-title-cell">${escapeHtml(book.title)}</div>
            <div class="book-author-cell">by ${escapeHtml(book.author)}</div>
          </td>
          <td><span class="badge badge-blue">${escapeHtml(book.category)}</span></td>
          <td><strong>$${Number(book.price).toFixed(2)}</strong></td>
          <td>${stockBadge}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-outline btn-sm" onclick="viewBookDetails('${book.id}')">View</button>
              <button class="btn btn-secondary btn-sm" onclick="openEditModal('${book.id}')">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="handleDeleteBook('${book.id}', '${escapeHtml(book.title)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading books:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Error connecting to API server.</td></tr>`;
  }
}

// Search debounce
function handleSearchBooks() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(loadBooks, 250);
}

// Toggle Add Book form card
function toggleAddBookForm() {
  const card = document.getElementById('add-book-card');
  const isHidden = card.style.display === 'none';
  card.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    document.getElementById('book-title').focus();
  }
}

// 2. CREATE: Add a new book
async function handleCreateBook(event) {
  event.preventDefault();

  const title = document.getElementById('book-title').value.trim();
  const author = document.getElementById('book-author').value.trim();
  const category = document.getElementById('book-category').value;
  const price = parseFloat(document.getElementById('book-price').value);
  const stock = parseInt(document.getElementById('book-stock').value, 10);
  const description = document.getElementById('book-desc').value.trim();

  try {
    const res = await fetch(`${API_BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, category, price, stock, description })
    });

    const result = await res.json();
    if (result.success) {
      showToast('Book added successfully!', 'success');
      document.getElementById('add-book-form').reset();
      toggleAddBookForm();
      loadBooks();
      loadStats();
    } else {
      showToast(result.message || 'Failed to add book', 'error');
    }
  } catch (err) {
    showToast('Network error while adding book', 'error');
  }
}

// 3. READ SINGLE: View Book Details in modal
async function viewBookDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/books/${id}`);
    const result = await res.json();
    if (!result.success) {
      showToast('Book not found', 'error');
      return;
    }

    const b = result.data;
    document.getElementById('view-book-title').innerText = b.title;
    document.getElementById('view-book-body').innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Book ID:</span>
        <span class="detail-value"><span class="badge badge-gray">${b.id}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Author:</span>
        <span class="detail-value">${escapeHtml(b.author)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Category:</span>
        <span class="detail-value"><span class="badge badge-blue">${escapeHtml(b.category)}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Price:</span>
        <span class="detail-value"><strong>$${Number(b.price).toFixed(2)}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Stock Quantity:</span>
        <span class="detail-value">${b.stock} copies</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">ISBN:</span>
        <span class="detail-value">${escapeHtml(b.isbn || 'N/A')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Published Year:</span>
        <span class="detail-value">${b.publishedYear || 'N/A'}</span>
      </div>
      <div style="margin-top: 0.5rem;">
        <span class="detail-label" style="display: block; margin-bottom: 0.25rem;">Description:</span>
        <p style="font-size: 0.9rem; color: #475569; line-height: 1.6;">${escapeHtml(b.description || 'No description available.')}</p>
      </div>
    `;

    document.getElementById('view-book-modal').classList.add('show');
  } catch (err) {
    showToast('Error loading book details', 'error');
  }
}

function closeViewModal() {
  document.getElementById('view-book-modal').classList.remove('show');
}

// 4. UPDATE: Open edit modal and populate data
async function openEditModal(id) {
  try {
    const res = await fetch(`${API_BASE}/books/${id}`);
    const result = await res.json();
    if (!result.success) return;

    const b = result.data;
    document.getElementById('edit-book-id').value = b.id;
    document.getElementById('edit-book-title').value = b.title;
    document.getElementById('edit-book-author').value = b.author;
    document.getElementById('edit-book-category').value = b.category;
    document.getElementById('edit-book-price').value = b.price;
    document.getElementById('edit-book-stock').value = b.stock;
    document.getElementById('edit-book-desc').value = b.description || '';

    document.getElementById('edit-book-modal').classList.add('show');
  } catch (err) {
    showToast('Failed to retrieve book for editing', 'error');
  }
}

function closeEditModal() {
  document.getElementById('edit-book-modal').classList.remove('show');
}

async function handleSaveBookEdit(event) {
  event.preventDefault();
  const id = document.getElementById('edit-book-id').value;
  const title = document.getElementById('edit-book-title').value.trim();
  const author = document.getElementById('edit-book-author').value.trim();
  const category = document.getElementById('edit-book-category').value;
  const price = parseFloat(document.getElementById('edit-book-price').value);
  const stock = parseInt(document.getElementById('edit-book-stock').value, 10);
  const description = document.getElementById('edit-book-desc').value.trim();

  try {
    const res = await fetch(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, category, price, stock, description })
    });

    const result = await res.json();
    if (result.success) {
      showToast('Book updated successfully!', 'success');
      closeEditModal();
      loadBooks();
      loadStats();
    } else {
      showToast(result.message || 'Failed to update book', 'error');
    }
  } catch (err) {
    showToast('Error updating book', 'error');
  }
}

// 5. DELETE: Delete book
async function handleDeleteBook(id, title) {
  if (!confirm(`Are you sure you want to remove "${title}" from the bookstore?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast('Book deleted successfully', 'success');
      loadBooks();
      loadStats();
    } else {
      showToast(result.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Error deleting book', 'error');
  }
}

// ==========================================
// 🛒 CUSTOMER ORDERS MANAGEMENT
// ==========================================

// Populate book select dropdown for place order form
function updateOrderBookSelect(books) {
  const select = document.getElementById('order-book-select');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="">-- Choose a Book --</option>` +
    books.map(b => `
      <option value="${b.id}" data-price="${b.price}" data-stock="${b.stock}">
        ${escapeHtml(b.title)} ($${Number(b.price).toFixed(2)}) - ${b.stock > 0 ? b.stock + ' in stock' : 'OUT OF STOCK'}
      </option>
    `).join('');

  if (currentVal) select.value = currentVal;
}

function calculateOrderPreview() {
  const select = document.getElementById('order-book-select');
  const qtyInput = document.getElementById('order-quantity');
  const preview = document.getElementById('order-preview-price');

  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt || !selectedOpt.dataset.price) {
    preview.innerText = '$0.00';
    return;
  }

  const price = parseFloat(selectedOpt.dataset.price) || 0;
  const qty = parseInt(qtyInput.value, 10) || 1;
  const total = price * qty;
  preview.innerText = `$${total.toFixed(2)}`;
}

// Toggle place order card
function togglePlaceOrderForm() {
  const card = document.getElementById('place-order-card');
  const isHidden = card.style.display === 'none';
  card.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    document.getElementById('order-customer-name').focus();
    calculateOrderPreview();
  }
}

// 1. READ: Load Customer Orders
async function loadOrders() {
  const status = document.getElementById('order-filter-status').value;
  const search = document.getElementById('order-search').value.trim();

  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (search) params.append('search', search);

  const tbody = document.getElementById('orders-list-body');

  try {
    const res = await fetch(`${API_BASE}/orders?${params.toString()}`);
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 2rem; color: #64748b;">No customer orders found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.data.map(order => {
      const itemsSummary = (order.items || []).map(it => `${it.title} (x${it.quantity})`).join(', ');

      const statusBadge = getStatusBadge(order.status);

      return `
        <tr>
          <td><span class="badge badge-gray">${order.id}</span></td>
          <td>
            <div class="book-title-cell">${escapeHtml(order.customerName)}</div>
            <div class="book-author-cell">${escapeHtml(order.customerEmail)}</div>
          </td>
          <td style="max-width: 250px;">
            <div style="font-size: 0.85rem; line-height: 1.3;">${escapeHtml(itemsSummary)}</div>
          </td>
          <td><strong>$${Number(order.totalAmount).toFixed(2)}</strong></td>
          <td>
            <select class="btn-outline btn-sm" style="padding: 0.25rem 0.5rem; border-radius: 4px;" onchange="handleUpdateOrderStatus('${order.id}', this.value)">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>⚙️ Processing</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>🚚 Shipped</option>
              <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>✅ Delivered</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteOrder('${order.id}')">Cancel/Remove</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading orders:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: red;">Error loading orders.</td></tr>`;
  }
}

function handleSearchOrders() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(loadOrders, 250);
}

function getStatusBadge(status) {
  switch (status) {
    case 'Delivered': return '<span class="badge badge-green">Delivered</span>';
    case 'Shipped': return '<span class="badge badge-blue">Shipped</span>';
    case 'Processing': return '<span class="badge badge-purple">Processing</span>';
    case 'Cancelled': return '<span class="badge badge-red">Cancelled</span>';
    default: return '<span class="badge badge-amber">Pending</span>';
  }
}

// 2. CREATE: Place new order
async function handleCreateOrder(event) {
  event.preventDefault();

  const customerName = document.getElementById('order-customer-name').value.trim();
  const customerEmail = document.getElementById('order-customer-email').value.trim();
  const shippingAddress = document.getElementById('order-address').value.trim();
  const bookId = document.getElementById('order-book-select').value;
  const quantity = parseInt(document.getElementById('order-quantity').value, 10);

  if (!bookId) {
    showToast('Please select a book to order', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerEmail,
        shippingAddress,
        bookId,
        quantity
      })
    });

    const result = await res.json();
    if (result.success) {
      showToast(`Order placed successfully! (${result.data.id})`, 'success');
      document.getElementById('place-order-form').reset();
      calculateOrderPreview();
      togglePlaceOrderForm();
      loadOrders();
      loadBooks(); // refresh stock count
      loadStats();
    } else {
      showToast(result.message || 'Failed to place order', 'error');
    }
  } catch (err) {
    showToast('Error placing order', 'error');
  }
}

// 3. UPDATE: Update order status
async function handleUpdateOrderStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await res.json();
    if (result.success) {
      showToast(`Order ${id} status set to ${newStatus}`, 'success');
      loadStats();
    } else {
      showToast(result.message || 'Failed to update status', 'error');
      loadOrders(); // revert
    }
  } catch (err) {
    showToast('Error updating order status', 'error');
  }
}

// 4. DELETE: Remove/cancel order
async function handleDeleteOrder(id) {
  if (!confirm(`Are you sure you want to delete order ${id}?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast(`Order ${id} removed successfully`, 'success');
      loadOrders();
      loadStats();
      loadBooks();
    } else {
      showToast(result.message || 'Failed to remove order', 'error');
    }
  } catch (err) {
    showToast('Error deleting order', 'error');
  }
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
