import { getCategories } from '../services/categories';
import { getProducts } from '../services/products';
import { getSiteConfig } from '../services/siteConfig';
import { isIphoneProduct } from '../utils/productFilters';

const staticPages = [
  '',
  'productos',
  'contacto',
  'preguntas-frecuentes',
  'buscar',
];

export async function GET() {
  const [config, categories, products] = await Promise.all([getSiteConfig(), getCategories(), getProducts()]);
  const urls = [
    ...staticPages.map((path) => new URL(path, config.url).toString()),
    ...categories.map((category) => new URL(`categoria/${category.slug}`, config.url).toString()),
    ...products.filter(isIphoneProduct).map((product) => new URL(`productos/${product.slug}`, config.url).toString()),
  ];

  return new Response(renderSitemap(urls), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

function renderSitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;
}
