</main>

<footer class="app-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <span class="brand-icon" style="width:26px;height:26px;font-size:0.9rem;"><i class="bi bi-plus-lg"></i></span> PharmaTrack
        </div>
        <p class="footer-desc">
          A smart local medicine stock discovery and reminder portal. Helping patients locate emergency and routine prescriptions instantly across registered local pharmacies.
        </p>
      </div>

      <div>
        <div class="footer-heading">Quick Links</div>
        <ul class="footer-links">
          <li><a href="<?= base_url('index.php') ?>"><i class="bi bi-search"></i> Search Medicines</a></li>
          <li><a href="<?= base_url('register.php') ?>"><i class="bi bi-shop"></i> Register Pharmacy</a></li>
          <li><a href="<?= base_url('login.php') ?>"><i class="bi bi-box-arrow-in-right"></i> Account Login</a></li>
        </ul>
      </div>

      <div>
        <div class="footer-heading">Project Info</div>
        <ul class="footer-links">
          <li><span class="text-muted small"><i class="bi bi-mortarboard"></i> BCA Final Year Project</span></li>
          <li><span class="text-muted small"><i class="bi bi-code-slash"></i> PHP 8+ &amp; MySQL</span></li>
          <li><span class="text-muted small"><i class="bi bi-geo-alt"></i> Haversine Distance Ranking</span></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      &copy; <?= date('Y') ?> PharmaTrack. Built for reliable healthcare access.
    </div>
  </div>
</footer>

<button type="button" class="back-to-top" title="Back to top" aria-label="Back to top">
  <i class="bi bi-chevron-up"></i>
</button>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= base_url('assets/js/app.js') ?>"></script>
</body>
</html>
