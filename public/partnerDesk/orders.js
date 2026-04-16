/**
 * orders.js
 * Order management with real-time updates
 */

let _orders = IS_DEMO_MODE ? [...MOCK_ORDERS] : [];
let currentOrderFilter = 'new';
let orderListeners = [];

// ─── Load Orders ───
function loadOrders() {
  if (IS_DEMO_MODE) {
    renderOrders();
    updateOrderCounts();
    return;
  }

  // Firestore real-time listener
  if (!db || !currentVendor) return;

  
  //const currentDate = new Date().toISOString().split('T')[0];
  const now = new Date();

const currentDate = now.getFullYear() + '-' +
  String(now.getMonth() + 1).padStart(2, '0') + '-' +
  String(now.getDate()).padStart(2, '0');

  const unsubscribe = db
  .collection(`myorders/${currentDate}/order`)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      _orders = [];
      snap.forEach(doc => {
        const order = { id: doc.id, ...doc.data() };
        // Convert Firestore timestamps
        if (order.createdAt?.toDate) order.createdAt = order.createdAt.toDate();
        if (order.acceptedAt?.toDate) order.acceptedAt = order.acceptedAt.toDate();
	
		
	if (currentVendor.resId == null || currentVendor.resId === "") {
  const filteredProducts = (order.products || []).filter(
    p => p.categoryId === currentVendor.cateId
  );

  if (filteredProducts.length === 0) {
    return;
  }

  order.products = filteredProducts;

} else {
  const filteredProducts = (order.products || []).filter(
    p => p.resId === currentVendor.resId
  );

  if (filteredProducts.length === 0) {
    return;
  }

  order.products = filteredProducts;
}

// ✅ Calculate totalPrice
order.total = order.products.reduce((sum, p) => {
  return sum + (Number(p.totalPrice) || 0);
}, 0);
order.total += order.shipping;
		
		 if (order.status !== 'Cancelled') {
		
        _orders.push(order);
		 }
      });

      window._orders = _orders;
      renderOrders();
      updateOrderCounts();
      renderRecentOrders();
      updateStats();

      // Check for new orders and notify
      const newOrders = _orders.filter(o => !o.vendorId);
      if (newOrders.length > 0) {
        newOrders.forEach(o => {
          addNotification(`🛒 New order #${o.orderId} — ₹${o.total}`);
        });
      }
    }, err => console.error("Orders listener error:", err));

  orderListeners.push(unsubscribe);
}

// ─── Render Orders ───
function renderOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  let filtered;
  if (currentOrderFilter === 'New') {
    filtered = _orders.filter(o => !o.vendorId);
  } else if (currentOrderFilter === 'accepted') {
    filtered = _orders.filter(o => o.vendorId === currentVendor.uid);
  } else {
    filtered = [..._orders];
  }

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-3)">
        <div style="font-size:3rem;margin-bottom:12px">📭</div>
        <p style="font-size:0.95rem">No ${currentOrderFilter === 'all' ? '' : currentOrderFilter} orders right now</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(o => renderOrderCard(o)).join('');
}

