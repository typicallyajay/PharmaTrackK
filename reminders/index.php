<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

$pdo = get_db();
$userId = current_user()['user_id'];

$stmt = $pdo->prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY reminder_time');
$stmt->execute([$userId]);
$reminders = $stmt->fetchAll();

$pageTitle = 'My Medicine Reminders';
require_once __DIR__ . '/../includes/header.php';
?>

<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
  <div>
    <h2 class="mb-0 fw-bold">My Medicine Reminders</h2>
    <p class="text-muted small mb-0">Track personal dosages, daily medication schedules and find refills nearby</p>
  </div>
  <a href="<?= base_url('reminders/add.php') ?>" class="btn btn-primary">
    <i class="bi bi-plus-lg"></i> Add New Reminder
  </a>
</div>

<?php if (empty($reminders)): ?>
  <div class="empty-state card py-5">
    <div class="empty-icon"><i class="bi bi-alarm text-muted"></i></div>
    <h5>No dosage reminders scheduled</h5>
    <p class="text-muted mb-3">Add daily alerts for your ongoing prescriptions and vitamins to never miss a dose.</p>
    <div>
      <a href="<?= base_url('reminders/add.php') ?>" class="btn btn-amber">
        <i class="bi bi-plus-lg"></i> Create First Reminder
      </a>
    </div>
  </div>
<?php else: ?>
  <div class="row g-3 anim-stagger">
    <?php foreach ($reminders as $r): 
      $timeFormatted = date('h:i A', strtotime($r['reminder_time']));
      $hour = (int)date('H', strtotime($r['reminder_time']));
      
      // Select appropriate time-of-day icon
      if ($hour >= 5 && $hour < 12) {
          $timeIcon = '<i class="bi bi-sunrise text-amber"></i> Morning';
      } elseif ($hour >= 12 && $hour < 17) {
          $timeIcon = '<i class="bi bi-sun text-amber"></i> Afternoon';
      } elseif ($hour >= 17 && $hour < 21) {
          $timeIcon = '<i class="bi bi-sunset text-teal"></i> Evening';
      } else {
          $timeIcon = '<i class="bi bi-moon-stars text-primary"></i> Night';
      }

      $freq = $r['frequency'] ?: 'Daily';
      $freqClass = match($freq) {
          'Twice a day' => 'freq-twice',
          'Thrice a day' => 'freq-thrice',
          'Weekly' => 'freq-weekly',
          default => 'freq-daily',
      };
    ?>
      <div class="col-md-6">
        <div class="card reminder-card <?= $freqClass ?> h-100 shadow-sm">
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 class="card-title fw-bold mb-1 text-teal"><?= h($r['medicine_name']) ?></h5>
                  <span class="badge bg-teal-ghost text-teal border">
                    <?= $r['dosage'] ? h($r['dosage']) : '1 Dose' ?> &bull; <?= h($freq) ?>
                  </span>
                </div>
                <span class="small text-muted"><?= $timeIcon ?></span>
              </div>

              <div class="d-flex align-items-center gap-2 mt-3 p-2 bg-light rounded-2">
                <span class="fs-5 fw-bold text-dark"><i class="bi bi-clock-history text-teal"></i> <?= h($timeFormatted) ?></span>
                <span class="countdown ms-auto badge bg-white text-muted border" data-time="<?= h(date('H:i', strtotime($r['reminder_time']))) ?>">
                  Calculating...
                </span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <a href="<?= base_url('index.php') ?>?q=<?= urlencode($r['medicine_name']) ?>" class="small text-teal fw-semibold">
                <i class="bi bi-search"></i> Check stock near you &rarr;
              </a>

              <a href="<?= base_url('reminders/delete.php') ?>?id=<?= $r['reminder_id'] ?>"
                 class="btn btn-sm btn-outline-danger py-1"
                 data-confirm="Delete reminder for <?= h(addslashes($r['medicine_name'])) ?>?"
                 data-confirm-icon="⏰"
                 title="Delete reminder">
                <i class="bi bi-trash"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
