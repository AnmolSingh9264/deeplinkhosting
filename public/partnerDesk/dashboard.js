/**
 * dashboard.js
 * Main dashboard stats, charts, and navigation
 */

let revenueChartInstance = null;
let ordersChartInstance = null;
let currentSection = 'dashboard';
let isDarkMode = true;

// ─── Navigation ───
function navigate(section) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });

  // Show target section
  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`[data-section="${section}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Update page title
  const titles = {
    dashboard: { title: 'Dashboard', sub: 'Overview of your store performance' },
    orders: { title: 'Orders', sub: 'Manage and track your orders' },
    products: { title: 'Products', sub: 'Manage your product catalog' },
    wallet: { title: 'Wallet', sub: 'Earnings and transaction history' },
    analytics: { title: 'Analytics', sub: 'Performance insights and trends' },
    charges: { title: 'Charges', sub: 'Commission and fee breakdown' }
  };

  const info = titles[section] || titles.dashboard;
  document.getElementById('page-title').textContent = info.title;
  document.getElementById('page-subtitle').textContent = info.sub;

  currentSection = section;

  // Load section-specific data
  if (section === 'analytics') initAnalytics();
  if (section === 'wallet') renderWallet();
  if (section === 'charges') calcEarnings();

  // Close sidebar on mobile
  if (window.innerWidth <= 900) closeSidebar();
}

// ─── Init Dashboard ───
function initDashboard() {
  updateStats();
  renderRecentOrders();
  renderLowStock();
  initMiniCharts();
  loadOrders();
  renderProducts();
  renderWallet();

	    const toggle = document.getElementById("status-toggle");
const label = document.getElementById("status-label");
updateStoreUI(currentVendor.isActive);
toggle.checked = currentVendor.isActive;


toggle.addEventListener("change", () => {
  updateStoreUI(toggle.checked);
});

toggle.addEventListener("click", () => {
  updateStockByToggle(toggle.checked);
});

	
}

// toggle btn functionality

async function updateStoreUI(isOn) {
	const toggle = document.getElementById("status-toggle");
const label = document.getElementById("status-label");
  if (isOn) {
    label.textContent = "Online";
    label.style.color = "#00c853"; // green
  } else {
    label.textContent = "Offline";
    label.style.color = "#aaa"; // gray
  }
  
  
  
    const userRef = db.doc(`vendor/${currentVendor.uid}`);

await userRef.update({
  isActive: toggle.checked   // or false
});

  // Save state
 // localStorage.setItem("storeStatus", isOn ? "online" : "offline");
}
async function updateStockByToggle(value) {
  const productsRef = db.collection("products");

  let query;

  if (value === true) {
    // Only products with stock -2
    query = productsRef
      .where("resId", "==", currentVendor.resId)
      .where("stock", "==", -2);
  } else {
    // All products of this resId
    query = productsRef
      .where("resId", "==", currentVendor.resId)
	  .where("stock", ">", 0);
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log("No products found");
    return;
  }

  const batch = db.batch();

  snapshot.forEach(doc => {
    const productRef = productsRef.doc(doc.id);

    batch.update(productRef, {
      stock: value ? 100 : -2
    });
  });

  await batch.commit();

 // console.log("Stock updated successfully");
}

// ─── Stats ───
function updateStats() {
  const orders = IS_DEMO_MODE ? MOCK_ORDERS : window._orders || [];
  const products = IS_DEMO_MODE ? MOCK_PRODUCTS : window._products || [];
  const wallet = IS_DEMO_MODE ? MOCK_WALLET : window._wallet || { balance: 0, pendingBalance: 0 };

  const totalOrders = orders.length;
  const activeProducts = products.filter(p => p.status === 'approved').length;
  const totalEarnings = wallet.balance || 0;
  const pendingEarnings = wallet.pendingBalance || 0;

  animateNumber('stat-earnings', totalEarnings, '₹');
  animateNumber('stat-orders', totalOrders);
  animateNumber('stat-products', activeProducts);
  animateNumber('stat-pending', pendingEarnings, '₹');
}

function animateNumber(id, target, prefix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 800;
  const step = (timestamp) => {
    if (!step.startTime) step.startTime = timestamp;
    const progress = Math.min((timestamp - step.startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = prefix + current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─── Recent Orders ───
function renderRecentOrders() {
  const orders = IS_DEMO_MODE ? MOCK_ORDERS : (window._orders || []);
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  const recent = [...orders].slice(0, 4);
  if (recent.length === 0) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:0.85rem;text-align:center;padding:20px">No orders yet</p>';
    return;
  }

  container.innerHTML = recent.map(o => {
  const addr = JSON.parse(o.address || '{}');

  return `
    <div class="recent-order-item">
      <div>
        <div class="order-id">#${o.orderId}</div>
        <div style="font-size:0.78rem;color:var(--text-3);margin-top:2px">
          ${addr.fullName || 'Unknown'}
        </div>
      </div>
      <div style="text-align:right">
        <div class="order-amount">₹${o.total}</div>
        <span class="order-status-badge badge-${o.status === 'new' ? 'new' : 'accepted'}" style="font-size:0.7rem">
          ${o.status}
        </span>
      </div>
    </div>
  `;
}).join('');
}

// ─── Low Stock ───
function renderLowStock() {
  const products = IS_DEMO_MODE ? MOCK_PRODUCTS : (window._products || []);
  const container = document.getElementById('low-stock-list');
  if (!container) return;

  const lowStock = products.filter(p => Number(p.stock) <= 3 && p.status === 'approved');

  if (lowStock.length === 0) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:0.85rem;text-align:center;padding:20px">✅ All products have sufficient stock</p>';
    return;
  }

  container.innerHTML = lowStock.map(p => `
    <div class="low-stock-item">
      <span>${p.emoji || '📦'} ${p.name}</span>
      <span class="stock-badge">${p.stock} left</span>
    </div>
  `).join('');
}

// ─── Mini Charts ───
function initMiniCharts() {
	const data = getMonthlyAnalyticsData();
  initRevenueChart(6, data);
  initOrdersTrendChart(data);
}

function getChartDefaults() {
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  return {
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    textColor: isDark ? '#5a5a78' : '#8a8aaa',
  };
}

function initRevenueChart(months = 6, fullData) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas || !fullData) return;

  const { gridColor, textColor } = getChartDefaults();

  // 👉 slice last N months
  const labels = fullData.labels.slice(-months);
  const revenue = fullData.revenue.slice(-months);

  if (revenueChartInstance) revenueChartInstance.destroy();

  revenueChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Revenue (₹)',
        data: revenue,
        borderColor: '#7c6ef0',
        backgroundColor: 'rgba(124,110,240,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c6ef0',
        pointBorderColor: 'transparent',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'DM Mono', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Mono', size: 11 },
            callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
          }
        }
      }
    }
  });
}

function initOrdersTrendChart(fullData) {
  const canvas = document.getElementById('ordersChart');
  if (!canvas || !fullData) return;

  const { gridColor, textColor } = getChartDefaults();

  const labels = fullData.labels.slice(-6);
  const orders = fullData.orders.slice(-6);

  if (ordersChartInstance) ordersChartInstance.destroy();

  ordersChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Orders',
        data: orders,
        backgroundColor: 'rgba(59,168,239,0.7)',
        borderColor: '#3ba8ef',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'DM Mono', size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'DM Mono', size: 11 } } }
      }
    }
  });
}

function updateRevenueChart(val) {
  initRevenueChart(Number(val));
}

// ─── Theme Toggle ───
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  document.getElementById('theme-icon').textContent = isDarkMode ? '☀️' : '🌙';
  document.getElementById('theme-label').textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';

  // Re-render charts for new theme
  setTimeout(() => {
    initMiniCharts();
    if (currentSection === 'analytics') initAnalytics();
  }, 50);
}

// ─── Sidebar ───
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');

  let overlay = document.getElementById('sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('active');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

// Close sidebar button
document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);

// ─── Notifications ───
const notifications = [];

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  panel.classList.toggle('hidden');
}

function addNotification(text) {
  const notif = { text, time: new Date() };
  notifications.unshift(notif);

  // Update badge
  const countEl = document.getElementById('notif-count');
  countEl.textContent = notifications.length;
  countEl.classList.remove('hidden');

  // Update badge on orders nav
  const ordersBadge = document.getElementById('orders-badge');
  const newOrders = (IS_DEMO_MODE ? MOCK_ORDERS : (window._orders || [])).filter(o => o.status === 'new').length;
  if (newOrders > 0) {
    ordersBadge.textContent = newOrders;
    ordersBadge.classList.remove('hidden');
  }

  renderNotifications();

  // Play sound
  try {
    const audio = document.getElementById('notif-sound');
    if (audio) audio.play().catch(() => {});
  } catch (e) {}
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (notifications.length === 0) {
    list.innerHTML = '<p class="empty-notif">No new notifications</p>';
    return;
  }

  list.innerHTML = notifications.slice(0, 10).map(n => `
    <div class="notif-item">
      <div class="notif-dot"></div>
      <div>
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${timeAgo(n.time)}</div>
      </div>
    </div>
  `).join('');
}

function clearNotifications() {
  notifications.length = 0;
  document.getElementById('notif-count').classList.add('hidden');
  renderNotifications();
}

// Close notif panel on outside click
document.addEventListener('click', (e) => {
  const panel = document.getElementById('notif-panel');
  const bell = document.querySelector('.notif-bell');
  if (panel && !panel.classList.contains('hidden') &&
      !panel.contains(e.target) && !bell.contains(e.target)) {
    panel.classList.add('hidden');
  }
});

// ─── Utility ───
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds/60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds/3600) + 'h ago';
  return Math.floor(seconds/86400) + 'd ago';
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ─── Demo: simulate new order notification ───
setTimeout(() => {
  if (IS_DEMO_MODE || true) {
    addNotification('🛒 New order #VO-20248921 received — ₹220');
    addNotification('🛒 New order #VO-20248810 received — ₹220');
    updateStats();
  }
}, 1500);
