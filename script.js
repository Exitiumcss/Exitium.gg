/* ==========================================================
   exitium.gg — landing page scripts
   ========================================================== */

document.getElementById('yr').textContent = new Date().getFullYear();

/* ---------- animated rain canvas ---------- */
(() => {
	const c = document.getElementById('rain');
	if (!c) return;
	const ctx = c.getContext('2d');
	let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
	let drops = [];

	function resize() {
		w = window.innerWidth;
		h = window.innerHeight;
		c.width  = w * dpr;
		c.height = h * dpr;
		c.style.width  = w + 'px';
		c.style.height = h + 'px';
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const density = Math.max(60, Math.min(160, Math.floor(w * h / 14000)));
		drops = new Array(density).fill(0).map(() => spawn(true));
	}

	function spawn(initial) {
		return {
			x: Math.random() * w,
			y: initial ? Math.random() * h : -20 - Math.random() * 120,
			len: 8 + Math.random() * 18,
			spd: 180 + Math.random() * 280, // px/sec
			a: 0.12 + Math.random() * 0.35,
			hue: 270 + Math.random() * 30,
		};
	}

	let last = performance.now();
	function tick(now) {
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;

		ctx.clearRect(0, 0, w, h);
		ctx.lineCap = 'round';

		for (const d of drops) {
			d.y += d.spd * dt;
			if (d.y - d.len > h) {
				Object.assign(d, spawn(false));
			}
			ctx.strokeStyle = `hsla(${d.hue}, 90%, 72%, ${d.a})`;
			ctx.lineWidth = 1.1;
			ctx.beginPath();
			ctx.moveTo(d.x, d.y);
			ctx.lineTo(d.x + 0.4, d.y - d.len);
			ctx.stroke();
		}

		requestAnimationFrame(tick);
	}

	window.addEventListener('resize', resize, { passive: true });
	resize();
	requestAnimationFrame(tick);
})();

/* ---------- active tab highlighting via IntersectionObserver ---------- */
(() => {
	const sections = ['home', 'features', 'preview', 'gallery', 'faq']
		.map(id => document.getElementById(id))
		.filter(Boolean);
	const tabs = Array.from(document.querySelectorAll('#tabs .tab'));

	if (!sections.length || !tabs.length) return;

	function activate(id) {
		for (const t of tabs) {
			const href = t.getAttribute('href') || '';
			t.classList.toggle('active', href === '#' + id);
		}
	}

	const obs = new IntersectionObserver((entries) => {
		const visible = entries
			.filter(e => e.isIntersecting)
			.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
		if (visible[0]) activate(visible[0].target.id);
	}, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

	for (const s of sections) obs.observe(s);
})();

/* ---------- feature card hover glow (mouse-tracking gradient) ---------- */
(() => {
	const cards = document.querySelectorAll('.feature');
	for (const card of cards) {
		card.addEventListener('pointermove', (e) => {
			const r = card.getBoundingClientRect();
			card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
			card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
		});
	}
})();

/* ---------- before/after compare slider ---------- */
(() => {
	const el = document.getElementById('compare');
	if (!el) return;

	let dragging = false;
	let introDone = false;

	function setPct(pct) {
		pct = Math.max(0, Math.min(100, pct));
		el.style.setProperty('--cmp', pct + '%');
	}

	function fromEvent(e) {
		const r = el.getBoundingClientRect();
		const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
		return (x / r.width) * 100;
	}

	function start(e) {
		dragging = true;
		introDone = true;
		el.classList.add('is-dragging');
		setPct(fromEvent(e));
		e.preventDefault();
	}
	function move(e) {
		if (!dragging) return;
		setPct(fromEvent(e));
	}
	function end() {
		dragging = false;
		el.classList.remove('is-dragging');
	}

	el.addEventListener('pointerdown', start);
	window.addEventListener('pointermove', move);
	window.addEventListener('pointerup', end);
	window.addEventListener('pointercancel', end);

	/* subtle intro: slide from 70 -> 50 on load */
	let t0 = null;
	function intro(t) {
		if (introDone) return;
		if (t0 == null) t0 = t;
		const p = Math.min(1, (t - t0) / 900);
		const eased = 1 - Math.pow(1 - p, 3);
		setPct(70 - 20 * eased);
		if (p < 1) requestAnimationFrame(intro);
		else introDone = true;
	}
	setPct(70);
	requestAnimationFrame(intro);

	/* keyboard accessibility */
	el.tabIndex = 0;
	el.addEventListener('keydown', (e) => {
		const cur = parseFloat(getComputedStyle(el).getPropertyValue('--cmp')) || 50;
		if (e.key === 'ArrowLeft')  setPct(cur - 4);
		if (e.key === 'ArrowRight') setPct(cur + 4);
	});
})();
