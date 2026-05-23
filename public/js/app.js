'use strict';

// ── File upload drag-and-drop enhancement (already in upload.ejs inline) ──

// ── Auto-dismiss flash messages after 6 seconds ──
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert-success, .alert-error, .alert-info, .alert-warning');
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s ease, max-height 0.5s ease, margin 0.5s ease';
      alert.style.opacity = '0';
      alert.style.maxHeight = '0';
      alert.style.overflow = 'hidden';
      alert.style.marginBottom = '0';
      setTimeout(() => alert.remove(), 500);
    }, 6000);
  });
});
