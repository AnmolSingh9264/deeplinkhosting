/**
 * firebase-config.js
 * Firebase initialization and Firestore Security Rules
 *
 * HOW TO SETUP:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication → Email/Password
 * 4. Enable Firestore Database
 * 5. Replace the config below with your project's config
 * 6. Deploy Firestore Security Rules (see bottom of this file)
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDi2NZbZ4WDnJpdz4xYSKa_L9hI8LOVZy0",
  authDomain: "zelo-india-c735f.firebaseapp.com",
  projectId: "zelo-india-c735f",
  storageBucket: "zelo-india-c735f.firebasestorage.app",
  messagingSenderId: "562023417032",
  appId: "1:562023417032:web:9c632307a8aa7a287291fd"
};

// ===== DEMO MODE DETECTION =====
// If Firebase config is not set, use mock/demo mode
const IS_DEMO_MODE = FIREBASE_CONFIG.apiKey === "API";

let db = null;
let auth = null;
let firebase_app = null;

if (!IS_DEMO_MODE) {
  try {
    firebase_app = firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("✅ Firebase initialized");
  } catch (e) {
    console.warn("Firebase init failed, falling back to demo mode:", e);
  }
}

if (IS_DEMO_MODE) {
  console.log("🎯 Running in DEMO MODE — using mock data");
}

/**
 * FIRESTORE DATABASE STRUCTURE
 * ─────────────────────────────
 * /vendors/{vendorId}
 *   ├── name: string
 *   ├── email: string
 *   ├── status: "active" | "inactive" | "suspended"
 *   ├── createdAt: timestamp
 *   ├── /products/{productId}
 *   │     ├── brand, name, price, oldPrice, description
 *   │     ├── image, stock, volume, tags, searchKeywords
 *   │     ├── variants: [] (optional)
 *   │     ├── status: "pending_approval" | "approved" | "updated_pending_review" | "disabled"
 *   │     ├── created_at, updated_at: timestamp
 *   ├── /orders/{orderId}
 *   │     ├── orderNumber, customer, items: []
 *   │     ├── total, status, createdAt
 *   │     ├── address, paymentMethod
 *   ├── /wallet/{walletId}  (single doc: "main")
 *   │     ├── balance: number (NEVER write from client)
 *   │     ├── pendingBalance: number
 *   │     ├── totalEarned: number
 *   │     ├── /transactions/{txnId}
 *   │           ├── type: "credit" | "debit"
 *   │           ├── amount, description, orderId
 *   │           ├── createdAt: timestamp
 */

/**
 * FIRESTORE SECURITY RULES
 * ─────────────────────────
 * Deploy these via: Firebase Console → Firestore → Rules
 * OR via CLI: firebase deploy --only firestore:rules
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *
 *     // Vendor can only access their own data
 *     match /vendors/{vendorId} {
 *       allow read, write: if request.auth != null && request.auth.uid == vendorId;
 *
 *       // Products
 *       match /products/{productId} {
 *         allow read: if request.auth != null && request.auth.uid == vendorId;
 *         allow create: if request.auth.uid == vendorId
 *           && request.resource.data.status == "pending_approval"
 *           && !("walletBalance" in request.resource.data);
 *         allow update: if request.auth.uid == vendorId
 *           && !("walletBalance" in request.resource.data)
 *           && request.resource.data.status in ["updated_pending_review", "disabled", "approved"];
 *         allow delete: if request.auth.uid == vendorId;
 *       }
 *
 *       // Orders (vendor can read their orders, status update only)
 *       match /orders/{orderId} {
 *         allow read: if request.auth.uid == vendorId;
 *         allow update: if request.auth.uid == vendorId
 *           && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'acceptedAt']);
 *       }
 *
 *       // Wallet — READ ONLY from client, writes via Cloud Functions only
 *       match /wallet/main {
 *         allow read: if request.auth.uid == vendorId;
 *         allow write: if false; // Only Cloud Functions can write wallet data
 *       }
 *
 *       match /wallet/main/transactions/{txnId} {
 *         allow read: if request.auth.uid == vendorId;
 *         allow write: if false; // Cloud Functions only
 *       }
 *     }
 *
 *     // Default: deny everything else
 *     match /{document=**} {
 *       allow read, write: if false;
 *     }
 *   }
 * }
 */

/**
 * CLOUD FUNCTIONS (index.js)
 * ───────────────────────────
 * const functions = require("firebase-functions");
 * const admin = require("firebase-admin");
 * admin.initializeApp();
 *
 * // Triggered when vendor accepts an order
 * exports.onOrderAccepted = functions.firestore
 *   .document("vendors/{vendorId}/orders/{orderId}")
 *   .onUpdate(async (change, context) => {
 *     const before = change.before.data();
 *     const after = change.after.data();
 *
 *     if (before.status !== "accepted" && after.status === "accepted") {
 *       const { vendorId } = context.params;
 *       const orderTotal = after.total;
 *
 *       // Calculate earnings
 *       const commission = orderTotal * 0.10;
 *       const platformFee = 5;
 *       const paymentGateway = orderTotal * 0.02;
 *       const vendorEarnings = orderTotal - commission - platformFee - paymentGateway;
 *
 *       const db = admin.firestore();
 *       const walletRef = db.doc(`vendors/${vendorId}/wallet/main`);
 *
 *       await db.runTransaction(async (t) => {
 *         const walletDoc = await t.get(walletRef);
 *         const current = walletDoc.exists ? walletDoc.data().balance : 0;
 *
 *         t.set(walletRef, {
 *           balance: current + vendorEarnings,
 *           totalEarned: (walletDoc.data()?.totalEarned || 0) + vendorEarnings,
 *           pendingBalance: 0,
 *           updatedAt: admin.firestore.FieldValue.serverTimestamp()
 *         }, { merge: true });
 *
 *         // Log transaction
 *         const txnRef = walletRef.collection("transactions").doc();
 *         t.set(txnRef, {
 *           type: "credit",
 *           amount: vendorEarnings,
 *           description: `Order #${after.orderNumber} earnings`,
 *           orderId: context.params.orderId,
 *           breakdown: { commission, platformFee, paymentGateway },
 *           createdAt: admin.firestore.FieldValue.serverTimestamp()
 *         });
 *       });
 *     }
 *   });
 */
