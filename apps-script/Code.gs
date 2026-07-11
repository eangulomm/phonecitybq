/**
 * Ecommerce API for Google Sheets + Google Apps Script.
 *
 * Copy this entire file into Extensions > Apps Script in the Google Sheet.
 * It intentionally uses SpreadsheetApp.getActiveSpreadsheet() only.
 */

var IMAGE_FOLDER_NAME = 'ecommerce_product_images';
var MAX_IMAGE_BYTES = 5 * 1024 * 1024;
var ADMIN_SESSION_TTL_SECONDS = 6 * 60 * 60;

var SHEET_HEADERS = {
  Products: [
    'id', 'slug', 'name', 'brand', 'category', 'price', 'oldPrice', 'discount',
    'images', 'mainImage', 'description', 'specs', 'stock', 'condition', 'sku',
    'featured', 'isNew', 'bestSeller', 'tags', 'active', 'sortOrder', 'updatedAt'
  ],
  Categories: ['id', 'slug', 'name', 'description', 'image', 'active', 'sortOrder', 'updatedAt'],
  SiteConfig: ['key', 'value', 'type'],
  Banners: ['id', 'title', 'text', 'href', 'image', 'active', 'sortOrder'],
  Brands: ['id', 'name', 'logo', 'active', 'sortOrder'],
  PaymentMethods: ['id', 'name', 'logo', 'active', 'sortOrder'],
  Testimonials: ['id', 'name', 'text', 'rating', 'active', 'sortOrder'],
  FAQ: ['id', 'q', 'a', 'active', 'sortOrder'],
  Orders: ['id', 'createdAt', 'status', 'customerName', 'customerPhone', 'customerEmail', 'itemsJson', 'subtotal', 'source', 'notes'],
  Leads: ['id', 'createdAt', 'name', 'phone', 'email', 'message', 'source', 'status'],
  Newsletter: ['id', 'createdAt', 'email', 'source', 'active']
};

var ALLOWED_GET_RESOURCES = {
  products: true,
  product: true,
  categories: true,
  category: true,
  brands: true,
  banners: true,
  faq: true,
  paymentMethods: true,
  testimonials: true,
  siteConfig: true,
  search: true
};

var ADMIN_GET_RESOURCES = {
  adminProducts: true
};

var ALLOWED_POST_RESOURCES = {
  order: true,
  lead: true,
  newsletter: true,
  adminLogin: true
};

var ADMIN_POST_RESOURCES = {
  uploadImage: true,
  createProduct: true,
  updateProduct: true,
  deleteProduct: true
};

var DEFAULT_SITE_CONFIG = {
  name: 'NovaCell Premium',
  tagline: 'Tecnologia premium con asesoria humana',
  logoText: 'NOVACELL',
  url: 'https://demo.tutienda.com',
  whatsapp: '573001112233',
  email: 'ventas@novacell.example',
  address: 'Bogota, Colombia',
  colors: {
    brand: '#0d9488',
    accent: '#10b981'
  },
  social: {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/'
  },
  nav: [
    { label: 'Productos', href: '/productos' },
    { label: 'Celulares', href: '/categoria/celulares' },
    { label: 'Accesorios', href: '/categoria/accesorios' },
    { label: 'Financiacion', href: '/politicas-de-venta' },
    { label: 'Contacto', href: '/contacto' }
  ],
  hero: {
    title: 'Compra tecnologia premium con respaldo real',
    subtitle: 'Celulares, accesorios y gadgets seleccionados, con garantia, pagos seguros y atencion directa por WhatsApp.',
    cta: 'Ver catalogo',
    secondaryCta: 'Hablar con asesor',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85'
  },
  banners: [
    {
      title: 'Renueva tu equipo hoy',
      text: 'Recibe asesoria para elegir el celular ideal segun tu presupuesto, uso y forma de pago.',
      href: '/productos',
      image: ''
    }
  ],
  benefits: [
    { title: 'Envios nacionales', text: 'Despachos asegurados a ciudades principales y municipios.' },
    { title: 'Garantia verificable', text: 'Productos revisados, soporte postventa y politicas claras.' },
    { title: 'Pagos seguros', text: 'Opciones de contado, transferencia y financiacion aliada.' },
    { title: 'Asesoria personalizada', text: 'Te acompanamos antes y despues de la compra.' }
  ],
  paymentMethods: ['Addi', 'Sistecredito', 'Transferencia', 'Tarjeta', 'Contraentrega'],
  brands: ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Honor', 'OPPO', 'JBL', 'LG', 'Sony', 'HP', 'Lenovo', 'Mabe'],
  testimonials: [
    { name: 'Laura M.', text: 'Me ayudaron a elegir un iPhone usado en excelente estado. Todo claro desde el primer mensaje.' },
    { name: 'Carlos R.', text: 'La compra fue rapida, el envio llego protegido y la garantia quedo por escrito.' },
    { name: 'Diana P.', text: 'La tienda se siente seria. Me explicaron diferencias de modelos sin presionarme.' }
  ],
  faq: [
    { q: 'Los productos tienen garantia?', a: 'Si. Cada producto indica su condicion, cobertura y recomendaciones de uso antes de la compra.' },
    { q: 'Puedo comprar por WhatsApp?', a: 'Si. El carrito genera un mensaje automatico con productos, cantidades y subtotal estimado.' },
    { q: 'La plantilla sirve para otros negocios?', a: 'Si. Puedes cambiar productos, categorias, textos, colores y marcas desde los datos remotos.' }
  ]
};

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_HEADERS).forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    var headers = SHEET_HEADERS[sheetName];
    var current = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn() || 1)).getValues()[0];
    var hasHeaders = current.some(function(value) { return String(value || '').trim() !== ''; });

    if (!hasHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else {
      ensureHeaders(sheet, headers);
    }
  });

  return { sheets: Object.keys(SHEET_HEADERS), status: 'ready' };
}

