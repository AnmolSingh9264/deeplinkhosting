/**
 * auth.js
 * Handles Firebase Authentication + Demo Mode login
 */

let currentVendor = null;


// ─── Show/Hide Auth Forms ───
function showRegister() {
  //document.getElementById('login-form').classList.add('hidden');
  //document.getElementById('register-form').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('register-form').classList.add('hidden');
  document.getElementById('login-form').classList.remove('hidden');
}

// ─── Login ───
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-error');

  errEl.classList.add('hidden');

  if (!email || !password) {
    errEl.textContent = 'Please enter email and password.';
    errEl.classList.remove('hidden');
    return;
  }

  // Demo mode: any login works
  if (IS_DEMO_MODE || email === 'demo@vendoros.com') {
    currentVendor = { ...MOCK_VENDOR, email };
    currentVendor.name = email.split('@')[0];
    currentVendor.initials = currentVendor.name.slice(0,2).toUpperCase();
    enterDashboard(currentVendor);
    return;
  }

  // Firebase login
  try {
    const btn = document.getElementById('login-btn');
    btn.innerHTML = '<span>Signing in...</span>';
    btn.disabled = true;

    const cred = await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged will handle the rest
  } catch (e) {
    errEl.textContent = friendlyAuthError(e.code);
    errEl.classList.remove('hidden');
    const btn = document.getElementById('login-btn');
    btn.innerHTML = '<span>Sign In</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.disabled = false;
  }
}

// ─── Register ───
async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');

  errEl.classList.add('hidden');

  if (!name || !email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden');
    return;
  }

  if (IS_DEMO_MODE) {
    currentVendor = { ...MOCK_VENDOR, name, email };
    currentVendor.initials = name.slice(0,2).toUpperCase();
    enterDashboard(currentVendor);
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    // Create vendor document in Firestore
    await db.doc(`vendor/${cred.user.uid}`).set({
      name,
      email,
      status: 'active',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Auth state change will handle rest
  } catch (e) {
    errEl.textContent = friendlyAuthError(e.code);
    errEl.classList.remove('hidden');
  }
}

// ─── Logout ───
async function handleLogout() {
  if (!IS_DEMO_MODE && auth) {
    await auth.signOut();
  }
  currentVendor = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('auth-screen').style.display = 'flex';
  // Reset
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  showLogin();
}

// ─── Enter Dashboard ───
function enterDashboard(vendor) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');

  // Update UI with vendor info
  const initials = vendor.initials || vendor.name?.slice(0,2).toUpperCase() || 'VD';
  document.getElementById('vendor-avatar').textContent = initials;
  document.getElementById('topbar-avatar').textContent = initials;
  document.getElementById('vendor-name-sidebar').textContent = vendor.name || vendor.email;

  // Init dashboard
  initDashboard();
}

// ─── Firebase Auth State (if not demo) ───
if (!IS_DEMO_MODE && auth) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Fetch vendor data from Firestore
      try {
        const snap = await db.doc(`vendor/${user.uid}`).get();
        const vendorData = snap.exists ? snap.data() : { name: user.email, email: user.email };
        currentVendor = {
          uid: user.uid,
          email: user.email,
          name: vendorData.name || user.email,
		 
		 percentage: Number(vendorData.percentage || 0),
		  resId: vendorData.resId,
		isActive: vendorData.isActive,
		cateId : vendorData.cateogry_id,
		  platformFee: Number(vendorData.platformFee || 0),
		    paymentGateway: Number(vendorData.paymentGateway || 0),
			 onboardingFee: Number(vendorData.onboardingFee || 0),
fixed: Number(vendorData.fixed || 0),
          initials: (vendorData.name || user.email).slice(0,2).toUpperCase()
        };
        enterDashboard(currentVendor);
		if (!IS_DEMO_MODE) loadProductsFromFirebase();
		if(!IS_DEMO_MODE) loadRewardSummary();
      } catch (e) {
        console.error("Error fetching vendor data:", e);
      }
    }
  });
}

// ─── Helper ───
function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  };
  return map[code] || 'Authentication error. Please try again.';
}
