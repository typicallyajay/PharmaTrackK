<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/search_helpers.php';

$pdo = get_db();
$query = trim($_GET['q'] ?? '');
$results = [];
$searched = false;

// Optional: pharmacy the user is currently "checking"
$fromPharmacyId = isset($_GET['from_pharmacy']) ? (int)$_GET['from_pharmacy'] : null;
$fromPharmacy = null;

// User lat/lng if passed
$userLat = isset($_GET['user_lat']) && is_numeric($_GET['user_lat']) ? (float)$_GET['user_lat'] : null;
$userLng = isset($_GET['user_lng']) && is_numeric($_GET['user_lng']) ? (float)$_GET['user_lng'] : null;

if ($query !== '') {
    $searched = true;
    $results = search_medicine($pdo, $query, $userLat, $userLng);
    log_search($pdo, $query);

    if ($fromPharmacyId) {
        $stmt = $pdo->prepare('SELECT * FROM pharmacies WHERE pharmacy_id = ?');
        $stmt->execute([$fromPharmacyId]);
        $fromPharmacy = $stmt->fetch();
        // Remove origin pharmacy from results
        $results = array_values(array_filter($results, fn($r) => (int)$r['pharmacy_id'] !== $fromPharmacyId));
    }
}

// Get popular searches for tag recommendations
$popularSearches = [];
try {
    $stmt = $pdo->query("SELECT medicine_name, COUNT(*) as cnt FROM search_logs GROUP BY medicine_name ORDER BY cnt DESC LIMIT 5");
    $popularSearches = $stmt->fetchAll(PDO::FETCH_COLUMN) ?: [];
} catch (Exception $e) {
    $popularSearches = ['Paracetamol', 'Azithromycin', 'Metformin', 'Amoxicillin'];
}
if (empty($popularSearches)) {
    $popularSearches = ['Paracetamol', 'Azithromycin', 'Metformin', 'Amoxicillin'];
}

$pageTitle = 'Search Medicines & Pharmacy Stock';
require_once __DIR__ . '/includes/header.php';
?>

<div class="hero-search">
  <div class="row align-items-center">
    <div class="col-lg-10 mx-auto text-center">
      <h1>Find medicine in stock near you</h1>
      <p class="mb-4">Instantly locate available prescriptions and live inventory at verified local pharmacies.</p>
      
      <form method="GET" class="search-box mx-auto">
        <input type="text" name="q" placeholder="e.g. Azithromycin, Paracetamol, Cetirizine..." value="<?= h($query) ?>" autofocus autocomplete="off">
        <input type="hidden" name="user_lat" value="<?= h((string)($userLat ?? '')) ?>">
        <input type="hidden" name="user_lng" value="<?= h((string)($userLng ?? '')) ?>">
        <button type="submit">
          <i class="bi bi-search"></i> Search
        </button>
      </form>

      <div class="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-3">
        <button type="button" class="location-chip <?= ($userLat !== null) ? 'active' : '' ?>">
          <i class="bi bi-geo-alt-fill"></i> <?= ($userLat !== null) ? 'Location Enabled' : 'Use my location for distance' ?>
        </button>
      </div>

      <div class="popular-searches">
        <span class="label"><i class="bi bi-fire"></i> Popular:</span>
        <?php foreach ($popularSearches as $pop): ?>
          <a href="<?= base_url('index.php') ?>?q=<?= urlencode($pop) ?>" class="popular-tag">
            <?= h($pop) ?>
          </a>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>

<?php if ($fromPharmacy): ?>
  <div class="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
    <i class="bi bi-exclamation-octagon-fill fs-5"></i>
    <div>
      <strong>"<?= h($query) ?>"</strong> is currently out of stock at <strong><?= h($fromPharmacy['pharmacy_name']) ?></strong>.
      Below are nearest alternative pharmacies with confirmed stock:
    </div>
  </div>
<?php endif; ?>

