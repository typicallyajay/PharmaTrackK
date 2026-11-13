<?php
require_once __DIR__ . '/../includes/auth.php';
require_role('super_admin');

$pdo = get_db();

$totalPharmacies = $pdo->query("SELECT COUNT(*) FROM pharmacies")->fetchColumn();
$pendingCount = $pdo->query("SELECT COUNT(*) FROM pharmacies WHERE status='pending'")->fetchColumn();
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users WHERE role='user'")->fetchColumn();
$totalSearches = $pdo->query("SELECT COUNT(*) FROM search_logs")->fetchColumn();

$topSearches = $pdo->query(
    "SELECT medicine_name, COUNT(*) AS cnt FROM search_logs GROUP BY medicine_name ORDER BY cnt DESC LIMIT 5"
)->fetchAll();

// Find max count for scaling the CSS bar chart
$maxSearchCount = 1;
if (!empty($topSearches)) {
    $maxSearchCount = max(array_column($topSearches, 'cnt')) ?: 1;
}

$pharmacies = $pdo->query(
    "SELECT p.*, u.name AS owner_name, u.mobile AS owner_mobile, u.email AS owner_email
     FROM pharmacies p JOIN users u ON u.user_id = p.owner_user_id
     ORDER BY (p.status='pending') DESC, p.created_at DESC"
)->fetchAll();

$pageTitle = 'Super Admin Control Panel';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
  <div>
    <h2 class="mb-0 fw-bold">Super Admin Dashboard</h2>
    <p class="text-muted small mb-0">System overview, medicine search metrics, and pharmacy verifications</p>
  </div>
  <div>
    <span class="badge bg-teal-ghost text-teal p-2 border">
      <i class="bi bi-shield-check text-success"></i> Master Administrator Mode
    </span>
  </div>
</div>

<div class="row g-3 mb-4 anim-stagger">
  <div class="col-6 col-md-3">
    <div class="stat-card">
      <i class="bi bi-hospital stat-icon text-teal"></i>
      <div class="stat-number"><?= $totalPharmacies ?></div>
      <div class="stat-label">Total Pharmacies</div>
    </div>
  </div>

  <div class="col-6 col-md-3">
    <div class="stat-card <?= $pendingCount > 0 ? 'stat-amber' : '' ?>">
      <i class="bi bi-hourglass-split stat-icon text-amber"></i>
      <div class="stat-number">
        <?= $pendingCount ?>
        <?php if ($pendingCount > 0): ?>
          <span class="nav-badge fs-6 align-middle">Action Required</span>
        <?php endif; ?>
      </div>
      <div class="stat-label">Pending Approval</div>
    </div>
  </div>

  <div class="col-6 col-md-3">
    <div class="stat-card stat-success">
      <i class="bi bi-people stat-icon text-success"></i>
      <div class="stat-number"><?= $totalUsers ?></div>
      <div class="stat-label">Registered Customers</div>
    </div>
  </div>

  <div class="col-6 col-md-3">
    <div class="stat-card">
      <i class="bi bi-search stat-icon text-teal"></i>
      <div class="stat-number"><?= $totalSearches ?></div>
      <div class="stat-label">Medicine Queries Logged</div>
    </div>
  </div>
</div>

<?php if ($topSearches): ?>
<div class="card mb-4 shadow-sm">
  <div class="card-body p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="fw-bold mb-0 text-teal"><i class="bi bi-graph-up-arrow me-1"></i> Most In-Demand Medicines (Search Frequency)</h6>
      <small class="text-muted">Top 5 all-time</small>
    </div>

    <div class="bar-chart">
      <?php foreach ($topSearches as $t): 
        $pct = round(($t['cnt'] / $maxSearchCount) * 100);
      ?>
        <div class="bar-chart-row">
          <div class="bar-chart-label fw-bold"><?= h($t['medicine_name']) ?></div>
          <div class="bar-chart-track">
            <div class="bar-chart-fill" style="width: <?= max(12, $pct) ?>%;">
              <span class="bar-chart-value"><?= (int)$t['cnt'] ?></span>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</div>
