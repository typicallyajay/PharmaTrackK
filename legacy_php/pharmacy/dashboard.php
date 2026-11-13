<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/search_helpers.php';
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

// Fetch inventory stock
$stmt = $pdo->prepare('SELECT * FROM stock_entries WHERE pharmacy_id = ? ORDER BY updated_at DESC');
$stmt->execute([$pharmacy['pharmacy_id']]);
$stock = $stmt->fetchAll();

$totalItems = count($stock);
$lowStock = array_filter($stock, fn($s) => $s['quantity'] > 0 && $s['quantity'] <= 10);
$outOfStock = array_filter($stock, fn($s) => $s['quantity'] <= 0);
$expiringSoon = array_filter($stock, fn($s) => $s['expiry_date'] && strtotime($s['expiry_date']) <= strtotime('+30 days'));

// Fetch POS Sales Stats
$salesStats = get_pharmacy_sales_stats($pdo, (int)$pharmacy['pharmacy_id']);

// Fetch recent 5 invoices
$stmt = $pdo->prepare("
    SELECT i.*, COUNT(ii.item_id) AS items_count
    FROM invoices i
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.invoice_id
    WHERE i.pharmacy_id = ?
    GROUP BY i.invoice_id
    ORDER BY i.created_at DESC
    LIMIT 5
");
$stmt->execute([$pharmacy['pharmacy_id']]);
$recentInvoices = $stmt->fetchAll();

$pageTitle = 'Pharmacy Dashboard';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="dashboard-header">
  <div>
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <h2 class="mb-0 fw-bold"><?= h($pharmacy['pharmacy_name']) ?></h2>
      <span class="status-<?= h($pharmacy['status']) ?> badge bg-white border">
        <i class="bi bi-circle-fill" style="font-size: 8px;"></i> <?= ucfirst(h($pharmacy['status'])) ?>
      </span>
    </div>
    <p class="text-muted small mb-0 mt-1">
      <i class="bi bi-geo-alt"></i> <?= h($pharmacy['locality']) ?>, <?= h($pharmacy['city']) ?> &bull; Phone: <?= h($pharmacy['phone']) ?>
    </p>
  </div>

  <div class="quick-actions">
    <a href="<?= base_url('pharmacy/pos.php') ?>" class="btn btn-amber text-dark fw-bold">
      <i class="bi bi-calculator-fill"></i> Open POS Counter
    </a>
    <a href="<?= base_url('pharmacy/invoices.php') ?>" class="btn btn-outline-secondary">
      <i class="bi bi-receipt"></i> Invoices
    </a>
    <a href="<?= base_url('store.php') ?>?id=<?= $pharmacy['pharmacy_id'] ?>" class="btn btn-outline-secondary" target="_blank">
      <i class="bi bi-box-arrow-up-right"></i> Public Store
    </a>
    <a href="<?= base_url('pharmacy/stock_form.php') ?>" class="btn btn-primary">
      <i class="bi bi-plus-lg"></i> Add Medicine
    </a>
  </div>
</div>

<!-- Key Performance Metric Cards -->
<div class="row g-3 mb-4 anim-stagger">
  <!-- POS Daily Revenue -->
  <div class="col-6 col-md-3">
    <div class="stat-card stat-success">
      <i class="bi bi-cash-stack stat-icon text-success"></i>
      <div class="stat-number">₹<?= number_format($salesStats['today_sales'], 2) ?></div>
      <div class="stat-label">Today's Revenue (<?= $salesStats['today_count'] ?> bills)</div>
    </div>
  </div>

  <!-- Inventory Listed -->
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <i class="bi bi-box-seam stat-icon text-teal"></i>
      <div class="stat-number"><?= $totalItems ?></div>
      <div class="stat-label">Medicines in Stock</div>
    </div>
  </div>

  <!-- Low Stock Alert -->
  <div class="col-6 col-md-3">
    <div class="stat-card stat-amber">
      <i class="bi bi-exclamation-triangle stat-icon text-amber"></i>
      <div class="stat-number"><?= count($lowStock) ?></div>
      <div class="stat-label">Low Stock (&le; 10)</div>
    </div>
  </div>

  <!-- Out of Stock / Expiring -->
  <div class="col-6 col-md-3">
    <div class="stat-card stat-danger">
      <i class="bi bi-x-octagon stat-icon text-danger"></i>
      <div class="stat-number"><?= count($outOfStock) ?></div>
      <div class="stat-label">Out of Stock</div>
    </div>
  </div>
</div>

<!-- Recent POS Invoices Section -->
<?php if (!empty($recentInvoices)): ?>
  <div class="card mb-4 shadow-sm">
    <div class="card-body p-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h6 class="fw-bold mb-0 text-teal"><i class="bi bi-clock-history me-1"></i> Recent POS Transactions</h6>
        <a href="<?= base_url('pharmacy/invoices.php') ?>" class="small text-teal fw-semibold">View All Invoices &rarr;</a>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" style="font-size: var(--text-sm);">
          <thead class="bg-light">
            <tr>
              <th>Invoice #</th>
              <th>Time</th>
              <th>Customer</th>
              <th class="text-center">Items</th>
              <th>Payment</th>
              <th class="text-end">Total</th>
              <th class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($recentInvoices as $rInv): ?>
              <tr>
                <td>
                  <a href="<?= base_url('pharmacy/invoice.php?id=' . $rInv['invoice_id']) ?>" class="fw-bold text-teal">
                    <?= h($rInv['invoice_number']) ?>
                  </a>
                </td>
                <td class="text-muted"><?= date('h:i A', strtotime($rInv['created_at'])) ?></td>
                <td><?= h($rInv['customer_name']) ?></td>
                <td class="text-center"><span class="badge bg-teal-ghost text-teal"><?= (int)$rInv['items_count'] ?></span></td>
                <td><span class="badge bg-light text-dark border"><?= strtoupper(h($rInv['payment_method'])) ?></span></td>
                <td class="text-end fw-bold text-dark">₹<?= number_format((float)$rInv['total_amount'], 2) ?></td>
                <td class="text-end">
                  <a href="<?= base_url('pharmacy/invoice.php?id=' . $rInv['invoice_id']) ?>" class="btn btn-sm btn-outline-secondary py-0 px-2" title="View receipt">
                    <i class="bi bi-eye"></i>
                  </a>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
<?php endif; ?>

<!-- Inventory Management Table -->
<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h5 class="fw-bold mb-0">Medicine Inventory Catalog</h5>
    <small class="text-muted">Manage stock pricing, batch quantities, and expiration dates</small>
  </div>
  <?php if (!empty($stock)): ?>
    <div class="d-flex align-items-center gap-2">
      <button type="button" id="exportCSV" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-download"></i> Export Inventory (CSV)
      </button>
    </div>
  <?php endif; ?>
</div>

<?php if (empty($stock)): ?>
  <div class="empty-state card py-5">
    <div class="empty-icon"><i class="bi bi-capsule text-muted"></i></div>
    <h5>No medicines in your inventory yet</h5>
    <p class="text-muted mb-3">Add items with prices and quantities to allow nearby patients to find you.</p>
    <div>
      <a href="<?= base_url('pharmacy/stock_form.php') ?>" class="btn btn-amber">
        <i class="bi bi-plus-lg"></i> Add Your First Medicine
      </a>
    </div>
  </div>
<?php else: ?>
  
  <div class="stock-filter mb-3">
    <div class="input-group" style="max-width: 320px;">
      <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
      <input type="text" id="stockFilterInput" class="form-control border-start-0 ps-0" placeholder="Filter stock table...">
    </div>
  </div>

  <div class="table-responsive bg-white shadow-sm">
    <table class="table table-hover align-middle stock-table mb-0">
      <thead>
        <tr>
          <th class="sortable">Medicine Name</th>
          <th class="sortable">Category</th>
          <th class="sortable">Price</th>
          <th class="sortable">Qty</th>
          <th class="sortable">Expiry</th>
          <th>Status</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($stock as $s): 
          $isExpired = $s['expiry_date'] && strtotime($s['expiry_date']) < time();
          $isExpiringSoon = $s['expiry_date'] && !$isExpired && strtotime($s['expiry_date']) <= strtotime('+30 days');
        ?>
          <tr class="<?= ($s['quantity'] <= 0) ? 'row-expired' : (($s['quantity'] <= 10) ? 'row-low-stock' : '') ?>">
            <td>
              <div class="fw-bold text-dark"><?= h($s['medicine_name']) ?></div>
              <?php if ($s['generic_name']): ?>
                <div class="small text-muted"><?= h($s['generic_name']) ?></div>
              <?php endif; ?>
            </td>
            <td>
              <?php if (!empty($s['category'])): ?>
                <span class="badge bg-teal-ghost text-teal border"><?= h($s['category']) ?></span>
              <?php else: ?>
                <span class="text-muted">&mdash;</span>
              <?php endif; ?>
            </td>
            <td class="fw-bold text-teal">
              ₹<?= number_format((float)$s['price'], 2) ?>
            </td>
            <td class="fw-bold">
              <?= (int)$s['quantity'] ?>
            </td>
            <td>
              <?php if ($s['expiry_date']): ?>
                <span class="<?= $isExpired ? 'text-danger fw-bold' : ($isExpiringSoon ? 'text-amber fw-bold' : 'text-muted') ?>">
                  <?= h(date('d M Y', strtotime($s['expiry_date']))) ?>
                </span>
                <?php if ($isExpired): ?>
                  <span class="badge badge-out ms-1">EXPIRED</span>
                <?php elseif ($isExpiringSoon): ?>
                  <span class="badge badge-low ms-1">soon</span>
                <?php endif; ?>
              <?php else: ?>
                <span class="text-muted">&mdash;</span>
              <?php endif; ?>
            </td>
            <td>
              <?php if ($s['quantity'] <= 0): ?>
                <span class="badge badge-out"><i class="bi bi-x-circle"></i> Out of stock</span>
              <?php elseif ($s['quantity'] <= 10): ?>
                <span class="badge badge-low"><i class="bi bi-exclamation-circle"></i> Low (<?= (int)$s['quantity'] ?>)</span>
              <?php else: ?>
                <span class="badge badge-instock"><i class="bi bi-check-circle"></i> In stock</span>
              <?php endif; ?>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <a href="<?= base_url('pharmacy/stock_form.php') ?>?id=<?= $s['stock_id'] ?>" class="btn btn-sm btn-outline-secondary py-1" title="Edit entry">
                  <i class="bi bi-pencil"></i>
                </a>
                <a href="<?= base_url('pharmacy/stock_delete.php') ?>?id=<?= $s['stock_id'] ?>"
                   class="btn btn-sm btn-outline-danger py-1"
                   data-confirm="Are you sure you want to remove <?= h(addslashes($s['medicine_name'])) ?> from your pharmacy stock?"
                   data-confirm-icon="🗑️"
                   title="Delete entry">
                  <i class="bi bi-trash"></i>
                </a>
              </div>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
