<?php
require_once __DIR__ . '/includes/auth.php';

$errors = [];
$role = $_POST['role'] ?? 'user';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $mobile = trim($_POST['mobile'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if ($name === '') $errors[] = 'Full name is required.';
    if (!preg_match('/^[6-9]\d{9}$/', $mobile)) $errors[] = 'Enter a valid 10-digit mobile number.';
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Enter a valid email address.';
    if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
    if ($password !== $confirm) $errors[] = 'Passwords do not match.';

    $pharmacyName = trim($_POST['pharmacy_name'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $locality = trim($_POST['locality'] ?? '');
    $city = trim($_POST['city'] ?? 'Abu Road');

    if ($role === 'pharmacy_admin') {
        if ($pharmacyName === '') $errors[] = 'Pharmacy name is required.';
        if ($address === '') $errors[] = 'Pharmacy address is required.';
        if ($locality === '') $errors[] = 'Locality is required.';
    }

    if (empty($errors)) {
        $pdo = get_db();
        $stmt = $pdo->prepare('SELECT user_id FROM users WHERE mobile = ? OR (email = ? AND email != "")');
        $stmt->execute([$mobile, $email]);
        if ($stmt->fetch()) {
            $errors[] = 'An account with this mobile number or email already exists.';
        } else {
            $pdo->beginTransaction();
            try {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $insertRole = ($role === 'pharmacy_admin') ? 'pharmacy_admin' : 'user';
                $stmt = $pdo->prepare('INSERT INTO users (name, mobile, email, password_hash, role) VALUES (?, ?, ?, ?, ?)');
                $stmt->execute([$name, $mobile, $email ?: null, $hash, $insertRole]);
                $userId = $pdo->lastInsertId();

                if ($insertRole === 'pharmacy_admin') {
                    $stmt = $pdo->prepare('INSERT INTO pharmacies (owner_user_id, pharmacy_name, address, locality, city, phone, status) VALUES (?, ?, ?, ?, ?, ?, "pending")');
                    $stmt->execute([$userId, $pharmacyName, $address, $locality, $city, $mobile]);
                }

                $pdo->commit();
                flash('success', $insertRole === 'pharmacy_admin'
                    ? 'Registration submitted! Your pharmacy will be visible in search once approved by the admin.'
                    : 'Account created successfully. Please log in.');
                header('Location: ' . base_url('login.php'));
                exit;
            } catch (Exception $e) {
                $pdo->rollBack();
                $errors[] = 'Something went wrong. Please try again.';
            }
        }
    }
}

$pageTitle = 'Register Account';
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-card" style="max-width: 540px;">
  <div class="text-center mb-4">
    <div class="auth-icon mx-auto mb-3">
      <i class="bi bi-person-badge"></i>
    </div>
    <h2 class="justify-content-center mb-1">Create an Account</h2>
    <p class="text-muted mb-0">Join PharmaTrack as a customer or register your pharmacy store.</p>
  </div>

  <div class="role-selector mb-4">
    <div class="role-card <?= $role !== 'pharmacy_admin' ? 'active' : '' ?>" data-role="user">
      <i class="bi bi-person-fill role-icon text-teal"></i>
      <div class="role-title">Customer / Patient</div>
      <div class="role-desc">Search stock &amp; set personal dosage reminders</div>
    </div>

    <div class="role-card <?= $role === 'pharmacy_admin' ? 'active' : '' ?>" data-role="pharmacy_admin">
      <i class="bi bi-shop role-icon text-amber"></i>
      <div class="role-title">Pharmacy Store</div>
      <div class="role-desc">List your pharmacy and manage medicine stock</div>
    </div>
  </div>

  <?php if ($errors): ?>
    <div class="alert alert-danger mb-4">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div>
        <ul class="mb-0 ps-3">
          <?php foreach ($errors as $err): ?><li><?= h($err) ?></li><?php endforeach; ?>
        </ul>
      </div>
    </div>
  <?php endif; ?>

  <form method="POST" novalidate id="registerForm">
    <input type="hidden" name="role" id="roleInput" value="<?= h($role) ?>">

    <h6 class="text-teal fw-bold mb-3"><i class="bi bi-person-circle me-1"></i> Personal Information</h6>

    <div class="mb-3">
      <label class="form-label">Full Name *</label>
      <input type="text" name="name" class="form-control" placeholder="e.g. Ramesh Sharma" value="<?= h($_POST['name'] ?? '') ?>" required>
    </div>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Mobile Number *</label>
        <input type="tel" name="mobile" class="form-control" maxlength="10" placeholder="10-digit number" value="<?= h($_POST['mobile'] ?? '') ?>" required>
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Email Address (optional)</label>
        <input type="email" name="email" class="form-control" placeholder="name@example.com" value="<?= h($_POST['email'] ?? '') ?>">
      </div>
    </div>

    <div id="pharmacyFields" style="<?= $role === 'pharmacy_admin' ? '' : 'display:none;' ?>">
      <div class="divider"></div>
      <h6 class="text-teal fw-bold mb-3"><i class="bi bi-shop me-1"></i> Pharmacy Details</h6>
      
      <div class="mb-3">
        <label class="form-label">Pharmacy / Store Name *</label>
        <input type="text" name="pharmacy_name" class="form-control" placeholder="e.g. City Medicos &amp; Healthcare" value="<?= h($_POST['pharmacy_name'] ?? '') ?>">
      </div>

      <div class="mb-3">
        <label class="form-label">Street Address *</label>
        <input type="text" name="address" class="form-control" placeholder="Shop No., Landmark, Street" value="<?= h($_POST['address'] ?? '') ?>">
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label class="form-label">Locality / Area *</label>
          <input type="text" name="locality" class="form-control" placeholder="e.g. Railway Station Road" value="<?= h($_POST['locality'] ?? '') ?>">
        </div>
        <div class="col-md-6 mb-3">
          <label class="form-label">City *</label>
          <input type="text" name="city" class="form-control" value="<?= h($_POST['city'] ?? 'Abu Road') ?>">
        </div>
      </div>
      
      <div class="alert alert-info py-2 small mb-3">
        <i class="bi bi-info-circle-fill"></i> New pharmacy stores are reviewed and activated by Super Admin within 24 hours.
      </div>
    </div>

    <div class="divider"></div>
    <h6 class="text-teal fw-bold mb-3"><i class="bi bi-shield-lock me-1"></i> Security</h6>

    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label">Password *</label>
        <div class="password-wrapper">
          <input type="password" name="password" class="form-control" placeholder="Min. 6 chars" required>
          <button type="button" class="password-toggle" tabindex="-1"><i class="bi bi-eye"></i></button>
        </div>
        <div class="password-strength">
          <div class="password-strength-bar"></div>
        </div>
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label">Confirm Password *</label>
        <div class="password-wrapper">
          <input type="password" name="confirm_password" class="form-control" placeholder="Repeat password" required>
          <button type="button" class="password-toggle" tabindex="-1"><i class="bi bi-eye"></i></button>
        </div>
      </div>
    </div>

    <button type="submit" class="btn btn-primary w-100 py-2 fs-6 fw-bold mt-2">
      <i class="bi bi-check-lg"></i> Create Account
    </button>
  </form>

  <p class="text-center mt-4 mb-0">
    Already registered? <a href="<?= base_url('login.php') ?>" class="fw-bold">Log in here</a>
  </p>
</div>

<script>
document.querySelectorAll('.role-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const role = card.dataset.role;
    document.getElementById('roleInput').value = role;
    document.getElementById('pharmacyFields').style.display = role === 'pharmacy_admin' ? '' : 'none';
  });
});
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
