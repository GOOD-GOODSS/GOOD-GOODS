/* ========================================================
   주문서 페이지(checkout.html)
   - 장바구니 내용을 보여주고, 입력 확인 후 "접수 완료" 화면을 보여줘요.
   - 아직 서버/결제 연동이 없어서 입력한 정보는 어디에도 전송·저장되지 않아요.
     (실제 주문을 받으려면 결제 서비스나 폼 전송 서비스를 연결해야 해요.)
======================================================== */
(function () {
  var emptyBox = document.getElementById('empty');
  var checkoutBox = document.getElementById('checkout');
  var doneBox = document.getElementById('done');
  var form = document.getElementById('order-form');
  var errorEl = document.getElementById('form-error');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderSummary() {
    var lines = Cart.lines();

    if (lines.length === 0) {
      checkoutBox.classList.add('hidden');
      emptyBox.classList.remove('hidden');
      return;
    }

    emptyBox.classList.add('hidden');
    checkoutBox.classList.remove('hidden');

    document.getElementById('summary-items').innerHTML = lines.map(function (l) {
      var p = l.product;
      return (
        '<div class="cart-item">' +
          '<img class="cart-item-img" src="' + p.imgSrc + '" alt="' + esc(p.title) + '">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-title">' + esc(p.title) + '</div>' +
            '<div class="cart-item-price">' + formatPrice(p.price) + ' × ' + l.qty + '</div>' +
          '</div>' +
          '<div>' + formatPrice(p.price * l.qty) + '</div>' +
        '</div>'
      );
    }).join('');

    document.getElementById('sum-sub').textContent = formatPrice(Cart.total());
    document.getElementById('sum-total').textContent = formatPrice(Cart.total());
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.classList.add('hidden');

    var data = new FormData(form);
    var name = String(data.get('name') || '').trim();
    var phone = String(data.get('phone') || '').trim();
    var email = String(data.get('email') || '').trim();
    var address = String(data.get('address') || '').trim();

    if (!name || !phone || !email || !address) {
      showError('이름, 연락처, 이메일, 주소를 모두 입력해 주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('이메일 형식을 확인해 주세요.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      showError('연락처를 다시 확인해 주세요.');
      return;
    }

    document.getElementById('done-name').textContent = name;   // textContent라 안전해요
    Cart.clear();
    checkoutBox.classList.add('hidden');
    doneBox.classList.remove('hidden');
    window.scrollTo(0, 0);
  });

  // 다른 탭에서 장바구니가 바뀌었을 때도 맞춰 갱신
  window.addEventListener('storage', function () { if (doneBox.classList.contains('hidden')) renderSummary(); });

  // 드로어에서 수량을 바꾸면 요약도 다시 그리기 (cart.js가 commit 후 렌더하므로 클릭 뒤에 한 번 더 갱신)
  document.addEventListener('click', function (e) {
    if (e.target.closest('#cart-overlay') && doneBox.classList.contains('hidden')) {
      setTimeout(renderSummary, 0);
    }
  });

  document.addEventListener('DOMContentLoaded', renderSummary);
})();
