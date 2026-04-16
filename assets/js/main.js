// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('mainNav');

  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      var expanded = nav.classList.contains('open');
      btn.setAttribute('aria-expanded', expanded);
      btn.setAttribute('aria-label', expanded ? 'Menu sluiten' : 'Menu openen');
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Menu openen');
        btn.focus();
      }
    });
  }

  // Mobile sub-menu toggle
  var subToggles = document.querySelectorAll('.has-sub > a');
  subToggles.forEach(function(link) {
    link.addEventListener('click', function(e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        var parent = link.parentElement;
        // Close other open sub-menus
        document.querySelectorAll('.has-sub.sub-open').forEach(function(el) {
          if (el !== parent) el.classList.remove('sub-open');
        });
        parent.classList.toggle('sub-open');
      }
    });
  });

  // Fade-in scroll animation
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });
});
