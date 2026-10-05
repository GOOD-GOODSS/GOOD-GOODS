/* ========================================================
   [GOOD GOODS 상품 목록]
   상품을 추가/수정할 때는 이 파일만 고치면 모든 페이지에 반영돼요.
   - price: 숫자(원 단위)로 적어요. 화면에는 ₩28,000 형태로 표시돼요.
   - imgSrc: 저장소 기준 상대 경로
   - desc: 상품 상세 페이지에 나오는 설명 (임시 문구이니 직접 수정하세요)
======================================================== */
const PRODUCTS = [
  { id: 1, title: 'Vintage Alarm Clock',  price: 28000, imgSrc: './images/1.png', desc: '오래된 책상 위에서 막 꺼내온 듯한 빈티지 알람 시계 오브제.' },
  { id: 2, title: 'Fozzie Bear Figurine', price: 35000, imgSrc: './images/2.png', desc: '표정이 살아 있는 곰 캐릭터 피규어. 책상이나 선반 위에 두기 좋아요.' },
  { id: 3, title: 'Monster Toy',          price: 32000, imgSrc: './images/3.png', desc: '장난기 가득한 몬스터 토이. 손에 쥐면 묵직한 존재감이 있어요.' },
  { id: 4, title: 'Skinny Alien',         price: 29000, imgSrc: './images/4.png', desc: '길쭉한 몸의 외계인 피규어. 어디에 둬도 눈에 띄는 실루엣이에요.' },
  { id: 5, title: 'Bad Boy Figure',       price: 39000, imgSrc: './images/5.png', desc: '삐딱한 자세가 매력인 베드보이 피규어. 컬렉션의 포인트가 돼요.' }
];

/* 숫자 → "₩28,000" */
function formatPrice(n) {
  return '₩' + Number(n).toLocaleString('ko-KR');
}

function getProduct(id) {
  return PRODUCTS.find(function (p) { return p.id === Number(id); });
}