function renderOrderCard(order) {
	const isNew = !order.vendorId;
const isAcceptedByMe = order.vendorId === currentVendor.uid;
const isTakenByOther = order.vendorId && order.vendorId !== currentVendor.uid;

 const badgeClass = isNew
  ? 'badge-new'
  : isAcceptedByMe
  ? 'badge-accepted'
  : 'badge-taken';

const statusText = isNew
  ? '🔔 New'
  : isAcceptedByMe
  ? '✅ Accepted by You'
  : '🚫 Taken';

const addr = JSON.parse(order.address || '{}');

const name = addr.fullName || 'Unknown';

const fullAddress = [
  addr.apartment,
  addr.streetAddress,
  addr.city,
  addr.state,
  addr.pinCode
].filter(Boolean).join(', ');

const itemsSummary = (order.products || [])
  .map(i => `${i.name} ×${i.quantity}`)
  .join(', ');


// 🚫 CASE: Taken by other vendor (LIMITED VIEW)
if (isTakenByOther) {
  return `
    <div class="order-card taken-order">
      <div>
        <div class="order-top">
          <span class="order-num">#${order.orderId}</span>
          <span class="order-status-badge ${badgeClass}">${statusText}</span>
        </div>

        <div class="order-customer">👤 ${name}</div>

        <div style="font-size:0.8rem;color:var(--red);margin-top:6px">
          🚫 This order is already taken by another vendor
        </div>
      </div>
    </div>
  `;
}


// ✅ CASE: New or Accepted by Me
return `
  <div class="order-card ${isNew ? 'new-order' : ''}" onclick="openOrderModal('${order.id}')">
    
    <div>
      <div class="order-top">
        <span class="order-num">#${order.orderId}</span>
        <span class="order-status-badge ${badgeClass}">${statusText}</span>
      </div>

      <div class="order-customer">👤 ${name}</div>

      <div class="order-items">
        🛍 ${itemsSummary}
      </div>

      <div style="font-size:0.78rem;color:var(--text-3);margin-top:4px">
        📍 ${fullAddress}
      </div>

      ${isNew ? `
        <button class="btn-accept" onclick="event.stopPropagation(); acceptOrder('${order.id}')">
          ✓ Accept Order
        </button>
      ` : `
        <div style="font-size:0.78rem;color:var(--green);margin-top:8px">
          ✅ Accepted ${timeAgo(new Date(order.acceptedAt || order.createdAt))}
        </div>
      `}
    </div>

    <div class="order-right">
      <div class="order-price">₹${order.total}</div>

      <!-- ✅ STATUS BADGE ALSO HERE -->
      <div style="margin-top:6px">
        <span class="order-status-badge ${badgeClass}" style="font-size:0.72rem">
          ${order.status}
        </span>
      </div>

      <div class="order-time" style="margin-top:6px">
        ${timeAgo(new Date(order.createdAt))}
      </div>

      <div style="font-size:0.76rem;color:var(--text-3);margin-top:4px">
        ${order.paymentMethod}
      </div>
    </div>

  </div>
`;
}

// ─── Filter Orders ───
function filterOrders(type) {
  currentOrderFilter = type;

  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.remove('active');
    if (['new', 'accepted', 'all'][i] === type) btn.classList.add('active');
  });

  renderOrders();
}

