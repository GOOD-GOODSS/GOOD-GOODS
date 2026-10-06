/* ========================================================
   메인 화면 (index.html)
   - 인트로 애니메이션 → 가로 캐러셀 + 아이팟 클릭휠 → 상품 모달
   - 상품 목록은 products.js, 장바구니는 cart.js 를 그대로 써요.
   - 외부 라이브러리 없이 requestAnimationFrame 으로 직접 움직여요.
======================================================== */
(function () {
  var N = PRODUCTS.length;
  var $ = function (id) { return document.getElementById(id); };
  var body = document.body;

  var stage = $('stage');
  var hudTitle = $('hud-title');
  var modal = $('modal');
  var card = $('m-card');
  var mTitle = $('m-title');
  var mMedia = $('m-media');
  var mImg = $('m-img');
  var mDesc = $('m-desc');
  var mMore = $('m-more');
  var mMoreSign = $('m-more-sign');
  var mQty = $('m-qty');
  var mAdd = $('m-add');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 작은 도우미들 ---------- */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function mod(v, n) { return ((v % n) + n) % n; }
  function wrap(d) { d = mod(d, N); return d > N / 2 ? d - N : d; }   // -N/2 ~ N/2
  function easeOutCubic(k) { return 1 - Math.pow(1 - k, 3); }
  function easeOutQuart(k) { return 1 - Math.pow(1 - k, 4); }
  function easeInOutCubic(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- 캐러셀 배치 규칙 ----------
     가운데에서 떨어진 정도(a = 0, 1, 2…)에 따라 가로 위치(vw)와 크기를 정해요.
     a 가 소수일 때는 사이 값을 부드럽게 이어 줘서, 움직이는 중에도 끊기지 않아요. */
  var KX_DESKTOP = [0, 28, 50, 68, 90];
  var KX_MOBILE = [0, 44, 76, 98, 120];
  var KS = [1, 0.55, 0.4, 0.3, 0.25];

  function isMobile() { return window.innerWidth <= 700; }

  function knot(k, a) {
    a = Math.abs(a);
    var last = k.length - 1;
    if (a >= last) return k[last] + (a - last) * (k[last] - k[last - 1]);
    var i = Math.floor(a);
    return lerp(k[i], k[i + 1], a - i);
  }

  /* ---------- 상태 ---------- */
  var items = [];
  var pos = 0;            // 지금 가운데에 오는 상품 번호 (소수 가능)
  var anim = null;        // 진행 중인 이동 애니메이션
  var intro = null;       // 인트로 진행 정보
  var ready = false;      // 인트로가 끝나서 조작 가능한지
  var modalOpen = false;
  var modalIndex = 0;
  var rowY = 41;          // 상품 줄의 세로 위치(%)
  var labelIdx = -1;
  var itemPx = 160;
  var raf = 0;

  /* ---------- 상품 만들기 ---------- */
  PRODUCTS.forEach(function (p, i) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'item';
    el.setAttribute('aria-label', p.title);
    el.innerHTML = '<span class="item-in"><img src="' + p.imgSrc + '" alt="" draggable="false"></span>';
    el.addEventListener('click', function () { onItemClick(i); });
    stage.appendChild(el);
    items.push({ el: el, inner: el.firstChild, ex: 1 });
  });

  function measure() { itemPx = items[0].el.offsetWidth || 160; }

  /* ---------- 그리기 ---------- */
  // spreadT: 0 = 인트로 초반의 촘촘한 한 줄, 1 = 완성된 캐러셀
  function render(spreadT) {
    var vw = window.innerWidth / 100;
    var kx = isMobile() ? KX_MOBILE : KX_DESKTOP;
    var packedStep = itemPx * 0.5;

    for (var i = 0; i < N; i++) {
      var it = items[i];
      var d = wrap(i - pos);
      var a = Math.abs(d);

      var xFinal = (d < 0 ? -1 : 1) * knot(kx, a) * vw;
      var xPacked = d * packedStep;
      var x = lerp(xPacked, xFinal, spreadT);

      var sFinal = Math.max(0.15, knot(KS, a));
      var s = lerp(0.5, sFinal, spreadT);

      it.el.style.transform = 'translate(-50%, -50%) translate3d(' + x.toFixed(2) + 'px,0,0) scale(' + s.toFixed(4) + ')';
      it.el.style.zIndex = String(100 - Math.round(a * 10));

      var ex = it.ex;
      it.inner.style.opacity = ex > 0.001 ? '1' : '0';
      it.inner.style.transform = 'skewX(' + (-(1 - ex) * 28).toFixed(2) + 'deg) scaleX(' + Math.max(ex, 0.0001).toFixed(4) + ')';
    }
    stage.style.setProperty('--row-y', rowY.toFixed(2) + '%');
    updateLabel();
  }

  function updateLabel() {
    if (!ready) return;
    var idx = mod(Math.round(pos), N);
    if (idx !== labelIdx) {
      labelIdx = idx;
      hudTitle.textContent = PRODUCTS[idx].title;
    }
  }

  /* ---------- 애니메이션 루프 ---------- */
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function frame(now) {
    raf = 0;
    var active = false;
    var spreadT = 1;

    if (intro) {
      var t = now - intro.t0;

      // 1) 상품이 왼쪽부터 얇은 조각으로 나타나 펴져요
      items.forEach(function (it, i) {
        it.ex = easeOutCubic(clamp((t - intro.delay[i]) / 480, 0, 1));
      });
      // 2) 촘촘한 줄이 넓게 벌어져요
      spreadT = easeInOutCubic(clamp((t - 800) / 800, 0, 1));
      // 3) 빠르게 돌다가 점점 느려져요
      var k = clamp((t - 900) / 2000, 0, 1);
      pos = intro.p0 + (intro.p1 - intro.p0) * easeOutQuart(k);
      // 4) 줄이 위로 올라가요
      rowY = lerp(50, 41, easeOutCubic(clamp((t - 1800) / 800, 0, 1)));

      if (t >= 1900 && !intro.wheel) { intro.wheel = true; body.classList.add('wheel-in'); }
      if (t >= 2400 && !intro.hud) { intro.hud = true; body.classList.add('hud-in'); }

      if (t >= 2900) { finishIntro(); spreadT = 1; }
      else active = true;
    }

    if (anim) {
      var kk = clamp((now - anim.t0) / anim.dur, 0, 1);
      pos = anim.from + (anim.to - anim.from) * anim.ease(kk);
      if (kk >= 1) anim = null; else active = true;
    }

    render(spreadT);
    if (active) raf = requestAnimationFrame(frame);
  }

  function animateTo(target, dur, ease) {
    anim = { from: pos, to: target, t0: performance.now(), dur: dur || 420, ease: ease || easeOutCubic };
    kick();
  }

  function step(dir) {
    var base = anim ? anim.to : Math.round(pos);
    animateTo(base + dir, 420);
  }

  /* ---------- 인트로 ---------- */
  function startIntro() {
    measure();
    var p0 = N - 1;                       // 마지막 상품이 가운데에서 시작
    pos = p0;
    var delay = [];
    for (var i = 0; i < N; i++) {
      var d = wrap(i - p0);
      var rank = d < 0 ? -2 * d - 1 : 2 * d;   // 0, -1, +1, -2, +2 … 순서로 등장
      delay.push(rank * 90);
    }
    items.forEach(function (it) { it.ex = 0; });
    rowY = 50;
    intro = { t0: performance.now(), p0: p0, p1: N * 2, delay: delay, wheel: false, hud: false };
    render(0);
    kick();
  }

  function finishIntro() {
    intro = null;
    pos = 0;
    items.forEach(function (it) { it.ex = 1; });
    rowY = 41;
    body.classList.add('wheel-in', 'hud-in');
    ready = true;
    labelIdx = -1;
  }

  function skipIntro() {
    measure();
    finishIntro();
    render(1);
  }

  /* ---------- 클릭 / 드래그 / 휠 / 키보드 ---------- */
  var drag = null;
  var suppressClick = false;

  function spacingPx() {
    var kx = isMobile() ? KX_MOBILE : KX_DESKTOP;
    return kx[1] * window.innerWidth / 100;
  }

  stage.addEventListener('pointerdown', function (e) {
    if (!ready || modalOpen) return;
    drag = { x: e.clientX, pos0: pos, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 };
  });

  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; anim = null; }
    if (!drag.moved) return;
    pos = drag.pos0 - dx / spacingPx();
    var dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = e.timeStamp;
    render(1);
  });

  function endDrag() {
    if (!drag) return;
    if (drag.moved) {
      var base = Math.round(pos);
      var target = Math.round(pos - (drag.v * 220) / spacingPx());
      target = clamp(target, base - 2, base + 2);
      animateTo(target, 480);
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
    }
    drag = null;
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  var wheelAcc = 0;
  var wheelLock = 0;
  window.addEventListener('wheel', function (e) {
    if (!ready || modalOpen) return;
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAcc += delta;
    var now = performance.now();
    if (Math.abs(wheelAcc) > 40 && now - wheelLock > 220) {
      step(wheelAcc > 0 ? 1 : -1);
      wheelAcc = 0;
      wheelLock = now;
    }
  }, { passive: true });

  function onItemClick(i) {
    if (suppressClick || !ready || modalOpen) return;
    var d = wrap(i - pos);
    if (Math.abs(d) < 0.5) openModal(i);
    else animateTo(Math.round(pos) + Math.round(d), 420);
  }

  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Escape' && modalOpen) { closeModal(); return; }
    if (!ready) return;
    if (e.key === 'ArrowRight') { modalOpen ? modalStep(1) : step(1); }
    if (e.key === 'ArrowLeft') { modalOpen ? modalStep(-1) : step(-1); }
  });

  /* ---------- 클릭휠 버튼 ---------- */
  $('w-prev').addEventListener('click', function () { if (!ready) return; modalOpen ? modalStep(-1) : step(-1); });
  $('w-next').addEventListener('click', function () { if (!ready) return; modalOpen ? modalStep(1) : step(1); });
  $('w-center').addEventListener('click', function () { if (ready && !modalOpen) openModal(mod(Math.round(pos), N)); });
  $('w-close').addEventListener('click', function () { if (modalOpen) closeModal(); });
  // MENU: 처음 상품으로 돌아가요 (아이팟의 MENU처럼)
  $('w-menu').addEventListener('click', function () {
    if (!ready || modalOpen) return;
    animateTo(Math.round(pos / N) * N, 700, easeOutQuart);
  });

  /* ---------- 상품 모달 ---------- */
  function fillModal(i) {
    var p = PRODUCTS[i];
    mTitle.textContent = p.title;
    mDesc.textContent = p.desc;
    mAdd.innerHTML = 'Add to cart - <b>' + formatPrice(p.price) + '</b>';
    mImg.alt = p.title;
    setMore(false);

    // 이미지는 불러온 뒤 부드럽게 나타나요
    mMedia.classList.remove('loaded');
    mImg.onload = function () { mMedia.classList.add('loaded'); };
    mImg.src = p.imgSrc;
    if (mImg.complete && mImg.naturalWidth) {
      requestAnimationFrame(function () { mMedia.classList.add('loaded'); });
    }
  }

  function setMore(show) {
    mMedia.classList.toggle('show-desc', show);
    mMore.setAttribute('aria-expanded', show ? 'true' : 'false');
    mMoreSign.textContent = show ? '−' : '+';
  }
  mMore.addEventListener('click', function () { setMore(!mMedia.classList.contains('show-desc')); });

  function openModal(i) {
    modalIndex = i;
    mQty.value = '1';
    fillModal(i);
    card.scrollTop = 0;
    modalOpen = true;
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    setTimeout(function () { card.focus({ preventScroll: true }); }, 50);
  }

  function closeModal() {
    modalOpen = false;
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    $('w-center').focus({ preventScroll: true });
  }

  function modalStep(dir) {
    modalIndex = mod(modalIndex + dir, N);
    card.classList.add('swap');
    setTimeout(function () {
      fillModal(modalIndex);
      card.scrollTop = 0;
      card.classList.remove('swap');
    }, 140);
    step(dir);   // 뒤에 있는 캐러셀도 같이 넘겨 둬요 (닫았을 때 위치가 맞도록)
  }

  // 모달 바깥(흰 영역)을 누르면 닫혀요
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  var addTimer = 0;
  mAdd.addEventListener('click', function () {
    var p = PRODUCTS[modalIndex];
    Cart.add(p.id, Number(mQty.value) || 1);
    mAdd.textContent = 'Added ✓';
    clearTimeout(addTimer);
    addTimer = setTimeout(function () {
      mAdd.innerHTML = 'Add to cart - <b>' + formatPrice(p.price) + '</b>';
    }, 1400);
    Cart.open();
  });

  window.addEventListener('resize', function () { measure(); render(intro ? 1 : 1); });

  /* ---------- 시작: 이미지를 모두 불러온 뒤 인트로 재생 ---------- */
  var loaded = 0;
  var started = false;
  function begin() {
    if (started) return;
    started = true;
    if (reduceMotion) skipIntro(); else startIntro();
  }
  PRODUCTS.forEach(function (p) {
    var im = new Image();
    im.onload = im.onerror = function () { loaded++; if (loaded >= N) begin(); };
    im.src = p.imgSrc;
  });
  setTimeout(begin, 3000);   // 이미지가 늦어도 3초 뒤에는 시작
})();
