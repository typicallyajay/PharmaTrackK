<?php
require_once __DIR__ . '/../includes/auth.php';
require_role('super_admin');

$pdo = get_db();
$pharmacyId = (int)($_GET['id'] ?? 0);
$action = $_GET['action'] ?? '';

$statusMap = [
    'approve' => 'approved',
    'reject' => 'rejected',
    'deactivate' => 'deactivated',
];

if (isset($statusMap[$action])) {
    $stmt = $pdo->prepare('UPDATE pharmacies SET status = ? WHERE pharmacy_id = ?');
    $stmt->execute([$statusMap[$action], $pharmacyId]);
    flash('success', 'Pharmacy status updated.');
} else {
    flash('error', 'Unknown action.');
}

header('Location: ' . base_url('admin/dashboard.php'));
exit;
