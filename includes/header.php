<?php
require_once __DIR__ . '/auth.php';
$user = current_user();
$pageTitle = $pageTitle ?? 'PharmaTrack';

// Helper for initials
$userInitials = 'U';
if ($user && !empty($user['name'])) {
    $parts = explode(' ', trim($user['name']));
    if (count($parts) >= 2) {
        $userInitials = strtoupper(substr($parts[0], 0, 1) . substr($parts[1], 0, 1));
    } else {
        $userInitials = strtoupper(substr($parts[0], 0, 2));
    }
}

// Current pharmacy status if pharmacy_admin
$pharmacyStatus = null;
if ($user && $user['role'] === 'pharmacy_admin') {
    $pharm = current_pharmacy();
    if ($pharm) {
        $pharmacyStatus = $pharm['status'];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= h($pageTitle) ?> · PharmaTrack</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
<link rel="stylesheet" href="<?= base_url('assets/css/style.css') ?>">
<link rel="stylesheet" href="<?= base_url('assets/css/animations.css') ?>">
</head>
<body>

<?php if ($pharmacyStatus === 'pending'): ?>
  <div class="pending-banner">
    <i class="bi bi-clock-history"></i> Your pharmacy account is currently <strong>Pending Admin Approval</strong>. It will appear in public medicine searches once verified.
  </div>
<?php endif; ?>

<nav class="navbar navbar-expand-lg navbar-dark app-navbar">
  <div class="container">
    <a class="navbar-brand fw-bold" href="<?= base_url('index.php') ?>">
      <span class="brand-icon"><i class="bi bi-plus-lg"></i></span> PharmaTrack
    </a>
    
    <div class="d-flex align-items-center gap-2 d-lg-none">
      <button class="theme-toggle" title="Toggle color scheme" aria-label="Toggle theme">
        <i class="bi bi-moon-fill"></i>
      </button>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>

    <div class="collapse navbar-collapse" id="navMain">
      <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2 my-2 my-lg-0">
        <li class="nav-item">
          <a class="nav-link" href="<?= base_url('index.php') ?>">
            <i class="bi bi-search"></i> Search Medicine
          </a>
        </li>

        <?php if (!$user): ?>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('login.php') ?>">
              <i class="bi bi-box-arrow-in-right"></i> Login
            </a>
          </li>
          <li class="nav-item">
            <a class="btn btn-amber btn-sm ms-lg-2 px-3 text-dark fw-bold" href="<?= base_url('register.php') ?>">
              <i class="bi bi-person-plus-fill"></i> Register
            </a>
          </li>

        <?php elseif ($user['role'] === 'user'): ?>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('reminders/index.php') ?>">
              <i class="bi bi-alarm"></i> My Reminders
            </a>
          </li>
          <li class="nav-item d-flex align-items-center gap-2 px-lg-2 py-1 py-lg-0">
            <span class="nav-avatar" title="<?= h($user['name']) ?>"><?= h($userInitials) ?></span>
            <span class="text-white-50 small d-lg-none"><?= h($user['name']) ?></span>
          </li>
          <li class="nav-item">
            <a class="btn btn-outline-light btn-sm" href="<?= base_url('logout.php') ?>">
              <i class="bi bi-box-arrow-right"></i> Logout
            </a>
          </li>

        <?php elseif ($user['role'] === 'pharmacy_admin'): ?>
          <li class="nav-item">
            <a class="nav-link text-warning fw-bold" href="<?= base_url('pharmacy/pos.php') ?>">
              <i class="bi bi-calculator-fill"></i> POS Counter
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('pharmacy/invoices.php') ?>">
              <i class="bi bi-receipt"></i> Invoices
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('pharmacy/dashboard.php') ?>">
              <i class="bi bi-speedometer2"></i> Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('pharmacy/profile.php') ?>">
              <i class="bi bi-shop"></i> Store Profile
            </a>
          </li>
          <li class="nav-item d-flex align-items-center gap-2 px-lg-2 py-1 py-lg-0">
            <span class="nav-avatar" title="<?= h($user['name']) ?>"><?= h($userInitials) ?></span>
            <span class="text-white-50 small d-lg-none"><?= h($user['name']) ?></span>
          </li>
          <li class="nav-item">
            <a class="btn btn-outline-light btn-sm" href="<?= base_url('logout.php') ?>">
              <i class="bi bi-box-arrow-right"></i> Logout
            </a>
          </li>

        <?php elseif ($user['role'] === 'super_admin'): ?>
          <li class="nav-item">
            <a class="nav-link" href="<?= base_url('admin/dashboard.php') ?>">
              <i class="bi bi-shield-lock-fill"></i> Admin Panel
            </a>
          </li>
          <li class="nav-item d-flex align-items-center gap-2 px-lg-2 py-1 py-lg-0">
            <span class="nav-avatar" title="Super Admin" style="background:#E2A23B; color:#0E5C52;">SA</span>
            <span class="text-white-50 small d-lg-none"><?= h($user['name']) ?></span>
          </li>
          <li class="nav-item">
            <a class="btn btn-outline-light btn-sm" href="<?= base_url('logout.php') ?>">
              <i class="bi bi-box-arrow-right"></i> Logout
            </a>
          </li>
        <?php endif; ?>

        <li class="nav-item d-none d-lg-block ms-lg-1">
          <button class="theme-toggle" title="Toggle light/dark mode" aria-label="Toggle theme">
            <i class="bi bi-moon-fill"></i>
          </button>
        </li>
      </ul>
    </div>
  </div>
</nav>

<main class="container py-4">
<?php
$successMsg = flash('success');
$errorMsg = flash('error');
if ($successMsg): ?>
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    <i class="bi bi-check-circle-fill"></i>
    <div><?= h($successMsg) ?></div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<?php endif;
if ($errorMsg): ?>
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    <i class="bi bi-exclamation-triangle-fill"></i>
    <div><?= h($errorMsg) ?></div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
<?php endif; ?>
