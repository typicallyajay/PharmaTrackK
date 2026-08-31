<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pos_helpers.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();

if (!$pharmacy) {
    flash('error', 'No pharmacy profile found for this account.');
    header('Location: ' . base_url('index.php'));
    exit;
}

ensure_pos_schema($pdo);

$error = null;

// Handle sale submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $customerName = trim($_POST['customer_name'] ?? '');
    $customerPhone = trim($_POST['customer_phone'] ?? '');
    $customerEmail = trim($_POST['customer_email'] ?? '');
    $doctorName = trim($_POST['doctor_name'] ?? '');
    $paymentMethod = $_POST['payment_method'] ?? 'cash';
    $discountPercent = (float)($_POST['discount_percent'] ?? 0);
    $taxPercent = (float)($_POST['tax_percent'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');
    $cartJson = $_POST['cart_items'] ?? '[]';

    $cartItems = json_decode($cartJson, true);

    if (empty($cartItems) || !is_array($cartItems)) {
        $error = 'The bill is empty. Please add at least one medicine to checkout.';
    } else {
        try {
            $invoiceId = create_sale_invoice(
                $pdo,
                $pharmacy['pharmacy_id'],
                [
                    'customer_name'  => $customerName,
                    'customer_phone' => $customerPhone,
                    'customer_email' => $customerEmail,
                    'doctor_name'    => $doctorName,
                ],
                $cartItems,
                [
                    'payment_method'   => $paymentMethod,
                    'discount_percent' => $discountPercent,
                    'tax_percent'      => $taxPercent,
                    'notes'            => $notes,
                ]
            );

            // If customer email was provided, dispatch receipt email
            $emailSentNotice = '';
            if (!empty($customerEmail) && filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
                send_invoice_email($pdo, $invoiceId, (int)$pharmacy['pharmacy_id'], $customerEmail);
                $emailSentNotice = " Bill emailed to " . htmlspecialchars($customerEmail) . ".";
            }

            flash('success', 'Sale completed successfully! Invoice generated.' . $emailSentNotice);
            header('Location: ' . base_url('pharmacy/invoice.php?id=' . $invoiceId));
            exit;
        } catch (Exception $e) {
            $error = $e->getMessage();
        }
    }
}

// Fetch available medicine inventory
$stmt = $pdo->prepare('SELECT * FROM stock_entries WHERE pharmacy_id = ? ORDER BY medicine_name ASC');
$stmt->execute([$pharmacy['pharmacy_id']]);
$stock = $stmt->fetchAll();

// Extract unique categories for filtering
$categories = [];
foreach ($stock as $s) {
    if (!empty($s['category']) && !in_array($s['category'], $categories)) {
        $categories[] = $s['category'];
    }
}

$pageTitle = 'Point of Sale (POS) & Billing Counter';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h2 class="mb-0 fw-bold"><i class="bi bi-calculator text-teal me-1"></i> POS &amp; Billing Counter</h2>
    <small class="text-muted"><?= h($pharmacy['pharmacy_name']) ?> &bull; Walk-in sales &amp; live prescription billing</small>
  </div>
  <div class="d-flex gap-2">
    <a href="<?= base_url('pharmacy/invoices.php') ?>" class="btn btn-outline-secondary btn-sm">
      <i class="bi bi-receipt"></i> Sales History
    </a>
    <a href="<?= base_url('pharmacy/dashboard.php') ?>" class="btn btn-outline-secondary btn-sm">
      <i class="bi bi-speedometer2"></i> Dashboard
    </a>
  </div>
</div>

<?php if ($error): ?>
  <div class="alert alert-danger mb-3">
    <i class="bi bi-exclamation-triangle-fill fs-5"></i>
    <div><?= h($error) ?></div>
  </div>
<?php endif; ?>

<div class="pos-container">
  
  <!-- LEFT: Medicine Inventory & Search Panel -->
  <div class="pos-catalog-panel">
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div class="input-group" style="max-width: 360px;">
        <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
        <input type="text" id="posSearchInput" class="form-control border-start-0 ps-0" placeholder="Search medicine name or generic formula..." autofocus>
      </div>

      <span class="small text-muted">
        <strong><?= count($stock) ?></strong> items in store catalog
      </span>
    </div>

    <?php if (!empty($categories)): ?>
      <div class="category-pills mb-3">
        <button type="button" class="category-pill active" data-category="all">All</button>
        <?php foreach ($categories as $cat): ?>
          <button type="button" class="category-pill" data-category="<?= h($cat) ?>">
            <?= h($cat) ?>
          </button>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if (empty($stock)): ?>
      <div class="empty-state py-5">
        <div class="empty-icon"><i class="bi bi-box-seam text-muted"></i></div>
        <h5>No medicines in inventory</h5>
        <p class="text-muted mb-3">Add stock items first to start creating sales bills.</p>
        <a href="<?= base_url('pharmacy/stock_form.php') ?>" class="btn btn-amber">
          <i class="bi bi-plus-lg"></i> Add Medicine
        </a>
      </div>
    <?php else: ?>
      <div class="pos-item-grid" id="posItemGrid">
        <?php foreach ($stock as $s): 
          $isOutOfStock = (int)$s['quantity'] <= 0;
        ?>
          <div class="pos-item-card <?= $isOutOfStock ? 'out-of-stock' : '' ?>"
               data-id="<?= $s['stock_id'] ?>"
               data-name="<?= h($s['medicine_name']) ?>"
               data-generic="<?= h($s['generic_name'] ?? '') ?>"
               data-category="<?= h($s['category'] ?? '') ?>"
               data-price="<?= (float)$s['price'] ?>"
               data-stock="<?= (int)$s['quantity'] ?>">
            
            <div>
              <div class="d-flex justify-content-between align-items-start mb-1">
                <div class="fw-bold text-dark text-truncate" title="<?= h($s['medicine_name']) ?>">
                  <?= h($s['medicine_name']) ?>
                </div>
                <span class="badge <?= $isOutOfStock ? 'badge-out' : ($s['quantity'] <= 10 ? 'badge-low' : 'badge-instock') ?>">
                  <?= $isOutOfStock ? '0' : (int)$s['quantity'] ?>
                </span>
              </div>

              <?php if (!empty($s['generic_name'])): ?>
                <div class="small text-muted text-truncate mb-2" style="font-size: 11px;">
                  <?= h($s['generic_name']) ?>
                </div>
              <?php endif; ?>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <span class="fw-bold text-teal fs-6">₹<?= number_format((float)$s['price'], 2) ?></span>
              <button type="button" class="btn btn-sm <?= $isOutOfStock ? 'btn-outline-secondary' : 'btn-primary' ?> py-1 px-2 btn-add-pos" <?= $isOutOfStock ? 'disabled' : '' ?>>
                <i class="bi bi-plus-lg"></i> Add
              </button>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <!-- RIGHT: Active Bill Cart & Checkout -->
  <div class="pos-cart-panel">
    <form method="POST" id="posCheckoutForm">
      <input type="hidden" name="cart_items" id="cartItemsInput" value="[]">
      <input type="hidden" name="payment_method" id="paymentMethodInput" value="cash">

      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0 text-teal"><i class="bi bi-cart3 me-1"></i> Current Bill</h5>
        <button type="button" id="clearCartBtn" class="btn btn-sm btn-outline-danger py-0 px-2" style="display:none;">
          <i class="bi bi-trash"></i> Clear
        </button>
      </div>

      <!-- Customer Details Form -->
      <div class="bg-teal-ghost p-3 rounded-3 mb-3">
        <div class="row g-2">
          <div class="col-12">
            <input type="text" name="customer_name" class="form-control form-control-sm bg-white" placeholder="Customer Name (e.g. Ramesh Kumar)">
          </div>
          <div class="col-6">
            <input type="tel" name="customer_phone" class="form-control form-control-sm bg-white" maxlength="10" placeholder="Mobile No.">
          </div>
          <div class="col-6">
            <input type="text" name="doctor_name" class="form-control form-control-sm bg-white" placeholder="Doctor (optional)">
          </div>
          <div class="col-12">
            <div class="input-group input-group-sm">
              <span class="input-group-text bg-white"><i class="bi bi-envelope text-muted"></i></span>
              <input type="email" name="customer_email" class="form-control form-control-sm bg-white" placeholder="Customer Email (optional - sends e-receipt)">
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items List -->
      <div class="pos-cart-items-wrapper">
        <table class="table pos-cart-table table-borderless mb-0">
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-center" style="width: 100px;">Qty</th>
              <th class="text-end" style="width: 70px;">Price</th>
              <th style="width: 30px;"></th>
            </tr>
          </thead>
          <tbody id="cartTableBody">
            <tr id="emptyCartRow">
              <td colspan="4" class="text-center text-muted py-4">
                <i class="bi bi-cart-x fs-3 d-block mb-1 opacity-50"></i>
                Bill is empty. Click <strong>+ Add</strong> on medicine items.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Billing Summary & Discounts -->
      <div class="border-top pt-2 mb-3">
        <div class="pos-summary-row">
          <span class="text-muted">Subtotal</span>
          <span class="fw-semibold" id="summarySubtotal">₹0.00</span>
        </div>

        <div class="pos-summary-row my-1">
          <span class="text-muted">Discount (%)</span>
          <div style="width: 80px;">
            <input type="number" min="0" max="100" step="0.5" name="discount_percent" id="discountInput" class="form-control form-control-sm text-end py-0" value="0">
          </div>
        </div>

        <div class="pos-summary-row my-1">
          <span class="text-muted">GST / Tax Rate</span>
          <div style="width: 95px;">
            <select name="tax_percent" id="taxSelect" class="form-select form-select-sm py-0">
              <option value="0">0% (Nil)</option>
              <option value="5">5% (GST)</option>
              <option value="12">12% (GST)</option>
              <option value="18">18% (GST)</option>
            </select>
          </div>
        </div>

        <div class="pos-total-row">
          <span>Grand Total</span>
          <span id="summaryGrandTotal">₹0.00</span>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div class="mb-3">
        <label class="form-label small fw-bold text-muted mb-1">Payment Method</label>
        <div class="payment-method-selector">
          <div class="payment-chip active" data-method="cash">
            <i class="bi bi-cash-stack text-success"></i>
            <span>Cash</span>
          </div>
          <div class="payment-chip" data-method="upi">
            <i class="bi bi-qr-code-scan text-primary"></i>
            <span>UPI / QR</span>
          </div>
          <div class="payment-chip" data-method="card">
            <i class="bi bi-credit-card text-teal"></i>
            <span>Card</span>
          </div>
        </div>
      </div>

      <button type="submit" id="submitSaleBtn" class="btn btn-amber w-100 py-2 fs-6 fw-bold text-dark shadow-sm" disabled>
        <i class="bi bi-printer-fill"></i> Complete Sale &amp; Print Bill
      </button>
    </form>
  </div>

</div>

<script>
(function() {
  let cart = [];

  const cartTableBody = document.getElementById('cartTableBody');
  const emptyCartRow = document.getElementById('emptyCartRow');
  const cartItemsInput = document.getElementById('cartItemsInput');
  const paymentMethodInput = document.getElementById('paymentMethodInput');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryGrandTotal = document.getElementById('summaryGrandTotal');
  const discountInput = document.getElementById('discountInput');
  const taxSelect = document.getElementById('taxSelect');
  const submitSaleBtn = document.getElementById('submitSaleBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const posSearchInput = document.getElementById('posSearchInput');

  // Search filter
  posSearchInput.addEventListener('input', function() {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('.pos-item-card').forEach(card => {
      const name = card.dataset.name.toLowerCase();
      const generic = (card.dataset.generic || '').toLowerCase();
      card.style.display = (name.includes(q) || generic.includes(q)) ? '' : 'none';
    });
  });

  // Category filter
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', function() {
      document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.category;

      document.querySelectorAll('.pos-item-card').forEach(card => {
        if (cat === 'all') {
          card.style.display = '';
        } else {
          card.style.display = (card.dataset.category === cat) ? '' : 'none';
        }
      });
    });
  });

  // Payment chips
  document.querySelectorAll('.payment-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.payment-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      paymentMethodInput.value = this.dataset.method;
    });
  });

  // Add item from catalog
  document.querySelectorAll('.pos-item-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (this.classList.contains('out-of-stock')) return;
      const stockId = parseInt(this.dataset.id, 10);
      const name = this.dataset.name;
      const price = parseFloat(this.dataset.price);
      const maxStock = parseInt(this.dataset.stock, 10);

      addToCart(stockId, name, price, maxStock);
    });
  });

  function addToCart(stockId, name, price, maxStock) {
    const existing = cart.find(item => item.stock_id === stockId);
    if (existing) {
      if (existing.quantity < maxStock) {
        existing.quantity += 1;
      } else {
        alert('Cannot add more units. Max available stock is ' + maxStock + '.');
      }
    } else {
      cart.push({
        stock_id: stockId,
        medicine_name: name,
        price: price,
        max_stock: maxStock,
        quantity: 1
      });
    }
    renderCart();
  }

  function renderCart() {
    if (cart.length === 0) {
      cartTableBody.innerHTML = `
        <tr id="emptyCartRow">
          <td colspan="4" class="text-center text-muted py-4">
            <i class="bi bi-cart-x fs-3 d-block mb-1 opacity-50"></i>
            Bill is empty. Click <strong>+ Add</strong> on medicine items.
          </td>
        </tr>
      `;
      submitSaleBtn.disabled = true;
      clearCartBtn.style.display = 'none';
      updateSummary(0);
      cartItemsInput.value = '[]';
      return;
    }

    submitSaleBtn.disabled = false;
    clearCartBtn.style.display = '';

    let html = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      html += `
        <tr>
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 140px;" title="${item.medicine_name}">
              ${item.medicine_name}
            </div>
            <small class="text-muted">₹${item.price.toFixed(2)} each</small>
          </td>
          <td class="text-center">
            <div class="qty-control">
              <button type="button" class="qty-btn" onclick="window.posChangeQty(${index}, -1)">&minus;</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button type="button" class="qty-btn" onclick="window.posChangeQty(${index}, 1)">&plus;</button>
            </div>
          </td>
          <td class="text-end fw-bold text-teal">
            ₹${lineTotal.toFixed(2)}
          </td>
          <td class="text-end">
            <button type="button" class="btn btn-link text-danger p-0" onclick="window.posRemoveItem(${index})" title="Remove">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </td>
        </tr>
      `;
    });

    cartTableBody.innerHTML = html;
    cartItemsInput.value = JSON.stringify(cart);
    updateSummary(subtotal);
  }

  function updateSummary(subtotal) {
    summarySubtotal.textContent = '₹' + subtotal.toFixed(2);

    const discountPct = Math.max(0, Math.min(100, parseFloat(discountInput.value) || 0));
    const discountAmt = (subtotal * discountPct) / 100;
    const afterDiscount = Math.max(0, subtotal - discountAmt);

    const taxPct = parseFloat(taxSelect.value) || 0;
    const taxAmt = (afterDiscount * taxPct) / 100;

    const grandTotal = afterDiscount + taxAmt;
    summaryGrandTotal.textContent = '₹' + grandTotal.toFixed(2);
  }

  window.posChangeQty = function(index, delta) {
    const item = cart[index];
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else if (newQty > item.max_stock) {
      alert('Cannot exceed available stock of ' + item.max_stock + '.');
    } else {
      item.quantity = newQty;
    }
    renderCart();
  };

  window.posRemoveItem = function(index) {
    cart.splice(index, 1);
    renderCart();
  };

  clearCartBtn.addEventListener('click', function() {
    if (confirm('Clear all items from current bill?')) {
      cart = [];
      renderCart();
    }
  });

  discountInput.addEventListener('input', function() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    updateSummary(subtotal);
  });

  taxSelect.addEventListener('change', function() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    updateSummary(subtotal);
  });

})();
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
