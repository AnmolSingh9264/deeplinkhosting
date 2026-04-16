/**
 * mock-data.js
 * Demo/mock data for running without Firebase
 */

const MOCK_VENDOR = {
  uid: "demo-vendor-001",
  email: "demo@vendoros.com",
  name: "Krishna Store",
  initials: "KS",
  status: "active"
};

const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    brand: "Amul",
    name: "Fresh Milk",
    price: "60",
    oldPrice: "65",
    description: "<p>Pure fresh milk, sourced daily from local farms.</p>",
    image: "",
    emoji: "🥛",
    stock: 24,
    volume: "1 litre",
    tags: ["milk", "daily-essentials"],
    searchKeywords: ["mil", "milk", "fresh", "amul"],
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 10)
  },
  {
    id: "prod-2",
    brand: "Local Farm",
    name: "Organic Apples",
    price: "100",
    oldPrice: "110",
    description: "<p>Fresh organic apples picked from Himalayan orchards.</p>",
    image: "",
    emoji: "🍎",
    stock: 3,
    volume: "500 g",
    variants: [
      { id: "1", title: "500 g", price: "100", oldPrice: "110" },
      { id: "2", title: "250 g", price: "50", oldPrice: "55" }
    ],
    tags: ["apple", "all-season"],
    searchKeywords: ["apple", "seb"],
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 5)
  },
  {
    id: "prod-3",
    brand: "Gujarat Co-op",
    name: "Paneer Block",
    price: "85",
    oldPrice: "90",
    description: "<p>Fresh cottage cheese made from full-fat milk.</p>",
    image: "",
    emoji: "🧀",
    stock: 8,
    volume: "200 g",
    tags: ["dairy", "protein"],
    searchKeywords: ["paneer", "cheese", "dairy"],
    status: "pending_approval",
    created_at: new Date(Date.now() - 86400000 * 2)
  },
  {
    id: "prod-4",
    brand: "Sunrise",
    name: "Whole Wheat Bread",
    price: "45",
    oldPrice: "50",
    description: "<p>Freshly baked whole wheat bread, no preservatives.</p>",
    image: "",
    emoji: "🍞",
    stock: 0,
    volume: "400 g",
    tags: ["bread", "bakery"],
    searchKeywords: ["bread", "wheat", "atta"],
    status: "updated_pending_review",
    created_at: new Date(Date.now() - 86400000 * 1)
  },
  {
    id: "prod-5",
    brand: "Nature's Best",
    name: "Organic Turmeric",
    price: "120",
    oldPrice: "130",
    description: "<p>Pure organic turmeric powder from certified farms.</p>",
    image: "",
    emoji: "🌿",
    stock: 15,
    volume: "250 g",
    tags: ["spices", "organic"],
    searchKeywords: ["turmeric", "haldi"],
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 8)
  },
  {
    id: "prod-6",
    brand: "Daily Fresh",
    name: "Curd / Yogurt",
    price: "35",
    oldPrice: "38",
    description: "<p>Thick, creamy curd made from fresh full-fat milk.</p>",
    image: "",
    emoji: "🫙",
    stock: 2,
    volume: "500 g",
    tags: ["dairy", "curd"],
    searchKeywords: ["curd", "yogurt", "dahi"],
    status: "approved",
    created_at: new Date(Date.now() - 86400000 * 3)
  }
];

const MOCK_ORDERS = [
  {
    id: "ord-1",
    orderNumber: "VO-20248921",
    customer: { name: "Rahul Sharma", phone: "+91 98765 43210", address: "12, MG Road, Patna" },
    items: [
      { name: "Fresh Milk", qty: 2, price: 60 },
      { name: "Organic Apples (500g)", qty: 1, price: 100 }
    ],
    total: 220,
    status: "new",
    createdAt: new Date(Date.now() - 1000 * 60 * 3), // 3 min ago
    paymentMethod: "UPI"
  },
  {
    id: "ord-2",
    orderNumber: "VO-20248890",
    customer: { name: "Priya Patel", phone: "+91 87654 32109", address: "5, Station Road, Patna" },
    items: [
      { name: "Paneer Block (200g)", qty: 2, price: 85 },
      { name: "Curd / Yogurt", qty: 1, price: 35 }
    ],
    total: 205,
    status: "accepted",
    createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    acceptedAt: new Date(Date.now() - 1000 * 60 * 42),
    paymentMethod: "Cash on Delivery"
  },
  {
    id: "ord-3",
    orderNumber: "VO-20248856",
    customer: { name: "Amit Kumar", phone: "+91 76543 21098", address: "77, Boring Road, Patna" },
    items: [
      { name: "Whole Wheat Bread", qty: 3, price: 45 },
      { name: "Fresh Milk", qty: 1, price: 60 }
    ],
    total: 195,
    status: "accepted",
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    acceptedAt: new Date(Date.now() - 1000 * 60 * 115),
    paymentMethod: "UPI"
  },
  {
    id: "ord-4",
    orderNumber: "VO-20248810",
    customer: { name: "Sneha Gupta", phone: "+91 65432 10987", address: "33, Ashiana, Patna" },
    items: [
      { name: "Organic Turmeric", qty: 1, price: 120 },
      { name: "Organic Apples (250g)", qty: 2, price: 50 }
    ],
    total: 220,
    status: "new",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    paymentMethod: "Card"
  }
];

const MOCK_WALLET = {
  balance: 12450.75,
  pendingBalance: 840,
  totalEarned: 38920.50
};

const MOCK_TRANSACTIONS = [
  {
    id: "txn-1",
    type: "credit",
    amount: 183.50,
    description: "Order #VO-20248856 earnings",
    date: new Date(Date.now() - 1000 * 60 * 120),
    emoji: "💸"
  },
  {
    id: "txn-2",
    type: "credit",
    amount: 170.75,
    description: "Order #VO-20248890 earnings",
    date: new Date(Date.now() - 1000 * 60 * 45),
    emoji: "💸"
  },
  {
    id: "txn-3",
    type: "debit",
    amount: 50,
    description: "Platform subscription charge",
    date: new Date(Date.now() - 86400000 * 1),
    emoji: "📋"
  },
  {
    id: "txn-4",
    type: "credit",
    amount: 195.00,
    description: "Order #VO-20248721 earnings",
    date: new Date(Date.now() - 86400000 * 2),
    emoji: "💸"
  },
  {
    id: "txn-5",
    type: "credit",
    amount: 320.00,
    description: "Order #VO-20248700 earnings",
    date: new Date(Date.now() - 86400000 * 3),
    emoji: "💸"
  },
  {
    id: "txn-6",
    type: "debit",
    amount: 999,
    description: "Onboarding fee",
    date: new Date(Date.now() - 86400000 * 30),
    emoji: "🏪"
  }
];

// Monthly data for charts
const MOCK_MONTHLY_DATA = {
  labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
  revenue: [4200, 5100, 7800, 6200, 8400, 9100, 12450],
  orders: [42, 51, 78, 62, 84, 91, 67]
};

const MOCK_MONTHLY_DATA_12 = {
  labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
  revenue: [2100, 2800, 3200, 3800, 4100, 4200, 5100, 7800, 6200, 8400, 9100, 12450],
  orders: [21, 28, 32, 38, 41, 42, 51, 78, 62, 84, 91, 67]
};
