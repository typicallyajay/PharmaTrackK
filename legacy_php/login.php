<?php
require_once __DIR__ . '/includes/auth.php';

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $mobile = trim($_POST['mobile'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = get_db()->prepare('SELECT * FROM users WHERE mobile = ?');
    $stmt->execute([$mobile]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        $error = 'Invalid mobile number or password.';
    } else {
        login_user($user);
        if ($user['role'] === 'pharmacy_admin') {
            header('Location: ' . base_url('pharmacy/dashboard.php'));
        } elseif ($user['role'] === 'super_admin') {
            header('Location: ' . base_url('admin/dashboard.php'));
        } else {
            header('Location: ' . base_url('index.php'));
        }
        exit;
    }
}

$pageTitle = 'Login to PharmaTrack';
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-card">
  <div class="text-center mb-4">
    <div class="auth-icon mx-auto mb-3">
      <i class="bi bi-shield-lock"></i>
    </div>
    <h2 class="justify-content-center mb-1">Welcome back</h2>
    <p class="text-muted mb-0">Log in to search medicine stocks, update inventory, or manage prescriptions.</p>
  </div>

  <?php if ($error): ?>
    <div class="alert alert-danger mb-4">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div><?= h($error) ?></div>
    </div>
  <?php endif; ?>

  <form method="POST">
    <div class="mb-3">
      <label class="form-label"><i class="bi bi-phone"></i> Mobile Number</label>
      <input type="tel" name="mobile" class="form-control" maxlength="10" placeholder="e.g. 9811111111" required autofocus>
    </div>

    <div class="mb-4">
      <label class="form-label"><i class="bi bi-key"></i> Password</label>
      <div class="password-wrapper">
        <input type="password" name="password" class="form-control" placeholder="••••••••" required>
        <button type="button" class="password-toggle" title="Show/hide password" tabindex="-1">
          <i class="bi bi-eye"></i>
        </button>
      </div>
    </div>

    <button type="submit" class="btn btn-primary w-100 py-2 fs-6 fw-bold">
      <i class="bi bi-box-arrow-in-right"></i> Log In
    </button>
  </form>

  <p class="text-center mt-4 mb-0">
    New to PharmaTrack? <a href="<?= base_url('register.php') ?>" class="fw-bold">Create an account</a>
  </p>

  <div class="demo-box mt-4">
    <div class="fw-bold text-teal small mb-2"><i class="bi bi-info-circle-fill"></i> Quick Demo Logins:</div>
    <div class="small text-muted">
      <strong>Pharmacy Admin:</strong> <code>9811111111</code> / <code>Pharma@123</code><br>
      <strong>Super Admin:</strong> <code>9999999999</code> / <code>Admin@123</code>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