function seedDemoData() {
  setupSheets();
  seedIfEmpty('Categories', [
    { id: 'celulares', slug: 'celulares', name: 'Celulares', description: 'iPhone, Samsung, Xiaomi, Motorola y equipos certificados.', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', active: true, sortOrder: 1, updatedAt: nowIso() },
    { id: 'accesorios', slug: 'accesorios', name: 'Accesorios', description: 'Audio, cargadores, proteccion, wearables y perifericos.', image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=900&q=85', active: true, sortOrder: 2, updatedAt: nowIso() },
    { id: 'computadores', slug: 'computadores', name: 'Computadores', description: 'Portatiles, tablets y equipos para trabajo o estudio.', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85', active: true, sortOrder: 3, updatedAt: nowIso() },
    { id: 'hogar-tech', slug: 'hogar-tech', name: 'Hogar Tech', description: 'Electrodomesticos inteligentes, sonido y entretenimiento.', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=85', active: true, sortOrder: 4, updatedAt: nowIso() }
  ]);

  seedIfEmpty('Products', [
    {
      id: 'p-iphone-15-pro',
      slug: 'iphone-15-pro-256gb-titanio',
      name: 'iPhone 15 Pro 256GB Titanio',
      brand: 'Apple',
      category: 'celulares',
      price: 4890000,
      oldPrice: 5290000,
      discount: 8,
      images: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85,https://images.unsplash.com/photo-1695048065040-ffcd6f681a5a?auto=format&fit=crop&w=900&q=85',
      mainImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=85',
      description: 'Equipo premium con camara Pro, pantalla Super Retina y rendimiento de alto nivel.',
      specs: '{"Pantalla":"6.1 pulgadas OLED","Memoria":"256GB","Camara":"48MP Pro","Bateria":"Dia completo"}',
      stock: 5,
      condition: 'Nuevo',
      sku: 'APL-15P-256-TI',
      featured: true,
      isNew: true,
      bestSeller: true,
      tags: 'iphone,premium,5g',
      active: true,
      sortOrder: 1,
      updatedAt: nowIso()
    },
    {
      id: 'p-airpods-pro',
      slug: 'airpods-pro-2-usb-c',
      name: 'AirPods Pro 2 USB-C',
      brand: 'Apple',
      category: 'accesorios',
      price: 899000,
      oldPrice: 1049000,
      discount: 14,
      images: 'https://images.unsplash.com/photo-1606741965429-8d76ff50bb2f?auto=format&fit=crop&w=900&q=85',
      mainImage: 'https://images.unsplash.com/photo-1606741965429-8d76ff50bb2f?auto=format&fit=crop&w=900&q=85',
      description: 'Cancelacion activa de ruido, audio espacial y estuche con carga USB-C.',
      specs: '{"Conexion":"Bluetooth","Carga":"USB-C","Audio":"Espacial","Resistencia":"IP54"}',
      stock: 12,
      condition: 'Nuevo',
      sku: 'APL-APP2-USBC',
      featured: true,
      isNew: false,
      bestSeller: true,
      tags: 'audio,apple',
      active: true,
      sortOrder: 2,
      updatedAt: nowIso()
    }
  ]);

  seedIfEmpty('Brands', [
    { id: 'apple', name: 'Apple', logo: '', active: true, sortOrder: 1 },
    { id: 'samsung', name: 'Samsung', logo: '', active: true, sortOrder: 2 },
    { id: 'xiaomi', name: 'Xiaomi', logo: '', active: true, sortOrder: 3 }
  ]);

  seedIfEmpty('PaymentMethods', [
    { id: 'addi', name: 'Addi', logo: '', active: true, sortOrder: 1 },
    { id: 'sistecredito', name: 'Sistecredito', logo: '', active: true, sortOrder: 2 },
    { id: 'transferencia', name: 'Transferencia', logo: '', active: true, sortOrder: 3 }
  ]);

  seedIfEmpty('Banners', [
    { id: 'banner-renueva', title: 'Renueva tu equipo hoy', text: 'Recibe asesoria para elegir el celular ideal segun tu presupuesto, uso y forma de pago.', href: '/productos', image: '', active: true, sortOrder: 1 }
  ]);

  seedIfEmpty('Testimonials', [
    { id: 'testimonio-1', name: 'Laura M.', text: 'Me ayudaron a elegir un iPhone usado en excelente estado. Todo claro desde el primer mensaje.', rating: 5, active: true, sortOrder: 1 }
  ]);

  seedIfEmpty('FAQ', [
    { id: 'faq-garantia', q: 'Los productos tienen garantia?', a: 'Si. Cada producto indica su condicion, cobertura y recomendaciones de uso antes de la compra.', active: true, sortOrder: 1 },
    { id: 'faq-whatsapp', q: 'Puedo comprar por WhatsApp?', a: 'Si. El carrito genera un mensaje automatico con productos, cantidades y subtotal estimado.', active: true, sortOrder: 2 }
  ]);

  seedSiteConfigIfEmpty();
  return { status: 'seeded' };
}

function doGet(e) {
  try {
    setupSheets();
    var resource = sanitizeText((e && e.parameter && e.parameter.resource) || '', 40);
    if (!ALLOWED_GET_RESOURCES[resource] && !ADMIN_GET_RESOURCES[resource]) return errorResponse('INVALID_RESOURCE', 'GET resource is not allowed.', e);
    if (ADMIN_GET_RESOURCES[resource]) requireAdmin(e, null);

    var data;
    if (resource === 'products') data = getProducts();
    if (resource === 'adminProducts') data = getAdminProducts();
    if (resource === 'product') data = getProductBySlug(requiredParam(e, 'slug'));
    if (resource === 'categories') data = getCategories();
    if (resource === 'category') data = getCategoryBySlug(requiredParam(e, 'slug'));
    if (resource === 'brands') data = getBrands();
    if (resource === 'banners') data = getBanners();
    if (resource === 'faq') data = getFAQ();
    if (resource === 'paymentMethods') data = getPaymentMethods();
    if (resource === 'testimonials') data = getTestimonials();
    if (resource === 'siteConfig') data = getSiteConfig();
    if (resource === 'search') data = searchProducts((e.parameter && e.parameter.q) || '');

    return jsonResponse({ ok: true, data: data }, e);
  } catch (err) {
    return errorResponse(err.code || 'REQUEST_FAILED', err.publicMessage || 'The request could not be completed.', e);
  }
}

function doPost(e) {
  try {
    setupSheets();
    var resource = sanitizeText((e && e.parameter && e.parameter.resource) || '', 40);
    if (!ALLOWED_POST_RESOURCES[resource] && !ADMIN_POST_RESOURCES[resource]) return errorResponse('INVALID_RESOURCE', 'POST resource is not allowed.');

    var body = parsePostBody(e);
    if (ADMIN_POST_RESOURCES[resource]) requireAdmin(e, body);
    var data;
    if (resource === 'order') data = createOrder(body);
    if (resource === 'lead') data = createLead(body);
    if (resource === 'newsletter') data = createNewsletter(body);
    if (resource === 'adminLogin') data = adminLogin(body);
    if (resource === 'uploadImage') data = uploadImageToDrive(body.base64Data, body.fileName, body.mimeType);
    if (resource === 'createProduct') data = createProduct(body);
    if (resource === 'updateProduct') data = updateProduct(body);
    if (resource === 'deleteProduct') data = deleteProduct(body);

    return jsonResponse({ ok: true, data: data });
  } catch (err) {
    return errorResponse(err.code || 'REQUEST_FAILED', err.publicMessage || 'The request could not be completed.');
  }
}

function requireAdmin(e, body) {
  var expectedToken = String(PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN') || '').trim();
  var hasStaticToken = expectedToken !== '';

  var providedToken = '';
  if (body && body.adminToken) providedToken = String(body.adminToken || '').trim();
  if (!providedToken && e && e.parameter && e.parameter.adminToken) providedToken = String(e.parameter.adminToken || '').trim();
  if (hasStaticToken && constantTimeEquals(providedToken, expectedToken)) return true;

  var sessionToken = '';
  if (body && body.adminSessionToken) sessionToken = String(body.adminSessionToken || '').trim();
  if (!sessionToken && e && e.parameter && e.parameter.adminSessionToken) sessionToken = String(e.parameter.adminSessionToken || '').trim();
  if (isValidAdminSession(sessionToken)) return true;

  throw publicError('UNAUTHORIZED', 'Admin access is not authorized.');
}

function adminLogin(body) {
  body = body || {};
  var expectedPassword = String(PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || '').trim();
  var fallbackToken = String(PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN') || '').trim();
  var expected = expectedPassword || fallbackToken;
  if (!expected) throw publicError('ADMIN_PASSWORD_NOT_CONFIGURED', 'Admin password is not configured.');

  var password = String(body.password || '').trim();
  if (!constantTimeEquals(password, expected)) throw publicError('UNAUTHORIZED', 'Password is incorrect.');

  var sessionToken = generateSecureToken();
  var expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000).toISOString();
  CacheService.getScriptCache().put(adminSessionKey(sessionToken), expiresAt, ADMIN_SESSION_TTL_SECONDS);
  return {
    sessionToken: sessionToken,
    expiresAt: expiresAt
  };
}

function isValidAdminSession(sessionToken) {
  sessionToken = String(sessionToken || '').trim();
  if (!sessionToken || sessionToken.length < 40) return false;
  return Boolean(CacheService.getScriptCache().get(adminSessionKey(sessionToken)));
}

function adminSessionKey(sessionToken) {
  return 'admin_session_' + hashText(sessionToken);
}

function hashText(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''));
  return bytes.map(function(byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}

function generateSecureToken() {
  return Utilities.getUuid() + '-' + Utilities.getUuid() + '-' + Math.random().toString(36).substring(2);
}

function constantTimeEquals(a, b) {
  a = String(a || '');
  b = String(b || '');
  var maxLength = Math.max(a.length, b.length);
  var result = a.length === b.length ? 0 : 1;
  for (var i = 0; i < maxLength; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

function getProducts() {
  return readSheetObjects('Products')
    .map(normalizeProductRow)
    .filter(function(product) { return product.active !== false; })
    .sort(sortBySortOrder)
    .map(stripInternalProductFields);
}

function getAdminProducts() {
  return readSheetObjects('Products')
    .map(normalizeProductRow)
    .sort(sortBySortOrder);
}

function getProductBySlug(slug) {
  slug = sanitizeText(slug, 140);
  var product = getProducts().filter(function(item) { return item.slug === slug; })[0] || null;
  if (!product) throw publicError('NOT_FOUND', 'Product not found.');
  return product;
}

function getCategories() {
  return readSheetObjects('Categories')
    .map(normalizeCategoryRow)
    .filter(function(category) { return category.active !== false; })
    .sort(sortBySortOrder)
    .map(function(category) {
      delete category.active;
      delete category.sortOrder;
      delete category.updatedAt;
      return category;
    });
}

function getCategoryBySlug(slug) {
  slug = sanitizeText(slug, 140);
  var category = getCategories().filter(function(item) { return item.slug === slug; })[0] || null;
  if (!category) throw publicError('NOT_FOUND', 'Category not found.');
  return category;
}

function getBrands() {
  return activeSortedRows('Brands').map(function(row) {
    return { id: String(row.id || ''), name: sanitizeText(row.name, 120), logo: normalizeDriveUrl(row.logo || '') };
  });
}

function getFAQ() {
  return activeSortedRows('FAQ').map(function(row) {
    return { id: String(row.id || ''), q: sanitizeText(row.q, 240), a: sanitizeText(row.a, 1200) };
  });
}

function getTestimonials() {
  return activeSortedRows('Testimonials').map(function(row) {
    return {
      id: String(row.id || ''),
      name: sanitizeText(row.name, 120),
      text: sanitizeText(row.text, 1000),
      rating: parseNumber(row.rating)
    };
  });
}

function getPaymentMethods() {
  return activeSortedRows('PaymentMethods').map(function(row) {
    return { id: String(row.id || ''), name: sanitizeText(row.name, 120), logo: normalizeDriveUrl(row.logo || '') };
  });
}

function getBanners() {
  return activeSortedRows('Banners').map(function(row) {
    return {
      id: String(row.id || ''),
      title: sanitizeText(row.title, 180),
      text: sanitizeText(row.text, 1000),
      href: sanitizeText(row.href || '/productos', 240),
      image: normalizeDriveUrl(row.image || '')
    };
  });
}

function getSiteConfig() {
  var config = deepClone(DEFAULT_SITE_CONFIG);
  var rows = readSheetObjects('SiteConfig');

  rows.forEach(function(row) {
    var key = sanitizeText(row.key, 120);
    if (!key) return;
    setNestedValue(config, key, parseTypedValue(row.value, row.type));
  });

  var banners = getBanners();
  var paymentMethods = getPaymentMethods();
  var brands = getBrands();
  var testimonials = getTestimonials();
  var faq = getFAQ();

  config.banners = banners.length ? banners.map(function(item) {
    return { title: item.title, text: item.text, href: item.href, image: item.image };
  }) : config.banners || [];
  config.paymentMethods = paymentMethods.length ? paymentMethods.map(function(item) { return item.name; }) : config.paymentMethods || [];
  config.brands = brands.length ? brands.map(function(item) { return item.name; }) : config.brands || [];
  config.testimonials = testimonials.length ? testimonials.map(function(item) {
    return { name: item.name, text: item.text, rating: item.rating };
  }) : config.testimonials || [];
  config.faq = faq.length ? faq.map(function(item) {
    return { q: item.q, a: item.a };
  }) : config.faq || [];

  return config;
}

function searchProducts(q) {
  var query = sanitizeText(q, 160).toLowerCase();
  if (!query) return getProducts();
  return getProducts().filter(function(product) {
    return [
      product.name,
      product.brand,
      product.category,
      product.condition,
      product.sku,
      (product.tags || []).join(' ')
    ].join(' ').toLowerCase().indexOf(query) !== -1;
  });
}

function createOrder(body) {
  body = body || {};
  var customer = body.customer || {};
  var items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) throw publicError('VALIDATION_ERROR', 'Order requires at least one item.');

  var id = generateId('ORD');
  appendRow('Orders', {
    id: id,
    createdAt: nowIso(),
    status: 'received',
    customerName: sanitizeText(customer.name || body.customerName || '', 120),
    customerPhone: sanitizeText(customer.phone || body.customerPhone || '', 60),
    customerEmail: sanitizeText(customer.email || body.customerEmail || '', 160),
    itemsJson: JSON.stringify(items),
    subtotal: parseNumber(body.subtotal),
    source: sanitizeText(body.source || 'web', 80),
    notes: sanitizeText(body.notes || '', 1000)
  });

  return { orderId: id, status: 'received' };
}

function createLead(body) {
  body = body || {};
  if (!body.message && !body.phone && !body.email) throw publicError('VALIDATION_ERROR', 'Lead requires contact data or a message.');
  var id = generateId('LEAD');
  appendRow('Leads', {
    id: id,
    createdAt: nowIso(),
    name: sanitizeText(body.name || '', 120),
    phone: sanitizeText(body.phone || '', 60),
    email: sanitizeText(body.email || '', 160),
    message: sanitizeText(body.message || '', 1500),
    source: sanitizeText(body.source || 'web', 80),
    status: 'new'
  });
  return { leadId: id, status: 'new' };
}

function createNewsletter(body) {
  body = body || {};
  var email = sanitizeText(body.email || '', 160);
  if (!email || email.indexOf('@') === -1) throw publicError('VALIDATION_ERROR', 'A valid email is required.');
  var id = generateId('NEWS');
  appendRow('Newsletter', {
    id: id,
    createdAt: nowIso(),
    email: email,
    source: sanitizeText(body.source || 'newsletter', 80),
    active: true
  });
  return { newsletterId: id, active: true };
}

function createProduct(body) {
  var product = prepareProductForSheet(body || {}, false);
  if (!product.name) throw publicError('VALIDATION_ERROR', 'Product name is required.');
  product.slug = slugify(product.slug || product.name);
  product.id = generateId('PROD');
  product.updatedAt = nowIso();
  product.active = product.active !== false;

  var existing = readSheetObjects('Products').filter(function(row) {
    return slugify(row.slug || row.name) === product.slug;
  })[0];
  if (existing) throw publicError('DUPLICATE_PRODUCT', 'A product with the same slug already exists.');

  appendRow('Products', product);
  return normalizeProductRow(product);
}

function updateProduct(body) {
  var keyValue = body.id || body.slug;
  if (!keyValue) throw publicError('VALIDATION_ERROR', 'Product id or slug is required.');

  var keyField = body.id ? 'id' : 'slug';
  var product = prepareProductForSheet(body || {}, true);
  product.updatedAt = nowIso();
  validateUniqueProductSlug(product.slug, body.id || '', body.slug || '');
  var updated = updateRow('Products', product, keyField, keyValue);
  if (!updated) throw publicError('NOT_FOUND', 'Product not found.');
  return normalizeProductRow(updated);
}

function validateUniqueProductSlug(slug, currentId, currentSlug) {
  if (!slug) return;
  var normalizedSlug = slugify(slug);
  var normalizedCurrentSlug = slugify(currentSlug || '');
  var duplicate = readSheetObjects('Products').filter(function(row) {
    var sameSlug = slugify(row.slug || row.name) === normalizedSlug;
    var sameId = currentId && String(row.id) === String(currentId);
    var sameOriginalSlug = normalizedCurrentSlug && slugify(row.slug || row.name) === normalizedCurrentSlug;
    return sameSlug && !sameId && !sameOriginalSlug;
  })[0];
  if (duplicate) throw publicError('DUPLICATE_PRODUCT', 'A product with the same slug already exists.');
}

function deleteProduct(body) {
  var keyValue = (body && (body.id || body.slug)) || '';
  if (!keyValue) throw publicError('VALIDATION_ERROR', 'Product id or slug is required.');
  var keyField = body.id ? 'id' : 'slug';
  var updated = updateRow('Products', { active: false, updatedAt: nowIso() }, keyField, keyValue);
  if (!updated) throw publicError('NOT_FOUND', 'Product not found.');
  return { id: updated.id, slug: updated.slug, active: false };
}

function uploadImageToDrive(base64Data, fileName, mimeType) {
  validateImageUpload(fileName, mimeType, base64Data);
  var cleanBase64 = stripBase64Prefix(base64Data);
  var bytes = Utilities.base64Decode(cleanBase64);
  var blob = Utilities.newBlob(bytes, mimeType, sanitizeFileName(fileName));
  var folder = getOrCreateImagesFolder();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  return {
    fileId: fileId,
    url: createPublicDriveUrl(fileId)
  };
}

function getOrCreateImagesFolder() {
  var folders = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(IMAGE_FOLDER_NAME);
}

function createPublicDriveUrl(fileId) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w1200';
}

function normalizeDriveUrl(url) {
  url = String(url || '').trim();
  if (!url) return '';
  var id = '';
  var ucMatch = url.match(/[?&]id=([^&]+)/);
  if (ucMatch && ucMatch[1]) id = ucMatch[1];
  var fileMatch = url.match(/\/d\/([^/]+)/);
  if (fileMatch && fileMatch[1]) id = fileMatch[1];
  var openMatch = url.match(/[?&]id=([^&]+)/);
  if (!id && openMatch && openMatch[1]) id = openMatch[1];
  return id ? createPublicDriveUrl(id) : url;
}

function validateImageUpload(fileName, mimeType, base64Data) {
  fileName = sanitizeFileName(fileName || '');
  mimeType = String(mimeType || '').toLowerCase();
  if (!fileName) throw publicError('VALIDATION_ERROR', 'fileName is required.');
  if (!mimeType || mimeType.indexOf('image/') !== 0) throw publicError('INVALID_IMAGE', 'Only image uploads are allowed.');
  if (!base64Data) throw publicError('VALIDATION_ERROR', 'base64Data is required.');

  var cleanBase64 = stripBase64Prefix(base64Data);
  var estimatedBytes = Math.ceil((cleanBase64.length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) throw publicError('IMAGE_TOO_LARGE', 'Image exceeds the maximum allowed size of 5 MB.');
  return true;
}

function appendRow(sheetName, rowObject) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var row = headers.map(function(header) {
    return serializeValue(rowObject[header]);
  });
  sheet.appendRow(row);
  return rowObject;
}

function updateRow(sheetName, rowObject, keyField, keyValue) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var keyIndex = headers.indexOf(keyField);
  if (keyIndex === -1) throw publicError('CONFIG_ERROR', 'Key field does not exist.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    var currentKey = String(values[i][keyIndex]);
    var requestedKey = String(keyValue);
    var matches = keyField === 'slug'
      ? slugify(currentKey) === slugify(requestedKey)
      : currentKey === requestedKey;

    if (matches) {
      var current = objectFromRow(headers, values[i]);
      var merged = Object.assign({}, current, rowObject);
      var row = headers.map(function(header) {
        return serializeValue(merged[header]);
      });
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([row]);
      return merged;
    }
  }
  return null;
}

function readSheetObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(function(row) {
      return row.some(function(value) { return String(value || '').trim() !== ''; });
    })
    .map(function(row) {
      return objectFromRow(headers, row);
    });
}

function parseBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;
  var text = String(value || '').trim().toLowerCase();
  if (['true', '1', 'yes', 'si', 'y'].indexOf(text) !== -1) return true;
  if (['false', '0', 'no', 'n'].indexOf(text) !== -1) return false;
  return false;
}

function parseNumber(value) {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  var text = String(value || '').replace(/[^\d.-]/g, '');
  var number = Number(text);
  return isNaN(number) ? 0 : number;
}

function parseArray(value) {
  if (Array.isArray(value)) return value.map(function(item) { return String(item).trim(); }).filter(Boolean);
  return String(value || '')
    .split(',')
    .map(function(item) { return item.trim(); })
    .filter(Boolean);
}

function parseJson(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (err) {
    return {};
  }
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 140);
}

function generateId(prefix) {
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Etc/GMT', 'yyyyMMddHHmmss');
  var random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return String(prefix || 'ID').toUpperCase() + '-' + stamp + '-' + random;
}

function jsonResponse(payload, e) {
  var json = JSON.stringify(payload);
  var callback = sanitizeCallbackName(e && e.parameter && e.parameter.callback);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(code, message, e) {
  return jsonResponse({
    ok: false,
    error: {
      code: sanitizeText(code || 'ERROR', 80),
      message: sanitizeText(message || 'Unexpected error.', 240)
    }
  }, e);
}

function sanitizeCallbackName(value) {
  var callback = String(value || '').trim();
  if (!callback) return '';
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) return '';
  return callback.substring(0, 120);
}

function normalizeProductRow(row) {
  var images = parseArray(row.images).map(normalizeDriveUrl);
  var mainImage = normalizeDriveUrl(row.mainImage || images[0] || '');
  if (!images.length && mainImage) images = [mainImage];

  return {
    id: String(row.id || ''),
    slug: slugify(row.slug || row.name),
    name: sanitizeText(row.name, 180),
    brand: sanitizeText(row.brand, 120),
    category: sanitizeText(row.category, 120),
    price: parseNumber(row.price),
    oldPrice: row.oldPrice === '' || row.oldPrice === null || row.oldPrice === undefined ? null : parseNumber(row.oldPrice),
    discount: parseNumber(row.discount),
    images: images,
    mainImage: mainImage,
    description: sanitizeText(row.description, 2000),
    specs: parseJson(row.specs),
    stock: parseNumber(row.stock),
    condition: sanitizeText(row.condition || 'Nuevo', 80),
    sku: sanitizeText(row.sku || row.id, 120),
    featured: parseBoolean(row.featured),
    isNew: parseBoolean(row.isNew),
    bestSeller: parseBoolean(row.bestSeller),
    tags: parseArray(row.tags),
    active: row.active === '' || row.active === null || row.active === undefined ? true : parseBoolean(row.active),
    sortOrder: parseNumber(row.sortOrder),
    updatedAt: row.updatedAt || ''
  };
}

function normalizeCategoryRow(row) {
  return {
    id: String(row.id || ''),
    slug: slugify(row.slug || row.name),
    name: sanitizeText(row.name, 160),
    description: sanitizeText(row.description, 1000),
    image: normalizeDriveUrl(row.image || ''),
    active: row.active === '' || row.active === null || row.active === undefined ? true : parseBoolean(row.active),
    sortOrder: parseNumber(row.sortOrder),
    updatedAt: row.updatedAt || ''
  };
}

function stripInternalProductFields(product) {
  delete product.active;
  delete product.sortOrder;
  delete product.updatedAt;
  return product;
}

function activeSortedRows(sheetName) {
  return readSheetObjects(sheetName)
    .filter(function(row) {
      return row.active === '' || row.active === null || row.active === undefined || parseBoolean(row.active);
    })
    .sort(sortBySortOrder);
}

function sortBySortOrder(a, b) {
  var priorityA = getProductPriority(a);
  var priorityB = getProductPriority(b);
  if (priorityA !== priorityB) return priorityA - priorityB;
  var dateA = new Date(a.updatedAt || 0).getTime() || 0;
  var dateB = new Date(b.updatedAt || 0).getTime() || 0;
  return dateB - dateA;
}

function getProductPriority(product) {
  if (parseBoolean(product.featured)) return 1;
  if (parseBoolean(product.isNew) || slugify(product.category || '').indexOf('nuevo') !== -1) return 10;
  if (slugify(product.category || '').indexOf('seminuevo') !== -1 || slugify(product.condition || '').indexOf('seminuevo') !== -1) return 20;
  var manual = parseNumber(product.sortOrder);
  return manual || 30;
}

function prepareProductForSheet(body, partial) {
  var product = {};
  var allowed = SHEET_HEADERS.Products;
  allowed.forEach(function(key) {
    if (body[key] !== undefined) product[key] = body[key];
  });

  if (!partial) {
    product.id = generateId('PROD');
    product.slug = slugify(product.slug || product.name);
    product.active = product.active !== false;
  }

  if (product.name !== undefined) product.name = sanitizeText(product.name, 180);
  if (product.slug !== undefined) product.slug = slugify(product.slug || product.name);
  if (product.brand !== undefined) product.brand = sanitizeText(product.brand, 120);
  if (product.category !== undefined) product.category = sanitizeText(product.category, 120);
  if (product.description !== undefined) product.description = sanitizeText(product.description, 2000);
  if (product.condition !== undefined) product.condition = sanitizeText(product.condition || 'Nuevo', 80);
  if (product.sku !== undefined) product.sku = sanitizeText(product.sku, 120);
  if (product.mainImage !== undefined) product.mainImage = normalizeDriveUrl(product.mainImage);
  if (product.images !== undefined) product.images = parseArray(product.images).map(normalizeDriveUrl);
  if (product.tags !== undefined) product.tags = parseArray(product.tags);
  if (product.specs !== undefined && typeof product.specs !== 'string') product.specs = JSON.stringify(product.specs || {});
  ['price', 'oldPrice', 'discount', 'stock', 'sortOrder'].forEach(function(key) {
    if (product[key] !== undefined && product[key] !== null && product[key] !== '') product[key] = parseNumber(product[key]);
  });
  ['featured', 'isNew', 'bestSeller', 'active'].forEach(function(key) {
    if (product[key] !== undefined) product[key] = parseBoolean(product[key]);
  });
  if (product.sortOrder === undefined || product.sortOrder === null || product.sortOrder === '') {
    product.sortOrder = getProductPriority(product);
  }
  return product;
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw publicError('INVALID_JSON', 'Request body must be valid JSON.');
  }
}

