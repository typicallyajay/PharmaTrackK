<?php
require_once __DIR__ . '/../includes/auth.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['pharmacy_name'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $locality = trim($_POST['locality'] ?? '');
    $city = trim($_POST['city'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $lat = trim($_POST['latitude'] ?? '');
    $lng = trim($_POST['longitude'] ?? '');

    if ($name === '') $errors[] = 'Pharmacy name is required.';
    if ($address === '') $errors[] = 'Physical address is required.';
    if (!preg_match('/^[6-9]\d{9}$/', $phone)) $errors[] = 'Enter a valid 10-digit phone number.';
    if ($lat !== '' && !is_numeric($lat)) $errors[] = 'Latitude must be a valid number.';
    if ($lng !== '' && !is_numeric($lng)) $errors[] = 'Longitude must be a valid number.';

    if (empty($errors)) {
        $stmt = $pdo->prepare('UPDATE pharmacies SET pharmacy_name=?, address=?, locality=?, city=?, phone=?, latitude=?, longitude=? WHERE pharmacy_id=?');
        $stmt->execute([$name, $address, $locality, $city, $phone, $lat ?: null, $lng ?: null, $pharmacy['pharmacy_id']]);
        flash('success', 'Pharmacy profile details updated.');
        header('Location: ' . base_url('pharmacy/dashboard.php'));
        exit;
    }
    $pharmacy = array_merge($pharmacy, compact('name', 'address', 'locality', 'city', 'phone', 'lat', 'lng'));
}

$pageTitle = 'Edit Pharmacy Profile';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="auth-card" style="max-width: 600px;">
  <div class="d-flex align-items-center gap-3 mb-4">
    <div class="auth-icon">
      <i class="bi bi-shop"></i>
    </div>
    <div>
      <h2 class="mb-0 fw-bold">Edit Pharmacy Profile</h2>
      <small class="text-muted">Update public store contact and location coordinates</small>
    </div>
  </div>

  <?php if ($errors): ?>
    <div class="alert alert-danger mb-4">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div>
        <ul class="mb-0 ps-3">
          <?php foreach ($errors as $e): ?><li><?= h($e) ?></li><?php endforeach; ?>
        </ul>
      </div>
    </div>
  <?php endif; ?>

  <form method="POST">
    <h6 class="text-teal fw-bold mb-3"><i class="bi bi-card-heading me-1"></i> Store Identity</h6>

    <div class="mb-3">
      <label class="form-label">Pharmacy Name *</label>
      <input type="text" name="pharmacy_name" class="form-control" value="<?= h($pharmacy['pharmacy_name']) ?>" required>
    </div>

    <div class="mb-3">
      <label class="form-label">Street Address *</label>
      <input type="text" name="address" class="form-control" value="<?= h($pharmacy['address']) ?>" required>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Locality / Area</label>
        <input type="text" name="locality" class="form-control" value="<?= h($pharmacy['locality']) ?>">
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">City</label>
        <input type="text" name="city" class="form-control" value="<?= h($pharmacy['city']) ?>">
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label">Public Contact Phone *</label>
      <div class="input-group">
        <span class="input-group-text"><i class="bi bi-telephone"></i></span>
        <input type="tel" name="phone" class="form-control" maxlength="10" value="<?= h($pharmacy['phone']) ?>" required>
      </div>
    </div>

    <div class="divider"></div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="text-teal fw-bold mb-0"><i class="bi bi-geo-alt me-1"></i> Map Coordinates</h6>
      <button type="button" id="getMyLocation" class="btn btn-sm btn-outline-secondary">
        <i class="bi bi-crosshair"></i> Auto-Detect GPS
      </button>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Latitude</label>
        <input type="text" name="latitude" class="form-control" value="<?= h((string)($pharmacy['latitude'] ?? '')) ?>" placeholder="e.g. 24.4881">
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Longitude</label>
        <input type="text" name="longitude" class="form-control" value="<?= h((string)($pharmacy['longitude'] ?? '')) ?>" placeholder="e.g. 72.7833">
      </div>
    </div>

    <div class="alert alert-info py-2 small mb-4">
      <i class="bi bi-info-circle"></i> Coordinates enable the <strong>Haversine distance ranking</strong> so users searching near your shop see you at the top.
    </div>

    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary py-2 px-4 fw-bold">
        <i class="bi bi-check2"></i> Save Profile
      </button>
      <a href="<?= base_url('pharmacy/dashboard.php') ?>" class="btn btn-outline-secondary py-2">Cancel</a>
    </div>
  </form>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
