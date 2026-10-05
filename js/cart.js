/* ========================================================
   장바구니 (모든 페이지 공통)
   - 상품 id와 수량만 localStorage에 저장해서 페이지를 옮겨도 유지돼요.
   - 장바구니 드로어 HTML도 여기서 만들어 넣어요. (페이지마다 복붙 불필요)
   - products.js 를 먼저 불러와야 해요.
======================================================== */
(function () {
  var KEY = 'goodgoods-cart';

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* 저장 불가 환경이면 무시 */ }
  }

  var items = load();   // [{ id, qty }]

  /* ---------- 상태 변경 ---------- */
  function add(id, qty) {
    qty = qty || 1;
    var found = items.find(function (i) { return i.id === Number(id); });
    if (found) found.qty += qty;
    else items.push({ id: Number(id), qty: qty });
    commit();
  }

  function setQty(id, qty) {
    var found = items.find(function (i) { return i.id === Number(id); });
    if (!found) return;
    found.qty = qty;
    if (found.qty <= 0) items = items.filter(function (i) { return i.id !== Number(id); });
    commit();
  }

  function clear() {
    items = [];
    commit();
  }

  function commit() {
    save(items);
    render();
  }

  /* ---------- 조회 ---------- */
  function lines() {
    return items
      .map(function (i) {
        var p = getProduct(i.id);
        return p ? { product: p, qty: i.qty } : null;
      })
      .filter(Boolean);
  }

  function count() {
    return lines().reduce(function (s, l) { return s + l.qty; }, 0);
  }

  function total() {
    return lines().reduce(function (s, l) { return s + l.product.price * l.qty; }, 0);
  }

  /* ---------- 드로어 ---------- */
  var overlay;

  function buildDrawer() {
    overlay = document.createElement('div');
    overlay.className = 'cart-drawer-overlay';
    overlay.id = 'cart-overlay';
    overlay.innerHTML =
      '<aside class="cart-drawer" role="dialog" aria-label="장바구니">' +
        '<div class="drawer-top">' +
          '<div class="drawer-header">' +
            '<span class="drawer-title">YOUR CART</span>' +
            '<button class="close-drawer" type="button" aria-label="닫기">✕</button>' +
          '</div>' +
          '<div class="cart-items-list" id="cart-items"></div>' +
        '</div>' +
        '<div class="drawer-bottom">' +
          '<div class="drawer-total"><span>TOTAL</span><span id="cart-total">₩0</span></div>' +
          '<a class="checkout-btn" id="checkout-link" href="checkout.html">CHECKOUT</a>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) toggle(false);
    });
    overlay.querySelector('.close-drawer').addEventListener('click', function () { toggle(false); });

    // 수량/삭제 버튼은 이벤트 위임으로 처리
    overlay.querySelector('#cart-items').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = Number(btn.getAttribute('data-id'));
      var found = items.find(function (i) { return i.id === id; });
      if (!found) return;
      var act = btn.getAttribute('data-act');
      if (act === 'plus') setQty(id, found.qty + 1);
      if (act === 'minus') setQty(id, found.qty - 1);
      if (act === 'remove') setQty(id, 0);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toggle(false);
    });
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : !overlay.classList.contains('active');
    overlay.classList.toggle('active', open);
  }

  function render() {
    // 헤더의 CART (n)
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count();
    });

    if (!overlay) return;
    var list = overlay.querySelector('#cart-items');
    var ls = lines();

    if (ls.length === 0) {
      list.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    } else {
      list.innerHTML = ls.map(function (l) {
        var p = l.product;
        return (
          '<div class="cart-item">' +
            '<img class="cart-item-img" src="' + p.imgSrc + '" alt="' + p.title + '">' +
            '<div class="cart-item-info">' +
              '<div class="cart-item-title">' + p.title + '</div>' +
              '<div class="cart-item-price">' + formatPrice(p.price) + '</div>' +
              '<div class="qty">' +
                '<button type="button" data-act="minus" data-id="' + p.id + '" aria-label="수량 줄이기">−</button>' +
                '<span>' + l.qty + '</span>' +
                '<button type="button" data-act="plus" data-id="' + p.id + '" aria-label="수량 늘리기">+</button>' +
              '</div>' +
            '</div>' +
            '<button class="cart-item-remove" type="button" data-act="remove" data-id="' + p.id + '" aria-label="삭제">✕</button>' +
          '</div>'
        );
      }).join('');
    }

    overlay.querySelector('#cart-total').textContent = formatPrice(total());
    overlay.querySelector('#checkout-link').classList.toggle('disabled', ls.length === 0);
  }

  /* ---------- 초기화 ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    buildDrawer();
    render();

    // 헤더의 CART 버튼
    document.querySelectorAll('[data-cart-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });
  });

  // 다른 탭에서 장바구니가 바뀌면 같이 갱신
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { items = load(); render(); }
  });

  /* 다른 스크립트에서 쓸 수 있게 공개 */
  window.Cart = { add: add, setQty: setQty, clear: clear, lines: lines, count: count, total: total, open: function () { toggle(true); }, close: function () { toggle(false); } };
})();
