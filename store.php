<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/search_helpers.php';

$pdo = get_db();
$pharmacyId = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM pharmacies WHERE pharmacy_id = ? AND status = 'approved'");
$stmt->execute([$pharmacyId]);
$pharmacy = $stmt->fetch();

if (!$pharmacy) {
    flash('error', 'That pharmacy could not be found or is not currently active.');
    header('Location: ' . base_url('index.php'));
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM stock_entries WHERE pharmacy_id = ? ORDER BY medicine_name');
$stmt->execute([$pharmacyId]);
$stock = $stmt->fetchAll();

// Collect unique categories for filtering pills
$categories = [];
foreach ($stock as $s) {
    if (!empty($s['category']) && !in_array($s['category'], $categories)) {
        $categories[] = $s['category'];
    }
}

// Quick "is X available here?" check on this specific store's page
$checkQuery = trim($_GET['check'] ?? '');
$foundHere = null;
if ($checkQuery !== '') {
    foreach ($stock as $s) {
        if (stripos($s['medicine_name'], $checkQuery) !== false && $s['quantity'] > 0) {
            $foundHere = $s;
            break;
        }
    }
}

$pageTitle = $pharmacy['pharmacy_name'];
require_once __DIR__ . '/includes/header.php';
?>

<div class="pharmacy-header">
  <div class="pharmacy-header-avatar">
    <?= strtoupper(substr($pharmacy['pharmacy_name'], 0, 1)) ?>
  </div>
  
  <div class="pharmacy-header-info">
    <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
      <h2 class="mb-0 fw-bold"><?= h($pharmacy['pharmacy_name']) ?></h2>
      <span class="badge badge-instock"><i class="bi bi-patch-check-fill text-success"></i> Verified Pharmacy</span>
    </div>

    <p class="text-muted mb-2">
      <i class="bi bi-geo-alt-fill text-teal"></i> <?= h($pharmacy['address']) ?>, <?= h($pharmacy['locality']) ?>, <?= h($pharmacy['city']) ?>
    </p>

    <div class="d-flex align-items-center gap-3 flex-wrap small text-muted">
      <span><i class="bi bi-box-seam text-teal"></i> <strong><?= count($stock) ?></strong> items in catalog</span>
      <?php if (!empty($pharmacy['latitude']) && !empty($pharmacy['longitude'])): ?>
        <a href="https://maps.google.com/?q=<?= urlencode($pharmacy['latitude'] . ',' . $pharmacy['longitude']) ?>" target="_blank" rel="noopener noreferrer" class="text-teal text-decoration-none">
          <i class="bi bi-map"></i> View on Google Maps
        </a>
      <?php endif; ?>
    </div>
  </div>

  <div class="pharmacy-header-actions">
    <a href="tel:<?= h($pharmacy['phone']) ?>" class="btn btn-primary">
      <i class="bi bi-telephone-fill"></i> <?= h($pharmacy['phone']) ?>
    </a>
    <button type="button" class="btn btn-outline-secondary share-btn" title="Copy store link">
      <i class="bi bi-share"></i> Share
    </button>
  </div>
</div>

<div class="card mb-4 shadow-sm">
  <div class="card-body p-4">
    <h5 class="fw-bold mb-2"><i class="bi bi-search-heart text-teal me-1"></i> Quick Stock Check</h5>
    <p class="text-muted small mb-3">Looking for a specific prescription or medicine at this location?</p>

    <form method="GET" class="row g-2 align-items-center">
      <input type="hidden" name="id" value="<?= $pharmacyId ?>">
      <div class="col-md-7 col-lg-5">
        <input type="text" name="check" class="form-control"
               placeholder="e.g. Paracetamol, Insulin, Azithromycin..." value="<?= h($checkQuery) ?>">
      </div>
      <div class="col-auto">
        <button type="submit" class="btn btn-amber text-dark fw-bold">
          <i class="bi bi-check2-circle"></i> Check Availability
        </button>
      </div>
      <?php if ($checkQuery !== ''): ?>
        <div class="col-auto">
          <a href="<?= base_url('store.php') ?>?id=<?= $pharmacyId ?>" class="btn btn-outline-secondary">Reset</a>
        </div>
      <?php endif; ?>
    </form>

    <?php if ($checkQuery !== ''): ?>
      <?php if ($foundHere): ?>
        <div class="alert alert-success mt-3 mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-check-circle-fill fs-5"></i>
          <div>
            <strong><?= h($foundHere['medicine_name']) ?></strong> is in stock right now!
            &mdash; <span class="fw-bold">₹<?= number_format((float)$foundHere['price'], 2) ?></span> &bull; <?= (int)$foundHere['quantity'] ?> units available.
          </div>
        </div>
      <?php else: ?>
        <div class="alert alert-danger mt-3 mb-0 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-x-circle-fill fs-5"></i>
            <div>
              <strong>"<?= h($checkQuery) ?>"</strong> is currently out of stock at this location.
            </div>
          </div>
          <a href="<?= base_url('index.php') ?>?q=<?= urlencode($checkQuery) ?>&from_pharmacy=<?= $pharmacyId ?>" class="btn btn-amber btn-sm">
            <i class="bi bi-geo-alt"></i> Find nearby stores that have it &rarr;
          </a>
        </div>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</div>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h5 class="fw-bold mb-0">Full Medicine Inventory</h5>
    <small class="text-muted">Showing all items stocked by this pharmacy</small>
  </div>
  <?php if (!empty($stock)): ?>
    <button type="button" id="exportCSV" class="export-btn btn btn-sm btn-outline-secondary">
      <i class="bi bi-download"></i> Export List (CSV)
    </button>
  <?php endif; ?>
</div>

<?php if (empty($stock)): ?>
  <div class="empty-state card py-5">
    <div class="empty-icon"><i class="bi bi-box-seam text-muted"></i></div>
    <h5>No stock listed yet</h5>
    <p class="text-muted">This pharmacy has not cataloged medicine inventory yet. Call directly for availability.</p>
    <a href="tel:<?= h($pharmacy['phone']) ?>" class="btn btn-outline-secondary mt-2">
      <i class="bi bi-telephone-fill"></i> Call <?= h($pharmacy['phone']) ?>
    </a>
  </div>
<?php else: ?>
  
  <div class="stock-filter">
    <div class="input-group" style="max-width: 320px;">
      <span class="input-group-text bg-white border-end-0"><i class="bi bi-funnel text-muted"></i></span>
      <input type="text" id="stockFilterInput" class="form-control border-start-0 ps-0" placeholder="Filter medicines by name...">
    </div>

    <?php if (!empty($categories)): ?>
      <div class="category-pills">
        <?php foreach ($categories as $cat): ?>
          <button type="button" class="category-pill" data-category="<?= h($cat) ?>">
            <?= h($cat) ?>
          </button>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>

  <div class="table-responsive bg-white shadow-sm">
    <table class="table table-hover align-middle stock-table mb-0">
      <thead>
        <tr>
          <th class="sortable">Medicine Name</th>
          <th class="sortable">Category</th>
          <th class="sortable">Price</th>
          <th>Availability</th>
          <th class="text-end">Action</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($stock as $s): ?>
          <tr>
            <td>
              <div class="fw-bold text-dark"><?= h($s['medicine_name']) ?></div>
              <?php if ($s['generic_name']): ?>
                <div class="small text-muted"><i class="bi bi-capsule"></i> <?= h($s['generic_name']) ?></div>
              <?php endif; ?>
            </td>
            <td data-category="<?= h($s['category'] ?? '') ?>">
              <?php if (!empty($s['category'])): ?>
                <span class="badge bg-teal-ghost text-teal border"><?= h($s['category']) ?></span>
              <?php else: ?>
                <span class="text-muted">&mdash;</span>
              <?php endif; ?>
            </td>
            <td class="fw-bold text-teal">
              ₹<?= number_format((float)$s['price'], 2) ?>
            </td>
            <td>
              <?php if ($s['quantity'] <= 0): ?>
                <span class="badge badge-out"><i class="bi bi-x-circle"></i> Out of Stock</span>
              <?php elseif ($s['quantity'] <= 10): ?>
                <span class="badge badge-low"><i class="bi bi-exclamation-circle"></i> Low: <?= (int)$s['quantity'] ?> left</span>
              <?php else: ?>
                <span class="badge badge-instock"><i class="bi bi-check-circle"></i> <?= (int)$s['quantity'] ?> in stock</span>
              <?php endif; ?>
            </td>
            <td class="text-end">
              <?php if ($s['quantity'] <= 0): ?>
                <a href="<?= base_url('index.php') ?>?q=<?= urlencode($s['medicine_name']) ?>&from_pharmacy=<?= $pharmacyId ?>" class="btn btn-sm btn-outline-secondary py-1" title="Find near you">
                  <i class="bi bi-geo-alt"></i> Alternatives
                </a>
              <?php else: ?>
                <a href="tel:<?= h($pharmacy['phone']) ?>" class="btn btn-sm btn-primary py-1 px-3">
                  <i class="bi bi-telephone"></i> Reserve
                </a>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