// ─── Update Counts ───
function updateOrderCounts() {
  const newCount = _orders.filter(o => !o.vendorId).length;
  const acceptedCount = _orders.filter(o => o.vendorId === currentVendor.uid).length;
  const allCount = _orders.length;

  document.getElementById('tab-new-count').textContent = newCount;
  document.getElementById('tab-accepted-count').textContent = acceptedCount;
  document.getElementById('tab-all-count').textContent = allCount;

  // Orders nav badge
  const badge = document.getElementById('orders-badge');
  if (newCount > 0) {
    badge.textContent = newCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ─── Accept Order ───
async function acceptOrder(orderId) {
  const order = _orders.find(o => o.id === orderId);
  if (!order || order.status === 'accepted') return;

  if (IS_DEMO_MODE) {
    order.status = 'accepted';
    order.acceptedAt = new Date();

    // Simulate wallet credit
    const earnings = calculateEarnings(order.total);
    MOCK_WALLET.balance += earnings.vendorEarns;
    MOCK_TRANSACTIONS.unshift({
      id: 'txn-' + Date.now(),
      type: 'credit',
      amount: earnings.vendorEarns,
      description: `Order #${order.orderNumber} earnings`,
      date: new Date(),
      emoji: '💸'
    });

    renderOrders();
    updateOrderCounts();
    renderRecentOrders();
    updateStats();
    renderWallet();
    closeOrderModal();

    showToast(`✅ Order #${order.orderNumber} accepted! You earned ₹${earnings.vendorEarns.toFixed(2)}`);
    return;
  }

  // Firestore update
  try {
	    const currentDate = new Date().toISOString().split('T')[0];
	  
    await db.doc(`vendor/${currentVendor.uid}/orders/${orderId}`).set({
      status: 'accepted',
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
	 await db.doc(`myorders/${currentDate}/order/${orderId}`).update({
      vendorId: currentVendor.uid,
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Cloud function handles wallet credit
    closeOrderModal();
	const vendorEarns = calculateEarnings(order.total).vendorEarns;
	updateRewardAfterTask(vendorEarns); // ₹20 reward
    showToast('✅ Order accepted! Earnings will be credited to your wallet.');
  } catch (e) {
    console.error('Error accepting order:', e);
    showToast('❌ Failed to accept order. Please try again.', 'error');
  }
}
function getTodayKey() {
  return new Date().toISOString().split('T')[0]; // 2026-04-12
}

function getWeekKey() {
  const d = new Date();
  const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
  return firstDay.toISOString().split('T')[0];
}

function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

async function updateRewardAfterTask(taskReward) {
  if (!db || !currentVendor) return;

  showToast("⏳ Wait for your reward...");

  const userRef = db.doc(`vendor/${currentVendor.uid}`);

  // Helpers for keys (you must define these)
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();
  const monthKey = getMonthKey();

  try {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(userRef);

      const reward = snap.data()?.reward || {};

      const today = reward.today || {};
      const week = reward.week || {};
      const month = reward.month || {};

      // ✅ TODAY
      const newTodayCount =
        today.dateKey === todayKey
          ? (today.count || 0) + 1
          : 1;

      const newTodayPoints =
        today.dateKey === todayKey
          ? (today.points || 0) + taskReward
          : taskReward;

      // ✅ WEEK
      const newWeekCount =
        week.weekKey === weekKey
          ? (week.count || 0) + 1
          : 1;

      const newWeekPoints =
        week.weekKey === weekKey
          ? (week.points || 0) + taskReward
          : taskReward;

      // ✅ MONTH
      const newMonthCount =
        month.monthKey === monthKey
          ? (month.count || 0) + 1
          : 1;

      const newMonthPoints =
        month.monthKey === monthKey
          ? (month.points || 0) + taskReward
          : taskReward;

      // ✅ UPDATE
      transaction.update(userRef, {
        reward: {
          today: {
            count: newTodayCount,
            points: newTodayPoints,
            dateKey: todayKey
          },
          week: {
            count: newWeekCount,
            points: newWeekPoints,
            weekKey: weekKey
          },
          month: {
            count: newMonthCount,
            points: newMonthPoints,
            monthKey: monthKey
          }
        }
      });
    });

    showToast("✅ Reward added");
    loadRewardSummary(); // refresh wallet

  } catch (err) {
    console.error(err);
    showToast("❌ Reward error: " + err.message);
  }
}

function calculateEarnings(total) {
	const percentage = Number(currentVendor.percentage || 0);
  const fixed = Number(currentVendor.fixed || 0);
   const platformFee = Number(currentVendor.platformFee || 0);
     const paymentGatewayvalue = Number(currentVendor.paymentGateway || 0);
	 let commission = 0;

  if (!percentage && !fixed) {
    commission = 0;
  } else if (percentage > 0) {
    commission = (total * percentage) / 100;
  } else if (fixed > 0) {
    commission = fixed;
  }


  const paymentGateway = total * paymentGatewayvalue;
  const vendorEarns = total - commission - platformFee - paymentGateway;
  return {
  commission: Math.round(commission),
  platformFee: Math.round(platformFee),
  paymentGateway: Math.round(paymentGateway),
  vendorEarns: Math.round(vendorEarns)
};
}

// ─── Order Modal ───
function openOrderModal(orderId) {
  const order = _orders.find(o => o.id === orderId);
  if (!order) return;
  
   const addr = JSON.parse(order.address || '{}');
   
   const fullAddress = [
  addr.apartment,
  addr.streetAddress,
  addr.city,
  addr.state,
  addr.pinCode
].filter(Boolean).join(', ');

  const e = calculateEarnings(order.total);

  document.getElementById('order-modal-body').innerHTML = `
    <div class="order-detail-header">
      <div>
        <div class="order-detail-id">#${order.orderId}</div>
        <div style="font-size:0.82rem;color:var(--text-3)">${formatDate(new Date(order.createdAt))}</div>
      </div>
      <span class="order-status-badge badge-${order.status === 'new' ? 'new' : 'accepted'}">
        ${order.status === 'new' ? '🔔 New' : '✅ Accepted'}
      </span>
    </div>

    <div style="background:var(--bg-3);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px">
      <div style="font-weight:600;margin-bottom:6px;font-size:0.88rem">Customer</div>
      <div style="font-size:0.88rem;color:var(--text-2)">👤 ${addr.fullName}</div>
      <div style="font-size:0.85rem;color:var(--text-3);margin-top:3px">📞 ${addr.phoneNumber}</div>
      <div style="font-size:0.85rem;color:var(--text-3);margin-top:3px">📍 ${fullAddress}</div>
      <div style="font-size:0.82rem;color:var(--text-3);margin-top:3px">💳 ${order.paymentMethod}</div>
    </div>

   <div class="order-items-list">
  <div style="font-weight:600;margin-bottom:10px;font-size:0.88rem">
    Order Items
  </div>

  ${(order.products || []).map(item => `
    <div class="order-item-row" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      
      <!-- LEFT: Image + Name -->
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${item.image}" 
             style="width:40px;height:40px;border-radius:6px;object-fit:cover;border:1px solid var(--border)" />
        
        <div>
          <div style="font-size:0.85rem">${item.name}</div>
          <div style="font-size:0.75rem;color:var(--text-3)">
            ×${item.quantity}
          </div>
        </div>
      </div>

      <!-- RIGHT: Price -->
      <div style="font-size:0.85rem;font-weight:500">
        ₹${item.price * item.quantity}
      </div>
    </div>
  `).join('')}

  <!-- Subtotal -->
  <div class="order-item-row" style="justify-content:space-between;margin-top:8px">
    <span style="color:var(--text-3)">Subtotal</span>
    <span>₹${order.total - (order.shipping || 0)}</span>
  </div>

  <!-- Shipping -->
  <div class="order-item-row" style="justify-content:space-between">
    <span style="color:var(--text-3)">Shipping</span>
    <span>₹${order.shipping || 0}</span>
  </div>

  <!-- Total -->
  <div class="order-total-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px">
    <span>Total</span>
    <span>₹${order.total}</span>
  </div>
</div>

    <div style="background:var(--accent-glow);border:1px solid var(--accent);border-radius:var(--radius-sm);padding:14px;margin-top:14px">
      <div style="font-size:0.82rem;color:var(--text-2);margin-bottom:8px;font-weight:600">Earnings Breakdown</div>
      <div style="display:flex;justify-content:space-between;font-size:0.83rem;margin-bottom:4px"><span>Commission </span><span style="color:var(--red)">-₹${e.commission.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:0.83rem;margin-bottom:4px"><span>Platform Fee</span><span style="color:var(--red)">-₹${e.platformFee}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:0.83rem;margin-bottom:8px"><span>Payment Gateway </span><span style="color:var(--red)">-₹${e.paymentGateway.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-family:var(--font-display);font-size:1rem;border-top:1px solid var(--accent);padding-top:8px"><span>You Earn</span><span style="color:var(--green)">₹${e.vendorEarns.toFixed(2)}</span></div>
    </div>

    <div class="order-timeline" style="margin-top:20px">
      <div style="font-weight:600;margin-bottom:12px;font-size:0.88rem">Order Timeline</div>
      <div class="timeline-item">
        <div class="timeline-dot" style="background:var(--green)"></div>
        <div>
          <div class="timeline-label">Order Placed</div>
          <div class="timeline-time">${formatDate(new Date(order.createdAt))}</div>
        </div>
      </div>
      ${order.vendorId === currentVendor.uid ? `
        <div class="timeline-item">
          <div class="timeline-dot" style="background:var(--accent)"></div>
          <div>
            <div class="timeline-label">Accepted by Vendor</div>
            <div class="timeline-time">${formatDate(new Date(order.acceptedAt || order.createdAt))}</div>
          </div>
        </div>
      ` : `
        <div class="timeline-item">
          <div class="timeline-dot" style="background:var(--yellow);animation:pulse 1.5s infinite"></div>
          <div>
            <div class="timeline-label">Awaiting Acceptance</div>
            <div class="timeline-time">Pending</div>
          </div>
        </div>
      `}
    </div>
  `;

  document.getElementById('order-modal-footer').innerHTML = order.status === 'new'
    ? `<button class="btn-ghost" onclick="closeOrderModal()">Close</button>
       <button class="btn-primary" onclick="acceptOrder('${order.id}')">✓ Accept Order</button>`
    : `<button class="btn-primary" onclick="closeOrderModal()">Close</button>`;

  document.getElementById('order-modal').classList.remove('hidden');
}

function closeOrderModal() {
  document.getElementById('order-modal').classList.add('hidden');
}

// Close modal on overlay click
document.getElementById('order-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeOrderModal();
});
