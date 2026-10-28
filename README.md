# 📚 Cloud Bookstore - Dynamic Web Application

A full-stack dynamic web application for an online bookstore developed for **Cloud Computing Lab**. Features complete **CRUD operations** for book inventory and **Customer Orders Management**, designed for **PaaS (Platform as a Service)** deployment via **GitHub integration**.

**Developer:** Mohana Priya (`MohanaPriya-19`)  
**Technology Stack:** Node.js, Express.js, Vanilla HTML5, Vanilla CSS3, JavaScript (Fetch API)

---

## 🌟 Features & CRUD Operations

### 1. 📖 Book Catalog (CRUD)
- **Create (C):** Add new books with title, author, category, price, stock quantity, and description.
- **Read (R):** View all books in real time with live search, category filter, and individual book detail modal.
- **Update (U):** Modify existing book details (title, price, stock, category, synopsis) with instant updates.
- **Delete (D):** Remove discontinued books from the store catalog with confirmation safeguard.

### 2. 🛒 Customer Orders Management
- **Place Orders:** Customers or administrators can create orders with delivery address, book selection, and quantity.
- **Live Stock Sync:** Automatically verifies and deducts stock when an order is placed.
- **Order Status Tracking:** Update order fulfillment stages (`Pending` ➔ `Processing` ➔ `Shipped` ➔ `Delivered` ➔ `Cancelled`).
- **Order Cancellation:** Cancel/remove orders with automated stock replenishment.

### 3. 📊 Dashboard Analytics
- Real-time statistics: Total Books, Total Orders, Total Revenue ($), and Low Stock Alerts.

---

## ❓ Does it require AWS Authentication?

### **Short Answer: NO (Unless your professor specifically mandates AWS)**

- **When AWS Authentication is NOT required (Recommended):**  
  Deploying to modern PaaS platforms like **Render**, **Vercel**, or **Railway** connects directly to your **GitHub account (`MohanaPriya-19`)** via GitHub OAuth.
  - ✅ No AWS account needed
  - ✅ No AWS Access Keys / CLI authentication required
  - ✅ 100% Free Tier with automated continuous deployment on `git push`

- **When AWS Authentication IS required:**  
  Only if your college lab rubric explicitly instructs you to use **AWS Elastic Beanstalk** or **AWS App Runner**. In that case, you must log into the AWS Management Console with an AWS IAM / root account.

Both deployment procedures are detailed below.

---

## 🚀 Step-by-Step Procedure

### Phase 1: Run and Test Locally

1. Open your terminal in this directory:
   ```bash
   cd "c:\Users\mohanapriya\Downloads\cloud lab"
   ```

2. Install dependencies (already installed):
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   Test adding a book, editing a book, placing an order, and updating order status.

---

### Phase 2: Push to GitHub (`MohanaPriya-19`)

1. Open your browser and go to [GitHub](https://github.com) logged in as `MohanaPriya-19`.
2. Click the **`+`** icon at top right ➔ **New repository**.
3. Set:
   - **Repository name:** `cloud-bookstore`
   - **Visibility:** Public
   - **Do NOT** check "Add a README" or "Add .gitignore" (we already have them).
   - Click **Create repository**.
4. In your local terminal, initialize and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Online Bookstore CRUD with PaaS deployment readiness"
   git branch -M main
   git remote add origin https://github.com/MohanaPriya-19/cloud-bookstore.git
   git push -u origin main
   ```

---

### Phase 3: Deploy on PaaS (Render - Zero AWS Needed, 100% Free)

**Render** is the industry standard PaaS for deploying Node.js apps straight from GitHub:

1. Go to [https://render.com](https://render.com) and click **Sign Up** or **Log In**.
2. Choose **"Continue with GitHub"** and authorize with your GitHub account (`MohanaPriya-19`).
3. On the Render Dashboard, click **New +** ➔ **Web Service**.
4. Select **"Build and deploy from a Git repository"** and connect `MohanaPriya-19/cloud-bookstore`.
5. Configure the following fields:
   - **Name:** `cloud-bookstore-mohana` (or any unique name)
   - **Region:** Any close region (e.g., Singapore or Oregon)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
6. Click **Deploy Web Service**.
7. In 1–2 minutes, Render will build your application and assign you a live public URL:
   `https://cloud-bookstore-mohana.onrender.com`

*Every time you run `git push origin main`, Render automatically rebuilds and redeploys the updated code!*

---

### Phase 4 (Alternative): Deploying on AWS Elastic Beanstalk (If AWS is Mandatory)

If your lab requires AWS specifically:
1. Log in to [AWS Management Console](https://aws.amazon.com/console/).
2. Search for **Elastic Beanstalk** ➔ Click **Create Application**.
3. Enter Application Name: `cloud-bookstore`.
4. Platform: Choose **Node.js** (Platform branch: Node.js 20 or 22).
5. Application Code:
   - You can either upload a `.zip` of your project files (excluding `node_modules`).
   - Or use **AWS CodePipeline** to connect to GitHub repository `MohanaPriya-19/cloud-bookstore` for continuous deployment.
6. Click **Create** and wait 3–5 minutes for the environment to provision with an AWS endpoint (e.g., `http://cloudbookstore-env.eba-xxx.elasticbeanstalk.com`).

---

## 📂 Project Structure

```
cloud lab/
├── package.json         # Project metadata, dependencies, and start scripts
├── server.js            # Express.js REST API server & static file host
├── .gitignore           # Ignores node_modules, temp files, and local store
├── README.md            # Comprehensive documentation & deployment guide
├── data/
│   ├── db.js            # Persistent JSON database layer with seed records
│   └── store.json       # Auto-generated runtime storage file
└── public/              # Lightweight frontend (Simple HTML, CSS, JS)
    ├── index.html       # Clean semantic HTML interface
    ├── style.css        # Clean, modern, responsive CSS styles
    └── app.js           # Vanilla JS controlling CRUD and API fetch requests
```

---

## 📡 API Reference Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books` | Retrieve list of all books (supports `search`, `category`, `sort`) |
| `GET` | `/api/books/:id` | Get details for a single book |
| `POST` | `/api/books` | Add a new book to catalog |
| `PUT` | `/api/books/:id` | Update existing book information |
| `DELETE` | `/api/books/:id` | Remove a book from store |
| `GET` | `/api/orders` | List customer orders |
| `POST` | `/api/orders` | Place a new customer order & reduce inventory stock |
| `PUT` | `/api/orders/:id` | Update order status (`Pending`, `Shipped`, `Delivered`, etc.) |
| `DELETE` | `/api/orders/:id` | Cancel/remove an order |
| `GET` | `/api/stats` | Get store summary metrics |
