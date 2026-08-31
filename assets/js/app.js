/**
 * PharmaTrack — Client-Side Enhancements
 */
(function () {
  'use strict';

  // =====================================================================
  // Dark Mode Toggle
  // =====================================================================
  const THEME_KEY = 'pharmatrack-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const icon = document.querySelector('.theme-toggle .bi');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
  }

  // Apply theme immediately to prevent flash
  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', function () {
    // Toggle button
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
      // Re-apply so icon is correct after DOM loads
      applyTheme(getPreferredTheme());
      toggleBtn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    // =====================================================================
    // Auto-dismiss flash messages
    // =====================================================================
    document.querySelectorAll('.alert-dismissible').forEach(function (alert) {
      setTimeout(function () {
        alert.classList.add('alert-dismissing');
        setTimeout(function () {
          if (alert.parentNode) alert.parentNode.removeChild(alert);
        }, 400);
      }, 5000);
    });

    // =====================================================================
    // Back to Top Button
    // =====================================================================
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 400) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }, { passive: true });

      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // =====================================================================
    // Password Show/Hide Toggle
    // =====================================================================
    document.querySelectorAll('.password-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = this.closest('.password-wrapper').querySelector('input');
        var icon = this.querySelector('.bi');
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'bi bi-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'bi bi-eye';
        }
      });
    });

    // =====================================================================
    // Password Strength Meter
    // =====================================================================
    var pwdInput = document.querySelector('input[name="password"]');
    var strengthBar = document.querySelector('.password-strength-bar');
    if (pwdInput && strengthBar) {
      pwdInput.addEventListener('input', function () {
        var val = this.value;
        var score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        strengthBar.className = 'password-strength-bar';
        if (val.length === 0) {
          strengthBar.style.width = '0%';
        } else if (score <= 1) {
          strengthBar.classList.add('strength-weak');
        } else if (score === 2) {
          strengthBar.classList.add('strength-fair');
        } else if (score === 3) {
          strengthBar.classList.add('strength-good');
        } else {
          strengthBar.classList.add('strength-strong');
        }
      });
    }

    // =====================================================================
    // Geolocation for distance sorting
    // =====================================================================
    var locationChip = document.querySelector('.location-chip');
    if (locationChip) {
      locationChip.addEventListener('click', function () {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser.');
          return;
        }
        var chip = this;
        chip.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Locating...';

        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            // Store in hidden fields if they exist
            var latField = document.querySelector('input[name="user_lat"]');
            var lngField = document.querySelector('input[name="user_lng"]');
            if (latField) latField.value = lat;
            if (lngField) lngField.value = lng;
            chip.innerHTML = '<i class="bi bi-geo-alt-fill"></i> Location set';
            chip.classList.add('active');
          },
          function () {
            chip.innerHTML = '<i class="bi bi-geo-alt"></i> Location denied';
            setTimeout(function () {
              chip.innerHTML = '<i class="bi bi-geo-alt"></i> Use my location';
            }, 2000);
          }
        );
      });
    }

    // =====================================================================
    // Client-side Table Sorting
    // =====================================================================
    document.querySelectorAll('.sortable').forEach(function (header) {
      header.addEventListener('click', function () {
        var table = this.closest('table');
        var tbody = table.querySelector('tbody');
        var idx = Array.from(this.parentNode.children).indexOf(this);
        var rows = Array.from(tbody.querySelectorAll('tr'));
        var asc = !this.classList.contains('sort-asc');

        // Reset all headers
        this.parentNode.querySelectorAll('.sortable').forEach(function (h) {
          h.classList.remove('sort-asc', 'sort-desc');
        });
        this.classList.add(asc ? 'sort-asc' : 'sort-desc');

        rows.sort(function (a, b) {
          var aText = a.children[idx].textContent.trim().replace(/[₹,]/g, '');
          var bText = b.children[idx].textContent.trim().replace(/[₹,]/g, '');
          var aNum = parseFloat(aText);
          var bNum = parseFloat(bText);

          if (!isNaN(aNum) && !isNaN(bNum)) {
            return asc ? aNum - bNum : bNum - aNum;
          }
          return asc
            ? aText.localeCompare(bText)
            : bText.localeCompare(aText);
        });

        rows.forEach(function (row) {
          tbody.appendChild(row);
        });
      });
    });

    // =====================================================================
    // Stock Table Filter (client-side instant search)
    // =====================================================================
    var stockFilter = document.getElementById('stockFilterInput');
    if (stockFilter) {
      stockFilter.addEventListener('input', function () {
        var query = this.value.toLowerCase();
        var table = document.querySelector('.stock-table');
        if (!table) return;
        table.querySelectorAll('tbody tr').forEach(function (row) {
          var text = row.textContent.toLowerCase();
          row.style.display = text.includes(query) ? '' : 'none';
        });
      });
    }

    // =====================================================================
    // Category Pill Filtering
    // =====================================================================
    document.querySelectorAll('.category-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var category = this.dataset.category;
        var table = document.querySelector('.stock-table');
        if (!table) return;

        // Toggle active
        if (this.classList.contains('active')) {
          this.classList.remove('active');
          table.querySelectorAll('tbody tr').forEach(function (row) {
            row.style.display = '';
          });
          return;
        }

        document.querySelectorAll('.category-pill').forEach(function (p) {
          p.classList.remove('active');
        });
        this.classList.add('active');

        table.querySelectorAll('tbody tr').forEach(function (row) {
          var rowCat = row.querySelector('[data-category]');
          if (!rowCat) {
            row.style.display = '';
            return;
          }
          row.style.display = rowCat.dataset.category === category ? '' : 'none';
        });
      });
    });

    // =====================================================================
    // CSV Export
    // =====================================================================
    var exportBtn = document.getElementById('exportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var table = document.querySelector('.stock-table');
        if (!table) return;

        var csv = [];
        table.querySelectorAll('tr').forEach(function (row) {
          var cols = [];
          row.querySelectorAll('th, td').forEach(function (cell) {
            var text = cell.textContent.trim().replace(/"/g, '""');
            cols.push('"' + text + '"');
          });
          csv.push(cols.join(','));
        });

        var blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'stock-list.csv';
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    // =====================================================================
    // Share / Copy URL
    // =====================================================================
    var shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var btn = this;
        navigator.clipboard.writeText(window.location.href).then(function () {
          var originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
          }, 2000);
        });
      });
    }

    // =====================================================================
    // Confirmation Modals (replace browser confirm())
    // =====================================================================
    document.querySelectorAll('[data-confirm]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var message = this.getAttribute('data-confirm');
        var href = this.getAttribute('href');
        var icon = this.dataset.confirmIcon || '⚠️';

        var modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML =
          '<div class="modal-dialog modal-sm modal-dialog-centered">' +
            '<div class="modal-content modal-confirm">' +
              '<div class="modal-body">' +
                '<span class="modal-icon">' + icon + '</span>' +
                '<p class="mb-0">' + message + '</p>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>' +
                '<a href="' + href + '" class="btn btn-primary">Confirm</a>' +
              '</div>' +
            '</div>' +
          '</div>';

        document.body.appendChild(modal);
        var bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', function () {
          document.body.removeChild(modal);
        });
      });
    });

    // =====================================================================
    // Admin Filter Tabs
    // =====================================================================
    document.querySelectorAll('.filter-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var status = this.dataset.status;
        document.querySelectorAll('.filter-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        this.classList.add('active');

        var table = document.querySelector('.filterable-table');
        if (!table) return;
        table.querySelectorAll('tbody tr').forEach(function (row) {
          if (status === 'all') {
            row.style.display = '';
          } else {
            row.style.display = row.dataset.status === status ? '' : 'none';
          }
        });
      });
    });

    // =====================================================================
    // Reminder Countdown
    // =====================================================================
    document.querySelectorAll('.countdown').forEach(function (el) {
      var time = el.dataset.time; // "HH:MM" format
      if (!time) return;

      function update() {
        var now = new Date();
        var parts = time.split(':');
        var target = new Date();
        target.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);

        if (target <= now) {
          target.setDate(target.getDate() + 1);
        }

        var diff = target - now;
        var hours = Math.floor(diff / 3600000);
        var mins = Math.floor((diff % 3600000) / 60000);
        el.textContent = 'Next in ' + hours + 'h ' + mins + 'm';
      }
      update();
      setInterval(update, 60000);
    });

    // =====================================================================
    // Quick Time Buttons (reminders)
    // =====================================================================
    document.querySelectorAll('.quick-time').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var timeInput = document.querySelector('input[name="reminder_time"]');
        if (timeInput) {
          timeInput.value = this.dataset.time;
        }
      });
    });

    // =====================================================================
    // Geolocation for Pharmacy Profile
    // =====================================================================
    var geoBtn = document.getElementById('getMyLocation');
    if (geoBtn) {
      geoBtn.addEventListener('click', function () {
        if (!navigator.geolocation) {
          alert('Geolocation not supported.');
          return;
        }
        var btn = this;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Getting location...';

        navigator.geolocation.getCurrentPosition(
          function (pos) {
            document.querySelector('input[name="latitude"]').value = pos.coords.latitude.toFixed(7);
            document.querySelector('input[name="longitude"]').value = pos.coords.longitude.toFixed(7);
            btn.innerHTML = '<i class="bi bi-check-circle"></i> Location set!';
            btn.disabled = false;
          },
          function () {
            btn.innerHTML = '<i class="bi bi-geo-alt"></i> Get My Location';
            btn.disabled = false;
            alert('Could not get your location. Please enter coordinates manually.');
          }
        );
      });
    }

  }); // end DOMContentLoaded
})();
