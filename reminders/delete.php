<?php
require_once __DIR__ . '/../includes/auth.php';
require_login();

$stmt = get_db()->prepare('DELETE FROM reminders WHERE reminder_id = ? AND user_id = ?');
$stmt->execute([(int)($_GET['id'] ?? 0), current_user()['user_id']]);

flash('success', 'Reminder deleted.');
header('Location: ' . base_url('reminders/index.php'));
exit;
