<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

$errors = [];
$prefill = $_GET['medicine'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $medicine = trim($_POST['medicine_name'] ?? '');
    $dosage = trim($_POST['dosage'] ?? '');
    $frequency = trim($_POST['frequency'] ?? '');
    $time = $_POST['reminder_time'] ?? '';

    if ($medicine === '') $errors[] = 'Medicine name is required.';
    if ($time === '') $errors[] = 'Reminder time is required.';

    if (empty($errors)) {
        $stmt = get_db()->prepare('INSERT INTO reminders (user_id, medicine_name, dosage, frequency, reminder_time) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([current_user()['user_id'], $medicine, $dosage ?: null, $frequency ?: 'Daily', $time]);
        flash('success', 'Medicine reminder added.');
        header('Location: ' . base_url('reminders/index.php'));
        exit;
    }
}

$pageTitle = 'Add Reminder';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="auth-card" style="max-width: 560px;">
  <div class="d-flex align-items-center gap-3 mb-4">
    <div class="auth-icon">
      <i class="bi bi-alarm"></i>
    </div>
    <div>
      <h2 class="mb-0 fw-bold">Set Medicine Reminder</h2>
      <small class="text-muted">Receive scheduled daily dosage alerts</small>
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
    <div class="mb-3">
      <label class="form-label">Medicine / Prescription Name *</label>
      <input type="text" name="medicine_name" class="form-control" placeholder="e.g. Metformin 500mg, Thyronorm" value="<?= h($_POST['medicine_name'] ?? $prefill) ?>" required autofocus>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Dosage Quantity</label>
        <input type="text" name="dosage" class="form-control" placeholder="e.g. 1 Tablet, 5 ml, 2 Drops" value="<?= h($_POST['dosage'] ?? '') ?>">
      </div>

      <div class="col-md-6 mb-3">
        <label class="form-label">Frequency</label>
        <select name="frequency" class="form-select">
          <?php foreach (['Daily', 'Twice a day', 'Thrice a day', 'Weekly'] as $f): ?>
            <option <?= (($_POST['frequency'] ?? '') === $f) ? 'selected' : '' ?>><?= $f ?></option>
          <?php endforeach; ?>
        </select>
      </div>
    </div>

    <div class="mb-4">
      <label class="form-label">Alert Time *</label>
      <input type="time" name="reminder_time" class="form-control" value="<?= h($_POST['reminder_time'] ?? '08:00') ?>" required>
      
      <div class="quick-times mt-2">
        <span class="small text-muted me-1 align-self-center">Quick presets:</span>
        <button type="button" class="quick-time" data-time="08:00"><i class="bi bi-sunrise"></i> 8:00 AM</button>
        <button type="button" class="quick-time" data-time="13:00"><i class="bi bi-sun"></i> 1:00 PM</button>
        <button type="button" class="quick-time" data-time="20:00"><i class="bi bi-sunset"></i> 8:00 PM</button>
        <button type="button" class="quick-time" data-time="22:00"><i class="bi bi-moon-stars"></i> 10:00 PM</button>
      </div>
    </div>

    <div class="d-flex gap-2">
      <button type="submit" class="btn btn-primary py-2 px-4 fw-bold">
        <i class="bi bi-bell-fill"></i> Save Reminder
      </button>
      <a href="<?= base_url('reminders/index.php') ?>" class="btn btn-outline-secondary py-2">Cancel</a>
    </div>
  </form>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
