export function isIphoneProduct(product) {
  const text = `${product?.name || ''} ${product?.brand || ''} ${product?.category || ''}`.toLowerCase();
  return text.includes('iphone');
}
