/**
 * products.js
 * Product management — add, edit, filter, search
 */

let _products = IS_DEMO_MODE ? [...MOCK_PRODUCTS] : [];
let _editingProductId = null;
let _productType = 'simple';
let _productFilter = 'all';
let _productSearch = '';
let _variantCount = 0;
let productListeners = [];

// ─── Load Products ───
function loadProductsFromFirebase() {
	console.log("execute");
	const vendorId = auth.currentUser?.uid;
  if (!db || !currentVendor) return;
  	console.log("2");

  const unsubscribe = db.collection(`vendor/${currentVendor.uid}/products`)
    .orderBy('created_at', 'desc')
    .onSnapshot(snap => {
      _products = [];
      snap.forEach(doc => _products.push({ id: doc.id, ...doc.data() }));
      window._products = _products;
      renderProducts();
      renderLowStock();
      updateStats();
    });
	


  productListeners.push(unsubscribe);
}

//if (!IS_DEMO_MODE) loadProductsFromFirebase();

// ─── Render Products ───
function renderProducts() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  let filtered = [..._products];

  // Filter by status
  if (_productFilter !== 'all') {
    filtered = filtered.filter(p => p.status === _productFilter);
  }

  // Search
  if (_productSearch) {
    const q = _productSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.searchKeywords || []).some(k => k.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-3)">
        <div style="font-size:3rem;margin-bottom:12px">📦</div>
        <p style="font-size:0.95rem">No products found</p>
        <button class="btn-primary" style="margin-top:16px;display:inline-flex" onclick="openAddProduct()">+ Add Your First Product</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => renderProductCard(p)).join('');
}

