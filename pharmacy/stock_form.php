<?php
require_once __DIR__ . '/../includes/auth.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();
$stockId = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['stock_id']) ? (int)$_POST['stock_id'] : null);
$editing = $stockId !== null;
$errors = [];

$entry = [
    'medicine_name' => '', 'generic_name' => '', 'category' => '',
    'price' => '', 'quantity' => '', 'expiry_date' => '',
];

if ($editing) {
    $stmt = $pdo->prepare('SELECT * FROM stock_entries WHERE stock_id = ? AND pharmacy_id = ?');
    $stmt->execute([$stockId, $pharmacy['pharmacy_id']]);
    $row = $stmt->fetch();
    if (!$row) {
        flash('error', 'Stock entry not found.');
        header('Location: ' . base_url('pharmacy/dashboard.php'));
        exit;
    }
    $entry = $row;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entry['medicine_name'] = trim($_POST['medicine_name'] ?? '');
    $entry['generic_name'] = trim($_POST['generic_name'] ?? '');
    $entry['category'] = trim($_POST['category'] ?? '');
    $entry['price'] = $_POST['price'] ?? '';
    $entry['quantity'] = $_POST['quantity'] ?? '';
    $entry['expiry_date'] = $_POST['expiry_date'] ?? '';

    if ($entry['medicine_name'] === '') $errors[] = 'Medicine brand/commercial name is required.';
    if (!is_numeric($entry['price']) || (float)$entry['price'] < 0) $errors[] = 'Enter a valid retail price (in ₹).';
    if (!is_numeric($entry['quantity']) || (int)$entry['quantity'] < 0) $errors[] = 'Enter a valid stock quantity count.';

    if (empty($errors)) {
        if ($editing) {
            $stmt = $pdo->prepare('UPDATE stock_entries SET medicine_name=?, generic_name=?, category=?, price=?, quantity=?, expiry_date=? WHERE stock_id=? AND pharmacy_id=?');
            $stmt->execute([
                $entry['medicine_name'], $entry['generic_name'] ?: null, $entry['category'] ?: null,
                $entry['price'], $entry['quantity'], $entry['expiry_date'] ?: null,
                $stockId, $pharmacy['pharmacy_id'],
            ]);
            flash('success', 'Stock entry updated successfully.');
        } else {
            $stmt = $pdo->prepare('INSERT INTO stock_entries (pharmacy_id, medicine_name, generic_name, category, price, quantity, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $pharmacy['pharmacy_id'], $entry['medicine_name'], $entry['generic_name'] ?: null,
                $entry['category'] ?: null, $entry['price'], $entry['quantity'], $entry['expiry_date'] ?: null,
            ]);
            flash('success', 'Medicine added to your stock inventory.');
        }
        header('Location: ' . base_url('pharmacy/dashboard.php'));
        exit;
    }
}

$commonCategories = [
    'Painkiller & Analgesic',
    'Antibiotic & Antimicrobial',
    'Antihistamine & Cold/Flu',
    'Antidiabetic',
    'Cardiovascular & Blood Pressure',
    'Gastrointestinal & Antacid',
    'Vitamin & Nutritional Supplement',
    'Dermatology & Topicals',
    'Respiratory & Inhalers',
    'Pediatric Care',
];

$pageTitle = $editing ? 'Edit Medicine' : 'Add Medicine to Stock';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="auth-card" style="max-width: 600px;">
  <div class="d-flex align-items-center gap-3 mb-4">
    <div class="auth-icon">
      <i class="bi <?= $editing ? 'bi-pencil-square' : 'bi-capsule' ?>"></i>
    </div>
    <div>
      <h2 class="mb-0 fw-bold"><?= $editing ? 'Edit Medicine Entry' : 'Add Medicine to Stock' ?></h2>
      <small class="text-muted"><?= h($pharmacy['pharmacy_name']) ?> &bull; Inventory Management</small>
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
    <?php if ($editing): ?><input type="hidden" name="stock_id" value="<?= $stockId ?>"><?php endif; ?>

    <div class="mb-3">
      <label class="form-label">Brand / Medicine Name *</label>
      <input type="text" name="medicine_name" class="form-control" placeholder="e.g. Dolo 650, Augmentin 625, Glycomet" value="<?= h($entry['medicine_name']) ?>" required autofocus>
    </div>

    <div class="mb-3">
      <label class="form-label">Generic / Formula Name <span class="text-muted small">(helps customers search)</span></label>
      <input type="text" name="generic_name" class="form-control" placeholder="e.g. Paracetamol, Amoxicillin + Clavulanate" value="<?= h($entry['generic_name'] ?? '') ?>">
    </div>

    <div class="mb-3">
      <label class="form-label">Category</label>
      <input type="text" name="category" class="form-control" list="categoryOptions" placeholder="Select or type a category..." value="<?= h($entry['category'] ?? '') ?>">
      <datalist id="categoryOptions">
        <?php foreach ($commonCategories as $cc): ?>
          <option value="<?= h($cc) ?>"></option>
        <?php endforeach; ?>
      </datalist>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Unit Price (₹) *</label>
        <div class="input-group">
          <span class="input-group-text bg-light">₹</span>
          <input type="number" step="0.01" min="0" name="price" class="form-control" placeholder="0.00" value="<?= h((string)$entry['price']) ?>" required>
        </div>
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Available Quantity *</label>
        <input type="number" min="0" name="quantity" class="form-control" placeholder="Units in stock" value="<?= h((string)$entry['quantity']) ?>" required>
      </div>
    </div>

    <div class="mb-4">
      <label class="form-label">Batch Expiry Date <span class="text-muted small">(optional)</span></label>
      <input type="date" name="expiry_date" class="form-control" value="<?= h($entry['expiry_date'] ?? '') ?>">
      <small class="text-muted">You will be alerted 30 days before expiry date.</small>
    </div>

    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary py-2 px-4 fw-bold">
        <i class="bi bi-check2"></i> <?= $editing ? 'Save Changes' : 'Add to Stock' ?>
      </button>
      <a href="<?= base_url('pharmacy/dashboard.php') ?>" class="btn btn-outline-secondary py-2">Cancel</a>
    </div>
  </form>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
