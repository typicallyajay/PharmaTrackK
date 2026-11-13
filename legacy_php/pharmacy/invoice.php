<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/pos_helpers.php';
require_role('pharmacy_admin');

$pdo = get_db();
$pharmacy = current_pharmacy();

if (!$pharmacy) {
    flash('error', 'No pharmacy profile found.');
    header('Location: ' . base_url('index.php'));
    exit;
}

$invoiceId = (int)($_GET['id'] ?? 0);
$invoice = get_pharmacy_invoice($pdo, $invoiceId, (int)$pharmacy['pharmacy_id']);

if (!$invoice) {
    flash('error', 'Invoice was not found or does not belong to your store.');
    header('Location: ' . base_url('pharmacy/invoices.php'));
    exit;
}

// Handle sending/resending email
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'send_email') {
    $recipientEmail = trim($_POST['recipient_email'] ?? '');
    if (filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        send_invoice_email($pdo, $invoiceId, (int)$pharmacy['pharmacy_id'], $recipientEmail);
        flash('success', "Invoice {$invoice['invoice_number']} successfully emailed to {$recipientEmail}!");
    } else {
        flash('error', 'Please provide a valid email address.');
    }
    header('Location: ' . base_url('pharmacy/invoice.php?id=' . $invoiceId));
    exit;
}

$autoPrint = isset($_GET['print']) && $_GET['print'] === '1';

$pageTitle = 'Invoice ' . $invoice['invoice_number'];
require_once __DIR__ . '/../includes/header.php';
?>

<div class="receipt-no-print d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
  <div>
    <h2 class="mb-0 fw-bold"><i class="bi bi-receipt-cutoff text-teal me-1"></i> Medical Invoice Receipt</h2>
    <small class="text-muted">Invoice #<strong><?= h($invoice['invoice_number']) ?></strong> &bull; Generated <?= date('d M Y, h:i A', strtotime($invoice['created_at'])) ?></small>
  </div>
  <div class="d-flex gap-2 flex-wrap">
    <button type="button" onclick="window.print()" class="btn btn-primary">
      <i class="bi bi-printer-fill"></i> Print Receipt
    </button>
    <button type="button" class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#emailModal">
      <i class="bi bi-envelope-fill text-teal"></i> Email Bill
    </button>
    <a href="<?= base_url('pharmacy/pos.php') ?>" class="btn btn-amber text-dark fw-bold">
      <i class="bi bi-plus-lg"></i> New POS Sale
    </a>
    <a href="<?= base_url('pharmacy/invoices.php') ?>" class="btn btn-outline-secondary">
      <i class="bi bi-list-ul"></i> All Invoices
    </a>
  </div>
</div>