<?php if ($searched): ?>

  <?php if (empty($results)): ?>
    <div class="empty-state card py-5">
      <div class="empty-icon"><i class="bi bi-search text-muted"></i></div>
      <h4 class="fw-bold">No pharmacies found with "<?= h($query) ?>" in stock</h4>
      <p class="text-muted mb-4">Try checking spelling, searching by generic drug name, or check again later as inventories update.</p>
      
      <div class="d-flex justify-content-center gap-2">
        <a href="<?= base_url('index.php') ?>" class="btn btn-outline-secondary">Clear Search</a>
        <?php if (is_logged_in() && current_user()['role'] === 'user'): ?>
          <a href="<?= base_url('reminders/add.php') ?>?medicine=<?= urlencode($query) ?>" class="btn btn-amber">
            <i class="bi bi-bell-fill"></i> Add to My Reminders
          </a>
        <?php endif; ?>
      </div>
    </div>
  <?php else: ?>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 text-muted">
        <i class="bi bi-check2-circle text-success me-1"></i>
        Found <strong><?= count($results) ?></strong> <?= count($results) === 1 ? 'pharmacy' : 'pharmacies' ?> with "<strong><?= h($query) ?></strong>" in stock
      </h5>
    </div>

    <div class="row g-4 anim-stagger">
      <?php foreach ($results as $r): ?>
        <div class="col-md-6">
          <div class="card pharmacy-card <?= $fromPharmacy ? 'alt-card' : '' ?> h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="pharmacy-avatar">
                    <?= strtoupper(substr($r['pharmacy_name'], 0, 1)) ?>
                  </div>
                  <div>
                    <h5 class="card-title mb-0">
                      <a href="<?= base_url('store.php') ?>?id=<?= $r['pharmacy_id'] ?>"><?= h($r['pharmacy_name']) ?></a>
                    </h5>
                    <small class="text-muted"><i class="bi bi-geo-alt"></i> <?= h($r['locality']) ?>, <?= h($r['city']) ?></small>
                  </div>
                </div>

                <?php if (isset($r['distance_km']) && $r['distance_km'] !== null): ?>
                  <span class="distance-badge" title="Calculated distance">
                    <i class="bi bi-send-fill"></i> <?= format_distance((float)$r['distance_km']) ?>
                  </span>
                <?php endif; ?>
              </div>

              <p class="text-muted small mb-3 ps-1 border-start border-2 ms-2">
                <?= h($r['address']) ?>
              </p>

              <div class="bg-teal-ghost p-3 rounded-3 mt-auto">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-bold text-teal fs-6">
                      <?= h($r['medicine_name']) ?>
                    </div>
                    <?php if (!empty($r['generic_name'])): ?>
                      <div class="small text-muted mb-1"><?= h($r['generic_name']) ?></div>
                    <?php endif; ?>
                    
                    <span class="badge <?= $r['quantity'] > 10 ? 'badge-instock' : 'badge-low' ?>">
                      <i class="bi <?= $r['quantity'] > 10 ? 'bi-check-circle' : 'bi-exclamation-circle' ?>"></i>
                      <?= $r['quantity'] > 10 ? 'In Stock (' . (int)$r['quantity'] . ')' : 'Low Stock: ' . (int)$r['quantity'] . ' left' ?>
                    </span>
                  </div>

                  <div class="text-end">
                    <div class="fs-5 fw-bold text-dark mb-1">₹<?= number_format((float)$r['price'], 2) ?></div>
                    <a href="tel:<?= h($r['phone']) ?>" class="btn btn-sm btn-outline-secondary py-1 px-2">
                      <i class="bi bi-telephone-fill"></i> <?= h($r['phone']) ?>
                    </a>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-3 pt-2 border-top">
                <a href="<?= base_url('store.php') ?>?id=<?= $r['pharmacy_id'] ?>" class="card-cta">
                  View Pharmacy &amp; Full Stock <i class="bi bi-arrow-right"></i>
                </a>
              </div>

            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

<?php else: ?>

  <div class="how-it-works my-4">
    <div class="how-step">
      <div class="how-step-icon">
        <i class="bi bi-search"></i>
      </div>
      <h6>1. Search Prescription</h6>
      <p>Type brand name or generic formula to check real-time availability in your neighborhood.</p>
    </div>

    <div class="how-step">
      <div class="how-step-icon">
        <i class="bi bi-geo-alt"></i>
      </div>
      <h6>2. Compare Distance &amp; Price</h6>
      <p>Results are automatically ranked by nearest physical distance with current pricing and stock count.</p>
    </div>

    <div class="how-step">
      <div class="how-step-icon">
        <i class="bi bi-shop"></i>
      </div>
      <h6>3. Visit or Call Ahead</h6>
      <p>Get direct phone contacts and addresses to ensure your medicines are ready for pickup.</p>
    </div>
  </div>

<?php endif; ?>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
