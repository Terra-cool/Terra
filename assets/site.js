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

    // In-page section links (#features, /#faq, ...).
    // The browser's native jump happens before fonts/images settle, so the
    // layout shifts afterwards and the target ends up off-screen or under the
    // sticky header. Handle the scroll ourselves and re-align once settled.
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var userScrolled = false;
    ['wheel', 'touchmove', 'keydown'].forEach(function (ev) {
        window.addEventListener(ev, function () { userScrolled = true; }, { passive: true });
    });

    function targetFor(hash) {
        if (!hash || hash.length < 2) return null;
        try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
    }

    function alignTo(el) {
        var offset = (header ? header.offsetHeight : 0) + 12;
        var top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    }

    function scrollToTarget(el, smooth) {
        if (!smooth || reduceMotion) { alignTo(el); return; }
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Fix up any drift once the smooth scroll finishes.
        var done = false;
        var settle = function () {
            if (done) return; done = true;
            window.removeEventListener('scrollend', settle);
            if (!userScrolled) alignTo(el);
        };
        if ('onscrollend' in window) window.addEventListener('scrollend', settle);
        setTimeout(settle, 1200);
    }

    function samePage(a) {
        var strip = function (p) { return p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/$/, '') || '/'; };
        return a.origin === location.origin && strip(a.pathname) === strip(location.pathname);
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var a = e.target.closest && e.target.closest('a[href*="#"]');
        if (!a || a.target === '_blank' || !samePage(a)) return;
        var el = targetFor(a.hash);
        if (!el) return;
        e.preventDefault();
        if (header && header.classList.contains('open')) {
            header.classList.remove('open');
            var t = header.querySelector('.nav-toggle');
            if (t) t.setAttribute('aria-expanded', 'false');
        }
        userScrolled = false;
        if (location.hash !== a.hash) history.pushState(null, '', a.hash);
        scrollToTarget(el, true);
        if (el.id === 'main') { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    });

    // Arriving from another page with a hash (e.g. /support -> /#faq).
    if (targetFor(location.hash)) {
        var realign = function () { var el = targetFor(location.hash); if (el && !userScrolled) alignTo(el); };
        realign();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(realign);
        window.addEventListener('load', function () { realign(); setTimeout(realign, 300); });
    }

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

    window.TerraStores = STORES;
    window.TerraPlatform = platform;
})();
