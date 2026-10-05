/* ========================================================
   메인 페이지(index.html): 상품 그리드 만들기
   카드를 누르면 product.html?id=상품번호 로 이동해요.
======================================================== */
(function () {
  var grid = document.getElementById('product-grid');
  if (!grid) return;

  PRODUCTS.forEach(function (product) {
    var card = document.createElement('a');
    card.className = 'product-card';
    card.href = 'product.html?id=' + product.id;

    card.innerHTML =
      '<div class="product-image-container">' +
        '<img src="' + product.imgSrc + '" alt="' + product.title + '" loading="lazy" />' +
      '</div>' +
      '<div class="product-info">' +
        '<span class="product-title">' + product.title + '</span>' +
        '<span class="product-price">' + formatPrice(product.price) + '</span>' +
      '</div>';

    grid.appendChild(card);
  });
})();