<div class="receipt-container">
  
  <!-- Header / Pharmacy Brand -->
  <div class="receipt-header">
    <div class="brand-icon mx-auto mb-2" style="width:36px;height:36px;font-size:1.3rem;">
      <i class="bi bi-plus-lg"></i>
    </div>
    <div class="receipt-title"><?= h($invoice['pharmacy_name']) ?></div>
    <div class="text-muted small">
      <?= h($invoice['address']) ?>, <?= h($invoice['locality']) ?>, <?= h($invoice['city']) ?>
    </div>
    <div class="text-muted small">
      <strong>Phone:</strong> <?= h($invoice['pharmacy_phone']) ?>
    </div>
    <div class="badge bg-teal-ghost text-teal border mt-2">
      RETAIL PHARMACEUTICAL INVOICE / CASH MEMO
    </div>
  </div>

  <!-- Invoice & Customer Metadata -->
  <div class="receipt-meta">
    <div>
      <div><strong>Invoice No:</strong> <?= h($invoice['invoice_number']) ?></div>
      <div><strong>Date &amp; Time:</strong> <?= date('d M Y, h:i A', strtotime($invoice['created_at'])) ?></div>
      <div><strong>Payment Mode:</strong> <span class="badge bg-light text-dark border"><?= strtoupper(h($invoice['payment_method'])) ?></span></div>
    </div>
    <div>
      <div><strong>Customer:</strong> <?= h($invoice['customer_name']) ?></div>
      <?php if (!empty($invoice['customer_phone'])): ?>
        <div><strong>Mobile:</strong> <?= h($invoice['customer_phone']) ?></div>
      <?php endif; ?>
      <?php if (!empty($invoice['customer_email'])): ?>
        <div><strong>Email:</strong> <?= h($invoice['customer_email']) ?></div>
      <?php endif; ?>
      <?php if (!empty($invoice['doctor_name'])): ?>
        <div><strong>Doctor Ref:</strong> Dr. <?= h(preg_replace('/^dr\.?\s+/i', '', trim($invoice['doctor_name']))) ?></div>
      <?php endif; ?>
    </div>
  </div>

  <!-- Items Table -->
  <div class="table-responsive mb-3">
    <table class="table receipt-table align-middle">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Item / Formulation</th>
          <th class="text-end" style="width: 90px;">Rate</th>
          <th class="text-center" style="width: 60px;">Qty</th>
          <th class="text-end" style="width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($invoice['items'] as $idx => $item): ?>
          <tr>
            <td class="text-muted"><?= $idx + 1 ?></td>
            <td>
              <div class="fw-bold text-dark"><?= h($item['medicine_name']) ?></div>
              <?php if (!empty($item['generic_name'])): ?>
                <div class="small text-muted" style="font-size: 11px;"><?= h($item['generic_name']) ?></div>
              <?php endif; ?>
            </td>
            <td class="text-end">₹<?= number_format((float)$item['unit_price'], 2) ?></td>
            <td class="text-center fw-bold"><?= (int)$item['quantity'] ?></td>
            <td class="text-end fw-bold text-dark">₹<?= number_format((float)$item['total_price'], 2) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <!-- Summary Totals -->
  <div class="row justify-content-end mb-3">
    <div class="col-md-6 col-sm-8">
      <div class="d-flex justify-content-between py-1 border-bottom">
        <span class="text-muted">Subtotal:</span>
        <span class="fw-semibold">₹<?= number_format((float)$invoice['subtotal'], 2) ?></span>
      </div>

      <?php if ((float)$invoice['discount_amount'] > 0): ?>
        <div class="d-flex justify-content-between py-1 border-bottom text-danger">
          <span>Discount (<?= (float)$invoice['discount_percent'] ?>%):</span>
          <span>- ₹<?= number_format((float)$invoice['discount_amount'], 2) ?></span>
        </div>
      <?php endif; ?>

      <?php if ((float)$invoice['tax_amount'] > 0): ?>
        <div class="d-flex justify-content-between py-1 border-bottom text-muted">
          <span>GST / Tax (<?= (float)$invoice['tax_percent'] ?>%):</span>
          <span>+ ₹<?= number_format((float)$invoice['tax_amount'], 2) ?></span>
        </div>
      <?php endif; ?>

      <div class="d-flex justify-content-between py-2 fs-5 fw-bold text-teal border-bottom border-2 border-dark">
        <span>Grand Total:</span>
        <span>₹<?= number_format((float)$invoice['total_amount'], 2) ?></span>
      </div>
    </div>
  </div>

  <?php if (!empty($invoice['notes'])): ?>
    <div class="small text-muted mb-3 p-2 bg-light rounded">
      <strong>Notes:</strong> <?= nl2br(h($invoice['notes'])) ?>
    </div>
  <?php endif; ?>

  <!-- Receipt Footer -->
  <div class="receipt-footer">
    <p class="mb-1 fw-bold text-teal">Thank you for visiting! Wishing you a speedy recovery.</p>
    <p class="mb-0">Computer-generated medical receipt &bull; <?= h($invoice['pharmacy_name']) ?></p>
  </div>

</div>

<!-- Email Invoice Modal -->
<div class="modal fade" id="emailModal" tabindex="-1" aria-labelledby="emailModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <form method="POST">
        <input type="hidden" name="action" value="send_email">
        <div class="modal-header">
          <h5 class="modal-title fw-bold" id="emailModalLabel">
            <i class="bi bi-envelope-paper-fill text-teal me-1"></i> Send Bill via Email
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-4">
          <p class="text-muted small mb-3">
            Enter the customer's email address below to send an itemized electronic copy of Invoice <strong><?= h($invoice['invoice_number']) ?></strong>.
          </p>

          <div class="mb-3">
            <label class="form-label fw-semibold">Customer Email Address *</label>
            <div class="input-group">
              <span class="input-group-text bg-light"><i class="bi bi-envelope"></i></span>
              <input type="email" name="recipient_email" class="form-control" placeholder="customer@example.com" value="<?= h($invoice['customer_email'] ?? '') ?>" required autofocus>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <i class="bi bi-send-fill"></i> Send Invoice Now
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php if ($autoPrint): ?>
<script>
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => window.print(), 300);
});
</script>
<?php endif; ?>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