function requiredParam(e, name) {
  var value = e && e.parameter ? e.parameter[name] : '';
  if (!value) throw publicError('VALIDATION_ERROR', name + ' is required.');
  return value;
}

function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

function getHeaders(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (lastColumn < 1) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(header) {
    return String(header || '').trim();
  }).filter(Boolean);
}

function ensureHeaders(sheet, requiredHeaders) {
  var headers = getHeaders(sheet);
  var missing = requiredHeaders.filter(function(header) { return headers.indexOf(header) === -1; });
  if (!missing.length) return;
  sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
}

function objectFromRow(headers, row) {
  var object = {};
  headers.forEach(function(header, index) {
    object[header] = row[index];
  });
  return object;
}

function serializeValue(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

function sanitizeText(value, maxLength) {
  var text = String(value === undefined || value === null ? '' : value);
  text = text.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (maxLength && text.length > maxLength) text = text.substring(0, maxLength);
  return text;
}

function sanitizeFileName(fileName) {
  var clean = sanitizeText(fileName, 160).replace(/[\\/:*?"<>|]/g, '-');
  return clean || ('image-' + Date.now() + '.jpg');
}

function stripBase64Prefix(base64Data) {
  return String(base64Data || '').replace(/^data:[^;]+;base64,/, '').trim();
}

function parseTypedValue(value, type) {
  type = String(type || 'string').toLowerCase();
  if (type === 'number') return parseNumber(value);
  if (type === 'boolean') return parseBoolean(value);
  if (type === 'array') return parseArray(value);
  if (type === 'json') return parseJson(value);
  return sanitizeText(value, 5000);
}

function setNestedValue(target, path, value) {
  var parts = String(path).split('.');
  var cursor = target;
  for (var i = 0; i < parts.length - 1; i++) {
    var key = parts[i];
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedIfEmpty(sheetName, rows) {
  if (readSheetObjects(sheetName).length) return;
  rows.forEach(function(row) { appendRow(sheetName, row); });
}

function seedSiteConfigIfEmpty() {
  if (readSheetObjects('SiteConfig').length) return;
  [
    { key: 'name', value: DEFAULT_SITE_CONFIG.name, type: 'string' },
    { key: 'tagline', value: DEFAULT_SITE_CONFIG.tagline, type: 'string' },
    { key: 'logoText', value: DEFAULT_SITE_CONFIG.logoText, type: 'string' },
    { key: 'url', value: DEFAULT_SITE_CONFIG.url, type: 'string' },
    { key: 'whatsapp', value: DEFAULT_SITE_CONFIG.whatsapp, type: 'string' },
    { key: 'email', value: DEFAULT_SITE_CONFIG.email, type: 'string' },
    { key: 'address', value: DEFAULT_SITE_CONFIG.address, type: 'string' },
    { key: 'colors.brand', value: DEFAULT_SITE_CONFIG.colors.brand, type: 'string' },
    { key: 'colors.accent', value: DEFAULT_SITE_CONFIG.colors.accent, type: 'string' },
    { key: 'hero.title', value: DEFAULT_SITE_CONFIG.hero.title, type: 'string' },
    { key: 'hero.subtitle', value: DEFAULT_SITE_CONFIG.hero.subtitle, type: 'string' },
    { key: 'hero.cta', value: DEFAULT_SITE_CONFIG.hero.cta, type: 'string' },
    { key: 'hero.secondaryCta', value: DEFAULT_SITE_CONFIG.hero.secondaryCta, type: 'string' },
    { key: 'hero.image', value: DEFAULT_SITE_CONFIG.hero.image, type: 'string' }
  ].forEach(function(row) { appendRow('SiteConfig', row); });
}

function publicError(code, message) {
  var err = new Error(message);
  err.code = code;
  err.publicMessage = message;
  return err;
}

function nowIso() {
  return new Date().toISOString();
}
