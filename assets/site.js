/* Terra — shared site behaviour */
(function () {
    var STORES = {
        ios: 'https://apps.apple.com/us/app/terra-photos/id6758865926',
        android: 'https://play.google.com/store/apps/details?id=com.terracool.terra'
    };

    function detectPlatform() {
        var ua = navigator.userAgent || '';
        if (/android/i.test(ua)) return 'android';
        // iPadOS reports itself as Mac; touch points give it away.
        if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
        return null;
    }

    var platform = detectPlatform();
    document.documentElement.classList.remove('no-js');
    if (platform) document.documentElement.setAttribute('data-platform', platform);

    // Header: shadow on scroll + mobile menu
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        var toggle = header.querySelector('.nav-toggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                var open = header.classList.toggle('open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            header.querySelectorAll('.nav-links a').forEach(function (a) {
                a.addEventListener('click', function () {
                    header.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    // Smart download buttons: send phones straight to their store.
    document.querySelectorAll('[data-smart-download]').forEach(function (el) {
        if (platform) el.setAttribute('href', STORES[platform]);
    });
    if (platform) {
        document.querySelectorAll('.store-badge[data-store="' + platform + '"]').forEach(function (el) {
            el.classList.add('is-recommended');
            // Put the visitor's store first.
            if (el.parentNode) el.parentNode.insertBefore(el, el.parentNode.firstChild);
        });
    }

    // Reveal on scroll
    var items = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        items.forEach(function (el) { io.observe(el); });
    } else {
        items.forEach(function (el) { el.classList.add('in'); });
    }

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    window.TerraStores = STORES;
    window.TerraPlatform = platform;
})();
