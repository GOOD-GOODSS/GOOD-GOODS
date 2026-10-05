/* ========================================================
   상품 상세 페이지(product.html)
   주소 예: product.html?id=3
======================================================== */
(function () {
  var detail = document.getElementById('detail');
  var related = document.getElementById('related');
  var relatedGrid = document.getElementById('related-grid');

  var id = new URLSearchParams(window.location.search).get('id');
  var product = getProduct(id);

  // 없는 상품 번호면 안내하고 끝
  if (!product) {
    related.classList.add('hidden');
    detail.style.display = 'block';
    detail.innerHTML =
      '<div class="notfound" style="margin-top:10vh">' +
        '<p>상품을 찾을 수 없어요.</p>' +
        '<a class="checkout-btn" href="index.html">쇼핑 계속하기</a>' +
      '</div>';
    return;
  }

  document.title = product.title + ' — GOOD GOODS';

  detail.innerHTML =
    '<div class="detail-image">' +
      '<img src="' + product.imgSrc + '" alt="' + product.title + '">' +
    '</div>' +
    '<div class="detail-info">' +
      '<h1>' + product.title + '</h1>' +
      '<div class="detail-price">' + formatPrice(product.price) + '</div>' +
      '<p class="detail-desc">' + product.desc + '</p>' +
      '<div class="detail-actions">' +
        '<button class="checkout-btn" type="button" id="add-btn">ADD TO CART</button>' +
        '<a class="checkout-btn btn-outline" href="checkout.html" id="buy-btn">BUY NOW</a>' +
      '</div>' +
    '</div>';

  // 장바구니 담기: 담으면 드로어가 열려요
  document.getElementById('add-btn').addEventListener('click', function () {
    Cart.add(product.id, 1);
    Cart.open();
  });

  // 바로 구매: 담고 주문서로 이동
  document.getElementById('buy-btn').addEventListener('click', function (e) {
    e.preventDefault();
    Cart.add(product.id, 1);
    window.location.href = 'checkout.html';
  });

  // 다른 상품 (현재 상품 제외)
  PRODUCTS.filter(function (p) { return p.id !== product.id; }).slice(0, 4).forEach(function (p) {
    var card = document.createElement('a');
    card.className = 'product-card';
    card.href = 'product.html?id=' + p.id;
    card.innerHTML =
      '<div class="product-image-container">' +
        '<img src="' + p.imgSrc + '" alt="' + p.title + '" loading="lazy" />' +
      '</div>' +
      '<div class="product-info">' +
        '<span class="product-title">' + p.title + '</span>' +
        '<span class="product-price">' + formatPrice(p.price) + '</span>' +
      '</div>';
    relatedGrid.appendChild(card);
  });
})();