<?php endif; ?>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h5 class="fw-bold mb-0">Pharmacy Directory &amp; Verification Requests</h5>
    <small class="text-muted">Review, approve, or suspend registered pharmacy partners</small>
  </div>
</div>

<div class="filter-tabs">
  <button type="button" class="filter-tab active" data-status="all">
    All Stores <span class="count"><?= count($pharmacies) ?></span>
  </button>
  <button type="button" class="filter-tab" data-status="pending">
    Pending <span class="count text-amber"><?= $pendingCount ?></span>
  </button>
  <button type="button" class="filter-tab" data-status="approved">
    Approved
  </button>
  <button type="button" class="filter-tab" data-status="deactivated">
    Deactivated / Rejected
  </button>
</div>

<div class="table-responsive bg-white shadow-sm">
  <table class="table table-hover align-middle filterable-table mb-0">
    <thead>
      <tr>
        <th>Pharmacy</th>
        <th>Owner / Contact</th>
        <th>Location</th>
        <th>Status</th>
        <th class="text-end">Verification Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($pharmacies as $p): ?>
        <tr data-status="<?= h($p['status']) ?>">
          <td>
            <div class="fw-bold text-dark fs-6"><?= h($p['pharmacy_name']) ?></div>
            <small class="text-muted">Registered <?= date('d M Y', strtotime($p['created_at'])) ?></small>
          </td>
          <td>
            <div class="fw-semibold"><?= h($p['owner_name']) ?></div>
            <div class="small text-muted"><i class="bi bi-phone"></i> <?= h($p['owner_mobile']) ?></div>
            <?php if (!empty($p['owner_email'])): ?>
              <div class="small text-muted"><i class="bi bi-envelope"></i> <?= h($p['owner_email']) ?></div>
            <?php endif; ?>
          </td>
          <td>
            <div><?= h($p['locality']) ?>, <?= h($p['city']) ?></div>
            <small class="text-muted text-truncate d-block" style="max-width: 200px;"><?= h($p['address']) ?></small>
          </td>
          <td>
            <?php if ($p['status'] === 'pending'): ?>
              <span class="badge badge-low"><i class="bi bi-clock-history"></i> Pending</span>
            <?php elseif ($p['status'] === 'approved'): ?>
              <span class="badge badge-instock"><i class="bi bi-check-circle-fill text-success"></i> Approved</span>
            <?php elseif ($p['status'] === 'rejected'): ?>
              <span class="badge badge-out"><i class="bi bi-x-circle-fill"></i> Rejected</span>
            <?php else: ?>
              <span class="badge badge-out"><i class="bi bi-slash-circle"></i> Deactivated</span>
            <?php endif; ?>
          </td>
          <td class="text-end">
            <?php if ($p['status'] === 'pending'): ?>
              <a href="<?= base_url('admin/approve.php') ?>?id=<?= $p['pharmacy_id'] ?>&action=approve" class="btn btn-sm btn-primary">
                <i class="bi bi-check-lg"></i> Approve
              </a>
              <a href="<?= base_url('admin/approve.php') ?>?id=<?= $p['pharmacy_id'] ?>&action=reject" class="btn btn-sm btn-outline-danger">
                <i class="bi bi-x-lg"></i> Reject
              </a>
            <?php elseif ($p['status'] === 'approved'): ?>
              <a href="<?= base_url('store.php') ?>?id=<?= $p['pharmacy_id'] ?>" class="btn btn-sm btn-outline-secondary py-1" target="_blank" title="View store">
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
              <a href="<?= base_url('admin/approve.php') ?>?id=<?= $p['pharmacy_id'] ?>&action=deactivate"
                 class="btn btn-sm btn-outline-danger py-1"
                 data-confirm="Deactivate <?= h(addslashes($p['pharmacy_name'])) ?>? It will be hidden from public searches."
                 data-confirm-icon="⏸️">
                Deactivate
              </a>
            <?php elseif (in_array($p['status'], ['rejected', 'deactivated'])): ?>
              <a href="<?= base_url('admin/approve.php') ?>?id=<?= $p['pharmacy_id'] ?>&action=approve" class="btn btn-sm btn-primary py-1">
                <i class="bi bi-arrow-counterclockwise"></i> Re-approve
              </a>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
