/**
 * wallet.js
 * Wallet balance and transaction history
 */

let _wallet = IS_DEMO_MODE ? { ...MOCK_WALLET } : { balance: 0, pendingBalance: 0, totalEarned: 0 };
let _transactions = IS_DEMO_MODE ? [...MOCK_TRANSACTIONS] : [];

// ─── Load Wallet from Firebase ───
function loadWalletFromFirebase() {
  if (!db || !currentVendor) return;

  // Wallet main document
 /* db.doc(`vendors/${currentVendor.uid}/wallet/main`).onSnapshot(snap => {
    if (snap.exists) {
      _wallet = snap.data();
    }
    renderWallet();
  });

  // Transactions subcollection
  db.collection(`vendors/${currentVendor.uid}/wallet/main/transactions`)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(snap => {
      _transactions = [];
      snap.forEach(doc => {
        const txn = { id: doc.id, ...doc.data() };
        if (txn.createdAt?.toDate) txn.createdAt = txn.createdAt.toDate();
        _transactions.push(txn);
      });
      renderTransactions();
    });*/
	loadRewardSummary();
}

if (!IS_DEMO_MODE) loadWalletFromFirebase();

// ─── Render Wallet ───
function renderWallet() {
  const wallet = IS_DEMO_MODE ? { ...MOCK_WALLET } : _wallet;

  const balanceEl = document.getElementById('wallet-total');
  const pendingEl = document.getElementById('wallet-pending');
  const earnedEl = document.getElementById('wallet-earned');

  if (balanceEl) {
    balanceEl.textContent = '₹' + (wallet.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }
  if (pendingEl) {
    pendingEl.textContent = '₹' + (wallet.pendingBalance || 0).toLocaleString('en-IN');
  }
  if (earnedEl) {
    earnedEl.textContent = '₹' + (wallet.totalEarned || 0).toLocaleString('en-IN');
  }

  renderTransactions();
}

// ─── Render Transactions ───
function renderTransactions() {
  const container = document.getElementById('txn-list');
  if (!container) return;

  const txns = IS_DEMO_MODE ? MOCK_TRANSACTIONS : _transactions;

  if (txns.length === 0) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:0.88rem;text-align:center;padding:32px">No transactions yet</p>';
    return;
  }

  container.innerHTML = txns.map(txn => `
    <div class="txn-item">
      <div class="txn-left">
        <div class="txn-icon ${txn.type}">${txn.emoji || (txn.type === 'credit' ? '💸' : '📋')}</div>
        <div>
          <div class="txn-desc">${txn.description}</div>
          <div class="txn-date">${formatDate(new Date(txn.date || txn.createdAt))}</div>
        </div>
      </div>
      <div class="txn-amount ${txn.type}">
        ${txn.type === 'credit' ? '+' : '-'}₹${Number(txn.amount).toFixed(2)}
      </div>
    </div>
  `).join('');
}
function loadRewardSummary() {
	console.log("print");
  if (!db || !currentVendor) return;
  console.log("print2");

  db.doc(`vendor/${currentVendor.uid}`)
    .get()
    .then(snap => {
      if (!snap.exists) return;

      const reward = snap.data().reward || {};

      const points = (period) => {
        const data = reward[period] || {};
        return Number(data.points || 0);
      };

      const rewardSummary = {
        today: points('today'),
        week: points('week'),
        month: points('month')
      };

      console.log("Reward Summary:", rewardSummary);

      // ✅ Use month as totalEarned
      _wallet.totalEarned = rewardSummary.month;
	  _wallet.balance = rewardSummary.month
	

      renderWallet();
    })
    .catch(err => {
      console.error("Reward fetch error:", err);
    });
}