function renderProductCard(p) {
  const stock = Number(p.stock);
  const isLowStock = stock <= 3;
  const isOutOfStock = stock === 0;

  const statusMap = {
    approved: { label: '🟢 Approved', cls: 'badge-approved' },
    pending_approval: { label: '🟡 Pending', cls: 'badge-pending-approval' },
    updated_pending_review: { label: '🔵 Under Review', cls: 'badge-updated-review' },
    disabled: { label: '⚫ Disabled', cls: 'badge-disabled' }
  };

  const statusInfo = statusMap[p.status] || statusMap.pending_approval;

  return `
    <div class="product-card">
      <div class="product-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.parentElement.innerHTML='${p.emoji || '📦'}'"/>` : `<span style="font-size:3rem">${p.emoji || '📦'}</span>`}
      </div>
      <div class="product-body">
        <div class="product-brand">${p.brand || 'No Brand'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price-row">
          <span class="product-price">₹${p.price}</span>
          ${p.oldPrice ? `<span class="product-old-price">₹${p.oldPrice}</span>` : ''}
          ${p.volume ? `<span style="font-size:0.75rem;color:var(--text-3)">${p.volume}</span>` : ''}
        </div>
        ${isLowStock || isOutOfStock ? `
          <div class="low-stock-warn">
            ⚠️ ${isOutOfStock ? 'Out of stock' : `Low stock — only ${stock} left`}
          </div>
        ` : ''}
        <div class="product-meta">
          <span style="font-family:var(--font-mono)">Stock: ${stock}</span>
          <span class="approval-badge ${statusInfo.cls}">${statusInfo.label}</span>
        </div>
        ${p.variants ? `<div style="font-size:0.78rem;color:var(--text-3);margin-bottom:10px">📐 ${p.variants.length} variants</div>` : ''}
     <div class="product-actions">

  <!-- ✏️ Edit (allowed for pending + approved) -->
  ${(p.status === 'pending_approval' || 
     p.status === 'updated_pending_review' || 
     p.status === 'approved') ? `
    <button class="btn-sm" onclick="openEditProduct('${p.id}')">✏️ Edit</button>
  ` : ''}
  
   <!-- 🚫 Disable (ONLY if approved) -->
  ${p.status === 'approved' ? `
    <button class="btn-sm" onclick="toggleProductStatus('${p.id}')">
      🚫 Disable
    </button>
  ` : ''}

  <!-- ✅ Enable (ONLY if disabled) -->
  ${p.status === 'disabled' ? `
    <button class="btn-sm" onclick="toggleProductStatus('${p.id}')">
      ✅ Enable
    </button>
  ` : ''}

  <!-- 🚫 Disable (ONLY for approved) -->
 <!-- ${p.status === 'approved' ? `
    <button class="btn-sm" onclick="toggleProductStatus('${p.id}')">
      🚫 Disable
    </button>
  ` : ''} -->

  <!-- 🗑 Delete (optional logic) -->
 ${p.status === 'pending_approval' || p.status === 'approved' ? `
  <button class="btn-sm danger" onclick="deleteProduct('${p.id}')">🗑</button>
` : ''}

</div>
      </div>
    </div>
  `;
}

// ─── Search & Filter ───
function searchProducts(val) {
  _productSearch = val;
  renderProducts();
}

function filterProducts(val) {
  _productFilter = val;
  renderProducts();
}

// ─── Open Add Modal ───
function openAddProduct() {
  _editingProductId = null;
  _variantCount = 0;
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  clearProductForm();
  switchProductType('simple');
  document.getElementById('product-modal').classList.remove('hidden');
}

// ─── Open Edit Modal ───
function openEditProduct(productId) {
  const product = _products.find(p => p.id === productId);
  if (!product) return;

  _editingProductId = productId;
  document.getElementById('product-modal-title').textContent = 'Edit Product';

  // Fill form
  document.getElementById('p-brand').value = product.brand || '';
  document.getElementById('p-name').value = product.name || '';
  document.getElementById('p-price').value = product.price || '';
  document.getElementById('p-old-price').value = product.oldPrice || '';
  document.getElementById('p-stock').value = product.stock || 0;
  document.getElementById('p-volume').value = product.volume || '';
  document.getElementById('p-image').value = product.image || '';
  document.getElementById('p-desc').value = product.description || '';
  document.getElementById('p-tags').value = (product.tags || []).join(', ');
  document.getElementById('p-keywords').value = (product.searchKeywords || []).join(', ');

  // Set type
  if (product.variants) {
    switchProductType('variant');
    // Render variants
    document.getElementById('variants-list').innerHTML = '';
    _variantCount = 0;
    product.variants.forEach(v => addVariantRow(v));
  } else {
    switchProductType('simple');
  }

  document.getElementById('product-modal').classList.remove('hidden');
}

// ─── Product Type Switch ───
function switchProductType(type) {
  _productType = type;
  const tabs = document.querySelectorAll('.tab-mini');
  tabs[0].classList.toggle('active', type === 'simple');
  tabs[1].classList.toggle('active', type === 'variant');

  const variantsSection = document.getElementById('variants-section');
  if (type === 'variant') {
    variantsSection.classList.remove('hidden');
    if (_variantCount === 0) addVariantRow();
  } else {
    variantsSection.classList.add('hidden');
  }
}

// ─── Variant Rows ───
function addVariantRow(data = null) {
  _variantCount++;
  const id = _variantCount;
  const row = document.createElement('div');
  row.className = 'variant-row';
  row.id = `variant-row-${id}`;
  row.innerHTML = `
    <div class="field-group" style="margin:0">
      <label>Title</label>
      <input type="text" id="v-title-${id}" placeholder="e.g. 500 g" value="${data?.title || ''}" />
    </div>
    <div class="field-group" style="margin:0">
      <label>Price (₹)</label>
      <input type="number" id="v-price-${id}" placeholder="0" value="${data?.price || ''}" />
    </div>
    <div class="field-group" style="margin:0">
      <label>Old Price</label>
      <input type="number" id="v-old-${id}" placeholder="0" value="${data?.oldPrice || ''}" />
    </div>
    <button class="btn-icon" onclick="removeVariantRow(${id})">✕</button>
  `;
  document.getElementById('variants-list').appendChild(row);
}

function removeVariantRow(id) {
  document.getElementById(`variant-row-${id}`)?.remove();
}

// ─── Save Product ───
async function saveProduct() {
  const name = document.getElementById('p-name').value.trim();
  const price = document.getElementById('p-price').value.trim();
  const stock = document.getElementById('p-stock').value.trim();

  if (!name || !price || stock === '') {
    showToast('⚠️ Please fill in Name, Price, and Stock.', 'error');
    return;
  }

  const tagsRaw = document.getElementById('p-tags').value;
  const keywordsRaw = document.getElementById('p-keywords').value;

  const productData = {
    brand: document.getElementById('p-brand').value.trim(),
    name,
    price,
    oldPrice: document.getElementById('p-old-price').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    image: document.getElementById('p-image').value.trim(),
    stock: Number(stock),
    volume: document.getElementById('p-volume').value.trim(),
    tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
    searchKeywords: keywordsRaw.split(',').map(k => k.trim()).filter(Boolean),
    status: _editingProductId ? 'updated_pending_review' : 'pending_approval'
  };

  // Add variants if variant type
  if (_productType === 'variant') {
    productData.variants = [];
    document.querySelectorAll('[id^="variant-row-"]').forEach(row => {
      const id = row.id.replace('variant-row-', '');
      const title = document.getElementById(`v-title-${id}`)?.value.trim();
      const vPrice = document.getElementById(`v-price-${id}`)?.value.trim();
      const oldPrice = document.getElementById(`v-old-${id}`)?.value.trim();
      if (title && vPrice) {
        productData.variants.push({ id, title, price: vPrice, oldPrice });
      }
    });
  }

  if (IS_DEMO_MODE) {
    if (_editingProductId) {
      const idx = _products.findIndex(p => p.id === _editingProductId);
      if (idx !== -1) {
        _products[idx] = { ..._products[idx], ...productData, updated_at: new Date() };
      }
      showToast('✅ Product updated! Awaiting review.');
    } else {
      const newProduct = {
        id: 'prod-' + Date.now(),
        ...productData,
        emoji: getProductEmoji(productData.name),
        created_at: new Date()
      };
      _products.unshift(newProduct);
      showToast('✅ Product added! Awaiting approval.');
    }
    renderProducts();
    renderLowStock();
    updateStats();
    closeProductModal();
    return;
  }

  // Firestore
  try {
    if (_editingProductId) {
      productData.updated_at = firebase.firestore.FieldValue.serverTimestamp();
      await db.doc(`vendor/${currentVendor.uid}/products/${_editingProductId}`).update(productData);
      showToast('✅ Product updated! Awaiting review.');
    } else {
      productData.created_at = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(`vendor/${currentVendor.uid}/products`).add(productData);
      showToast('✅ Product added! Awaiting approval.');
    }
    closeProductModal();
  } catch (e) {
    console.error('Error saving product:', e);
    showToast('❌ Failed to save product.', 'error');
  }
}

// ─── Toggle Product Status ───
async function toggleProductStatus(productId) {
  const product = _products.find(p => p.id === productId);
  if (!product) return;

  const newStatus = product.status === 'disabled' ? 'approved' : 'disabled';

  if (IS_DEMO_MODE) {
    product.status = newStatus;
    renderProducts();
    showToast(`✅ Product ${newStatus === 'disabled' ? 'disabled' : 'enabled'}.`);
    return;
  }

  try {
    await db.doc(`vendor/${currentVendor.uid}/products/${productId}`).update({ status: newStatus });
  } catch (e) {
    showToast('❌ Failed to update product status.', 'error');
  }
}

// ─── Delete Product ───
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  if (IS_DEMO_MODE) {
    const idx = _products.findIndex(p => p.id === productId);
    if (idx !== -1) _products.splice(idx, 1);
    renderProducts();
    showToast('🗑 Product deleted.');
    return;
  }

  try {
    //await db.doc(`vendor/${currentVendor.uid}/products/${productId}`).delete();
	 await db.doc(`vendor/${currentVendor.uid}/products/${productId}`).update({ status: 'deleted' });
    showToast('🗑 Product deleted.');
  } catch (e) {
    showToast('❌ Failed to delete product.', 'error');
  }
}

// ─── Close Modal ───
function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  _editingProductId = null;
  clearProductForm();
}

function clearProductForm() {
  ['p-brand','p-name','p-price','p-old-price','p-stock','p-volume','p-image','p-desc','p-tags','p-keywords'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('variants-list').innerHTML = '';
  _variantCount = 0;
}

document.getElementById('product-modal')?.addEventListener('click', function(e) {
  if (e.target === this) closeProductModal();
});

// ─── Helper ───
function getProductEmoji(name) {
  const map = { milk: '🥛', apple: '🍎', bread: '🍞', paneer: '🧀', cheese: '🧀', yogurt: '🫙', curd: '🫙', turmeric: '🌿', rice: '🍚', egg: '🥚', chicken: '🍗', fish: '🐟', mango: '🥭', banana: '🍌', tomato: '🍅', potato: '🥔', onion: '🧅' };
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return '📦';
}
