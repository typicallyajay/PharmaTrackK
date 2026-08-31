<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pos_helpers.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();

if (!$pharmacy) {
    flash('error', 'No pharmacy profile found.');
    header('Location: ' . base_url('index.php'));
    exit;
}

ensure_pos_schema($pdo);

$period = $_GET['period'] ?? 'all';
$method = $_GET['method'] ?? 'all';
$search = trim($_GET['search'] ?? '');

$where = ['pharmacy_id = ?'];
$params = [(int)$pharmacy['pharmacy_id']];

if ($period === 'today') {
    $where[] = 'DATE(created_at) = CURDATE()';
} elseif ($period === 'week') {
    $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
} elseif ($period === 'month') {
    $where[] = 'YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
}

if ($method !== 'all' && in_array($method, ['cash', 'upi', 'card'])) {
    $where[] = 'payment_method = ?';
    $params[] = $method;
}

if ($search !== '') {
    $where[] = '(invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$whereSql = implode(' AND ', $where);

// Fetch invoices with line item count
$sql = "
    SELECT i.*, COUNT(ii.item_id) AS items_count
    FROM invoices i
    LEFT JOIN invoice_items ii ON ii.invoice_id = i.invoice_id
    WHERE $whereSql
    GROUP BY i.invoice_id
    ORDER BY i.created_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$invoices = $stmt->fetchAll();

// Get summary metrics
$stats = get_pharmacy_sales_stats($pdo, (int)$pharmacy['pharmacy_id']);

$pageTitle = 'Sales & Billing History';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h2 class="mb-0 fw-bold"><i class="bi bi-journal-text text-teal me-1"></i> Sales &amp; Invoices Register</h2>
    <small class="text-muted"><?= h($pharmacy['pharmacy_name']) ?> &bull; Transaction history and receipt archives</small>
  </div>
  <div class="d-flex gap-2">
    <a href="<?= base_url('pharmacy/pos.php') ?>" class="btn btn-amber text-dark fw-bold">
      <i class="bi bi-plus-lg"></i> Open POS Counter
    </a>
    <a href="<?= base_url('pharmacy/dashboard.php') ?>" class="btn btn-outline-secondary">
      <i class="bi bi-speedometer2"></i> Dashboard
    </a>
  </div>
</div>

<!-- Financial Summary Metrics -->
<div class="row g-3 mb-4 anim-stagger">
  <div class="col-6 col-md-4">
    <div class="stat-card">
      <i class="bi bi-calendar-check stat-icon text-teal"></i>
      <div class="stat-number">₹<?= number_format($stats['today_sales'], 2) ?></div>
      <div class="stat-label">Today's Sales (<?= $stats['today_count'] ?> bills)</div>
    </div>
  </div>

  <div class="col-6 col-md-4">
    <div class="stat-card stat-success">
      <i class="bi bi-graph-up-arrow stat-icon text-success"></i>
      <div class="stat-number">₹<?= number_format($stats['month_sales'], 2) ?></div>
      <div class="stat-label">This Month (<?= $stats['month_count'] ?> bills)</div>
    </div>
  </div>

  <div class="col-12 col-md-4">
    <div class="stat-card">
      <i class="bi bi-cash-coin stat-icon text-teal"></i>
      <div class="stat-number">₹<?= number_format($stats['total_sales'], 2) ?></div>
      <div class="stat-label">Total Lifetime Revenue (<?= $stats['total_invoices'] ?> bills)</div>
    </div>
  </div>
</div>

<!-- Filters & Search Toolbar -->
<div class="card mb-3 shadow-sm">
  <div class="card-body p-3">
    <form method="GET" class="row g-2 align-items-center">
      <div class="col-md-4">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
          <input type="text" name="search" class="form-control border-start-0 ps-0" placeholder="Search customer, phone, invoice #..." value="<?= h($search) ?>">
        </div>
      </div>

      <div class="col-6 col-md-3">
        <select name="period" class="form-select" onchange="this.form.submit()">
          <option value="all" <?= $period === 'all' ? 'selected' : '' ?>>All Time</option>
          <option value="today" <?= $period === 'today' ? 'selected' : '' ?>>Today Only</option>
          <option value="week" <?= $period === 'week' ? 'selected' : '' ?>>Past 7 Days</option>
          <option value="month" <?= $period === 'month' ? 'selected' : '' ?>>This Month</option>
        </select>
      </div>

      <div class="col-6 col-md-3">
        <select name="method" class="form-select" onchange="this.form.submit()">
          <option value="all" <?= $method === 'all' ? 'selected' : '' ?>>All Payment Modes</option>
          <option value="cash" <?= $method === 'cash' ? 'selected' : '' ?>>Cash Only</option>
          <option value="upi" <?= $method === 'upi' ? 'selected' : '' ?>>UPI / QR Only</option>
          <option value="card" <?= $method === 'card' ? 'selected' : '' ?>>Card Only</option>
        </select>
      </div>

      <div class="col-md-2 d-flex gap-1">
        <button type="submit" class="btn btn-primary w-100">Filter</button>
        <?php if ($period !== 'all' || $method !== 'all' || $search !== ''): ?>
          <a href="<?= base_url('pharmacy/invoices.php') ?>" class="btn btn-outline-secondary" title="Reset Filters">
            <i class="bi bi-arrow-counterclockwise"></i>
          </a>
        <?php endif; ?>
      </div>
    </form>
  </div>
</div>

<div class="d-flex justify-content-between align-items-center mb-2">
  <small class="text-muted">Found <strong><?= count($invoices) ?></strong> matching invoices</small>
  <?php if (!empty($invoices)): ?>
    <button type="button" id="exportCSV" class="btn btn-sm btn-outline-secondary">
      <i class="bi bi-download"></i> Export CSV
    </button>
  <?php endif; ?>
</div>

<?php if (empty($invoices)): ?>
  <div class="empty-state card py-5">
    <div class="empty-icon"><i class="bi bi-receipt text-muted"></i></div>
    <h5>No invoices found</h5>
    <p class="text-muted mb-3">No sales transactions match your selected filter criteria.</p>
    <a href="<?= base_url('pharmacy/pos.php') ?>" class="btn btn-amber">
      <i class="bi bi-plus-lg"></i> Create a New Sale (POS)
    </a>
  </div>
<?php else: ?>
  <div class="table-responsive bg-white shadow-sm">
    <table class="table table-hover align-middle stock-table mb-0">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Date &amp; Time</th>
          <th>Customer</th>
          <th class="text-center">Items</th>
          <th>Payment</th>
          <th class="text-end">Total Amount</th>
          <th class="text-end">Action</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($invoices as $inv): ?>
          <tr>
            <td>
              <a href="<?= base_url('pharmacy/invoice.php?id=' . $inv['invoice_id']) ?>" class="fw-bold text-teal">
                <?= h($inv['invoice_number']) ?>
              </a>
            </td>
            <td>
              <div class="small fw-semibold"><?= date('d M Y', strtotime($inv['created_at'])) ?></div>
              <div class="small text-muted"><?= date('h:i A', strtotime($inv['created_at'])) ?></div>
            </td>
            <td>
              <div class="fw-semibold text-dark"><?= h($inv['customer_name']) ?></div>
              <?php if (!empty($inv['customer_phone'])): ?>
                <div class="small text-muted"><i class="bi bi-phone"></i> <?= h($inv['customer_phone']) ?></div>
              <?php endif; ?>
              <?php if (!empty($inv['customer_email'])): ?>
                <div class="small text-muted"><i class="bi bi-envelope"></i> <?= h($inv['customer_email']) ?></div>
              <?php endif; ?>
            </td>
            <td class="text-center">
              <span class="badge bg-teal-ghost text-teal border"><?= (int)$inv['items_count'] ?> items</span>
            </td>
            <td>
              <?php if ($inv['payment_method'] === 'cash'): ?>
                <span class="badge bg-light text-success border"><i class="bi bi-cash"></i> Cash</span>
              <?php elseif ($inv['payment_method'] === 'upi'): ?>
                <span class="badge bg-light text-primary border"><i class="bi bi-qr-code"></i> UPI</span>
              <?php else: ?>
                <span class="badge bg-light text-dark border"><i class="bi bi-credit-card"></i> Card</span>
              <?php endif; ?>
            </td>
            <td class="text-end fw-bold text-dark fs-6">
              ₹<?= number_format((float)$inv['total_amount'], 2) ?>
            </td>
            <td class="text-end">
              <div class="d-flex justify-content-end gap-1">
                <a href="<?= base_url('pharmacy/invoice.php?id=' . $inv['invoice_id']) ?>" class="btn btn-sm btn-outline-secondary py-1" title="View receipt">
                  <i class="bi bi-eye"></i> View
                </a>
                <a href="<?= base_url('pharmacy/invoice.php?id=' . $inv['invoice_id'] . '&print=1') ?>" class="btn btn-sm btn-primary py-1" title="Print directly" target="_blank">
                  <i class="bi bi-printer"></i>
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
