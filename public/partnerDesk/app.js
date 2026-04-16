/**
 * app.js
 * Global utilities: toast, charges calculator, app initialization
 */

// ─── Charges Calculator ───
function calcEarnings() {
  const orderVal = Number(document.getElementById('calc-order-val')?.value) || 0;
  const areaSurcharge = Number(document.getElementById('calc-area')?.value) || 0;

  if (!currentVendor) return;

  const percentage = Number(currentVendor.percentage || 0);
  const fixed = Number(currentVendor.fixed || 0);
   const platformFee = Number(currentVendor.platformFee || 0);
     const paymentGatewayvalue = Number(currentVendor.paymentGateway || 0);

  // ✅ Commission logic
  let commission = 0;

  if (!percentage && !fixed) {
    commission = 0;
  } else if (percentage > 0) {
    commission = (orderVal * percentage) / 100;
  } else if (fixed > 0) {
    commission = fixed;
  }

  const paymentGateway = orderVal * paymentGatewayvalue;

  const earned = orderVal - commission - paymentGateway - areaSurcharge;

  const fmt = (v) => '₹' + Math.max(0, v).toFixed(2);
  const fmtNeg = (v) => '-₹' + v.toFixed(2);

  const safe = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  safe('c-val', fmt(orderVal));
  safe('c-comm', fmtNeg(commission));
  safe('c-plat', fmtNeg(platformFee)); 
  safe('c-pay', fmtNeg(paymentGateway));
  safe('c-area', fmtNeg(areaSurcharge));
  safe('c-earn', fmt(earned));
  
  let commissionText = '0';
  if (percentage > 0) {
    commissionText = percentage + '%';
  } else if (fixed > 0) {
    commissionText = '₹' + fixed + '/order';
  }
  
   const onboardingFee = Number(currentVendor.onboardingFee || 0);
  
  document.getElementById('fee-onboarding').textContent = `₹${onboardingFee} (one-time)`;
  document.getElementById('fee-commission').textContent = commissionText;
  document.getElementById('fee-platform').textContent = `₹${platformFee}/order`;
  document.getElementById('fee-payment').textContent = `${paymentGatewayvalue * 100}%`;
 
}

// ─── Toast Notifications ───
let toastTimeout = null;

function showToast(message, type = 'success') {
  // Remove existing toast
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === 'error' ? 'var(--red-bg)' : 'var(--green-bg)'};
    border: 1px solid ${type === 'error' ? 'rgba(239,71,71,0.3)' : 'rgba(45,202,115,0.3)'};
    color: ${type === 'error' ? 'var(--red)' : 'var(--green)'};
    padding: 14px 20px;
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.9rem;
    font-weight: 500;
    z-index: 9999;
    box-shadow: var(--shadow);
    max-width: 360px;
    animation: slideIn 0.3s ease;
    backdrop-filter: blur(8px);
  `;
  toast.textContent = message;

  document.body.appendChild(toast);
  toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Keyboard Shortcuts ───
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeOrderModal();
    const notifPanel = document.getElementById('notif-panel');
    if (notifPanel) notifPanel.classList.add('hidden');
  }
});

// ─── Close sidebar overlay on resize ───
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    closeSidebar();
  }
});

// ─── Auto-populate stats on load ───
window.addEventListener('load', () => {
  // Pre-fill demo login for ease of use
  const emailInput = document.getElementById('login-email');
  if (emailInput && IS_DEMO_MODE) {
    emailInput.value = 'demo@vendoros.com';
    document.getElementById('login-password').value = 'demo123';
  }
});

/**
 * DEPLOYMENT INSTRUCTIONS
 * ════════════════════════
 *
 * OPTION A — Static Hosting (GitHub Pages / Netlify / Vercel)
 * ─────────────────────────────────────────────────────────────
 * 1. Update firebase-config.js with your Firebase project credentials
 * 2. Zip the entire project folder
 * 3. Drop into Netlify (netlify.com/drop) OR push to GitHub + connect to Netlify/Vercel
 *
 * OPTION B — Firebase Hosting
 * ─────────────────────────────────────────────────────────────
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init hosting   (choose your project, set public dir to project folder)
 * 4. firebase deploy
 *
 * FIREBASE SETUP CHECKLIST
 * ─────────────────────────────────────────────────────────────
 * □ Create Firebase project at console.firebase.google.com
 * □ Enable Authentication → Email/Password
 * □ Enable Cloud Firestore (production mode)
 * □ Paste Firestore Security Rules from firebase-config.js
 * □ Replace FIREBASE_CONFIG in firebase-config.js with your config
 * □ (Optional) Set up Cloud Functions from the comment in firebase-config.js
 *
 * TESTING WITHOUT FIREBASE
 * ─────────────────────────────────────────────────────────────
 * Just open index.html in a browser — it auto-detects unconfigured Firebase
 * and falls into demo mode with mock data. No setup required!
 */
