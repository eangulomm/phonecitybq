const root = document.querySelector('[data-admin]');

if (root) {
  const apiUrl = root.dataset.apiUrl;
  const output = root.querySelector('[data-admin-output]');
  const productList = root.querySelector('[data-admin-products]');
  const preview = root.querySelector('[data-image-preview]');
  const fileInput = root.querySelector('[data-admin-file]');
  const selectedStatus = root.querySelector('[data-selected-product-status]');
  const updateButton = root.querySelector('[data-update-product]');
  const message = root.querySelector('[data-admin-message]');
  const details = root.querySelector('[data-admin-details]');
  const loading = root.querySelector('[data-admin-loading]');
  const loadingTitle = root.querySelector('[data-admin-loading-title]');
  const loadingText = root.querySelector('[data-admin-loading-text]');
  let loadedProducts = [];
  let manualTags = [];

  const field = (name) => root.querySelector(`[data-field="${name}"]`);
  const fields = [
    'id',
    'name',
    'slug',
    'brand',
    'category',
    'price',
    'oldPrice',
    'discount',
    'stock',
    'sku',
    'condition',
    'mainImage',
    'images',
    'description',
    'specs',
    'tags',
    'featured',
    'isNew',
    'bestSeller',
    'active',
  ];

  root.addEventListener('click', async (event) => {
    const target = event.target;
    try {
      if (target.closest('[data-upload-image]')) await withLoading('Subiendo imagen', 'Estamos preparando la foto del producto.', uploadImage);
      if (target.closest('[data-load-products]')) await withLoading('Cargando productos', 'Estamos trayendo tu lista de productos.', loadProducts);
      if (target.closest('[data-create-product]')) await withLoading('Creando producto', 'Estamos guardando el producto nuevo.', () => saveProduct('createProduct'));
      if (target.closest('[data-update-product]')) await withLoading('Actualizando producto', 'Estamos guardando los cambios.', () => saveProduct('updateProduct'));
      if (target.closest('[data-delete-product]')) await withLoading('Ocultando producto', 'Estamos quitandolo del catalogo publico.', deleteProduct);
      if (target.closest('[data-reset-form]')) resetForm();
      if (target.closest('[data-clear-output]')) writeOutput('Listo para trabajar.');

      const productButton = target.closest('[data-edit-product]');
      if (productButton) {
        const product = loadedProducts[Number(productButton.dataset.productIndex)];
        if (!product) throw new Error('No se pudo abrir este producto. Presiona Cargar e intenta de nuevo.');
        fillForm(product);
        productList.querySelectorAll('[data-edit-product]').forEach((button) => button.classList.remove('border-brand', 'ring-2', 'ring-brand/30'));
        productButton.classList.add('border-brand', 'ring-2', 'ring-brand/30');
      }
    } catch (error) {
      showMessage(error.message, 'error');
      writeOutput({ ok: false, error: { message: error.message } });
    }
  });

  field('name')?.addEventListener('input', () => {
    field('slug').value = slugify(field('name').value);
    updateGeneratedTags();
  });

  field('slug')?.addEventListener('blur', () => {
    field('slug').value = slugify(field('slug').value || field('name').value);
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    preview.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
  });

  field('images')?.addEventListener('blur', () => {
    field('images').value = splitList(field('images').value).join(', ');
  });

  field('specs')?.addEventListener('input', updateGeneratedTags);

  field('tags')?.addEventListener('blur', () => {
    manualTags = splitList(field('tags').value).filter((tag) => !getAutoTags().includes(normalizeTag(tag)));
    updateGeneratedTags();
  });

  root.querySelectorAll('[data-money]').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = formatNumberInput(input.value);
    });
    input.addEventListener('blur', () => {
      input.value = formatNumberInput(input.value);
    });
  });

  field('category')?.addEventListener('change', () => {
    syncTypeFields();
    updateGeneratedTags();
  });

  async function uploadImage() {
    assertApiUrl();
    const files = [...(fileInput.files || [])];
    if (!files.length) throw new Error('Selecciona una o varias imagenes.');
    if (files.some((file) => !file.type.startsWith('image/'))) throw new Error('Solo puedes subir imagenes.');

    showMessage(files.length === 1 ? 'Subiendo imagen...' : `Subiendo ${files.length} imagenes...`);
    writeOutput('Subiendo imagen...');

    const uploaded = [];
    for (const file of files) {
      const base64Data = await fileToBase64(file);
      const result = await request('uploadImage', {
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });
      if (!result.ok) throw new Error(result.error?.message || 'No se pudo subir la imagen.');
      uploaded.push(result.data.url);
    }

    if (!field('mainImage').value.trim()) field('mainImage').value = uploaded[0];
    addImagesToGallery(uploaded);
    preview.src = field('mainImage').value.trim() || uploaded[0];
    preview.classList.remove('hidden');
    showMessage(files.length === 1 ? 'Imagen subida y agregada a la galeria.' : 'Imagenes subidas y agregadas a la galeria.', 'success');
    writeOutput({ ok: true, uploaded: uploaded.length, urls: uploaded });
  }

  async function loadProducts() {
    assertApiUrl();
    showMessage('Cargando productos...');
    writeOutput('Cargando productos...');
    let result = await getResource('adminProducts');
    if (!result.ok) result = await getResource('products');
    if (!result.ok) throw new Error(result.error?.message || 'No se pudieron cargar productos.');

    loadedProducts = Array.isArray(result.data) ? result.data : [];
    productList.innerHTML = result.data.length
      ? result.data.map(renderProductRow).join('')
      : '<p class="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">No hay productos activos.</p>';
    showMessage(`Listo. Se cargaron ${result.data.length} producto${result.data.length === 1 ? '' : 's'}.`, 'success');
    writeOutput({ ok: true, count: result.data.length });
  }

  async function saveProduct(resource) {
    assertApiUrl();
    const isCreate = resource === 'createProduct';
    const product = collectProduct(isCreate);
    if (!product.name) throw new Error('El nombre es obligatorio.');
    if (!product.mainImage) throw new Error('Sube o pega una imagen principal.');
    if (!isCreate && !product.id) throw new Error('Selecciona un producto del catalogo antes de actualizar.');

    showMessage(isCreate ? 'Creando producto...' : `Actualizando ${product.name}...`);
    writeOutput(isCreate ? 'Creando producto...' : `Actualizando ${product.name}...`);
    const result = await request(resource, product);
    if (!result.ok) throw new Error(result.error?.message || 'No se pudo guardar el producto.');
    fillForm(result.data);
    showMessage(isCreate ? 'Producto creado correctamente.' : 'Producto actualizado correctamente.', 'success');
    writeOutput(result);
    await loadProducts();
  }

  async function deleteProduct() {
    assertApiUrl();
    const id = field('id').value.trim();
    const slug = field('slug').value.trim();
    if (!id && !slug) throw new Error('Selecciona un producto o escribe id/slug para desactivar.');

    const result = await request('deleteProduct', { id, slug });
    if (!result.ok) throw new Error(result.error?.message || 'No se pudo desactivar el producto.');
    showMessage('Producto ocultado del catalogo.', 'success');
    writeOutput(result);
    resetForm();
    await loadProducts();
  }

  function collectProduct(isCreate = false) {
    const specs = parseSpecs(field('specs').value);

    const product = {
      id: isCreate ? undefined : field('id').value.trim() || undefined,
      name: field('name').value.trim(),
      slug: isCreate ? slugify(field('name').value) : slugify(field('slug').value || field('name').value),
      brand: 'Apple',
      category: slugify(field('category').value),
      price: numberValue('price'),
      oldPrice: numberValue('oldPrice'),
      discount: numberValue('discount'),
      images: splitList(field('images').value || field('mainImage').value),
      mainImage: field('mainImage').value.trim(),
      description: field('description').value.trim(),
      specs,
      stock: numberValue('stock'),
      condition: getConditionFromCategory(),
      sku: field('sku').value.trim(),
      featured: field('featured').checked,
      isNew: field('category').value === 'iphone-nuevo',
      bestSeller: false,
      tags: uniqueList([...getAutoTags(), ...manualTags, ...splitList(field('tags').value)]),
      active: field('active').checked,
      sortOrder: getAutomaticSortOrder(),
    };

    if (isCreate) delete product.id;
    return product;
  }

  function fillForm(product) {
    resetForm(false);
    field('id').value = product.id || '';
    field('name').value = product.name || '';
    field('slug').value = product.slug || '';
    field('brand').value = 'Apple';
    field('category').value = getCategoryFromProduct(product);
    field('price').value = formatNumberInput(product.price ?? '');
    field('oldPrice').value = formatNumberInput(product.oldPrice ?? '');
    field('discount').value = product.discount ?? '';
    field('stock').value = product.stock ?? '';
    field('sku').value = product.sku || '';
    field('condition').value = getConditionFromCategory();
    field('mainImage').value = product.mainImage || '';
    field('images').value = splitList(Array.isArray(product.images) ? product.images.join(',') : product.images || '').join(', ');
    field('description').value = product.description || '';
    field('specs').value = formatSpecs(product.specs || {});
    field('tags').value = Array.isArray(product.tags) ? product.tags.join(',') : product.tags || '';
    manualTags = splitList(field('tags').value).filter((tag) => !getAutoTags().includes(normalizeTag(tag)));
    updateGeneratedTags();
    field('featured').checked = Boolean(product.featured);
    field('isNew').value = field('category').value === 'iphone-nuevo' ? 'true' : 'false';
    field('bestSeller').value = 'false';
    field('active').checked = product.active !== false;
    if (product.mainImage) {
      preview.src = product.mainImage;
      preview.classList.remove('hidden');
    }
    setSelectedProduct(product);
  }

  function resetForm(clearOutput = true) {
    fields.forEach((name) => {
      const element = field(name);
      if (!element) return;
      if (element.type === 'checkbox') element.checked = name === 'active';
      else if (name === 'brand') element.value = 'Apple';
      else if (name === 'category') element.value = 'iphone-nuevo';
      else if (name === 'condition') element.value = 'Nuevo';
      else if (name === 'isNew') element.value = 'true';
      else if (name === 'bestSeller') element.value = 'false';
      else element.value = '';
    });
    preview.removeAttribute('src');
    preview.classList.add('hidden');
    if (fileInput) fileInput.value = '';
    setSelectedProduct(null);
    manualTags = [];
    updateGeneratedTags();
    productList.querySelectorAll('[data-edit-product]').forEach((button) => button.classList.remove('border-brand', 'ring-2', 'ring-brand/30'));
    if (clearOutput) showMessage('Formulario listo para crear un producto nuevo.', 'success');
    if (clearOutput) writeOutput('Formulario limpio.');
  }

  function setSelectedProduct(product) {
    const hasProduct = Boolean(product?.id);
    if (updateButton) updateButton.disabled = !hasProduct;
    if (!selectedStatus) return;
    selectedStatus.innerHTML = hasProduct
      ? `Editando <strong>${escapeHtml(product.name)}</strong><br><span class="text-xs">Puedes cambiar los datos y presionar Actualizar.</span>`
      : 'No hay producto seleccionado. Elige uno de la lista para editarlo o presiona Nuevo para crear otro.';
  }

  function addImagesToGallery(urls) {
    const current = splitList(field('images').value);
    urls.forEach((url) => {
      if (url && !current.includes(url)) current.push(url);
    });
    field('images').value = current.join(', ');
  }

  async function request(resource, body) {
    const response = await fetch(`${apiUrl}?resource=${encodeURIComponent(resource)}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return parseResponse(response);
  }

  async function getResource(resource) {
    const response = await fetch(`${apiUrl}?resource=${encodeURIComponent(resource)}`);
    return parseResponse(response);
  }

  function renderProductRow(product, index) {
    const isInactive = product.active === false;
    return `
      <button class="grid gap-1 rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-brand ${isInactive ? 'opacity-60' : ''}" type="button" data-edit-product data-product-index="${index}">
        <span class="flex items-center justify-between gap-3 font-black">
          ${escapeHtml(product.name)}
          ${isInactive ? '<span class="rounded-full bg-red-400/15 px-2 py-1 text-[10px] text-red-500">Inactivo</span>' : ''}
        </span>
        <span class="text-sm text-muted">${escapeHtml(getReadableType(product))} · ${product.stock || 0} disponible${Number(product.stock || 0) === 1 ? '' : 's'}</span>
        <span class="text-xs text-brand">${formatCurrency(product.price)}</span>
      </button>`;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function assertApiUrl() {
    if (!apiUrl) throw new Error('Falta PUBLIC_APPS_SCRIPT_API_URL en .env.');
  }

  async function parseResponse(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('No se pudo conectar con la tienda. Revisa el despliegue e intenta otra vez.');
    }
  }

  async function withLoading(title, text, action) {
    setLoading(true, title, text);
    try {
      return await action();
    } finally {
      setLoading(false);
    }
  }

  function setLoading(active, title = 'Procesando', text = 'Espera un momento.') {
    if (loadingTitle) loadingTitle.textContent = title;
    if (loadingText) loadingText.textContent = text;
    loading?.classList.toggle('hidden', !active);
    loading?.classList.toggle('grid', active);
    root.querySelectorAll('button, input, select, textarea').forEach((element) => {
      element.disabled = active;
    });
    if (updateButton) updateButton.disabled = active || !field('id').value.trim();
  }

  function showMessage(text, type = 'info') {
    if (!message) return;
    message.textContent = text;
    message.className = 'mb-6 rounded-2xl border p-4 text-sm font-bold leading-6';
    if (type === 'error') message.classList.add('border-red-200', 'bg-red-50', 'text-red-800');
    else if (type === 'success') message.classList.add('border-emerald-200', 'bg-emerald-50', 'text-emerald-900');
    else message.classList.add('border-sky-200', 'bg-sky-50', 'text-sky-900');
  }

  function parseSpecs(value) {
    const text = String(value || '').trim();
    if (!text) return {};
    if (text.startsWith('{')) {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Revisa las caracteristicas. Usa una por linea, ejemplo: Pantalla: 6.1 OLED.');
      }
    }

    return text.split('\n').reduce((specs, line) => {
      const [key, ...rest] = line.split(':');
      if (key?.trim() && rest.length) specs[key.trim()] = rest.join(':').trim();
      return specs;
    }, {});
  }

  function formatSpecs(specs) {
    if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return '';
    return Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  function numberValue(name) {
    const value = field(name).value;
    const clean = String(value || '').replace(/\D/g, '');
    return clean === '' ? 0 : Number(clean);
  }

  function formatNumberInput(value) {
    const clean = String(value || '').replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(clean));
  }

  function getConditionFromCategory() {
    return field('category').value === 'iphone-seminuevo' ? 'Seminuevo' : 'Nuevo';
  }

  function getCategoryFromProduct(product) {
    const category = slugify(product.category || '');
    const condition = slugify(product.condition || '');
    if (category.includes('seminuevo') || condition.includes('seminuevo') || condition.includes('usado')) return 'iphone-seminuevo';
    return 'iphone-nuevo';
  }

  function getReadableType(product) {
    return getCategoryFromProduct(product) === 'iphone-seminuevo' ? 'iPhone seminuevo' : 'iPhone nuevo';
  }

  function getAutomaticSortOrder() {
    if (field('featured').checked) return 1;
    if (field('category').value === 'iphone-nuevo') return 10;
    return 20;
  }

  function syncTypeFields() {
    field('condition').value = getConditionFromCategory();
    field('isNew').value = field('category').value === 'iphone-nuevo' ? 'true' : 'false';
  }

  function updateGeneratedTags() {
    if (!field('tags')) return;
    const tags = uniqueList([...getAutoTags(), ...manualTags]).filter(Boolean);
    field('tags').value = tags.join(', ');
  }

  function getAutoTags() {
    let specs = {};
    try {
      specs = parseSpecs(field('specs')?.value || '');
    } catch {
      specs = {};
    }
    const values = [
      'iphone',
      'apple',
      getConditionFromCategory(),
      field('category')?.value === 'iphone-nuevo' ? 'nuevo' : 'seminuevo',
      ...String(field('name')?.value || '').split(/\s+/),
      ...Object.values(specs),
    ];

    return uniqueList(
      values
        .flatMap((value) => String(value || '').split(/[\s,/+-]+/))
        .map(normalizeTag)
        .filter((tag) => tag.length > 1 && !['pro', 'max'].includes(tag)),
    ).slice(0, 14);
  }

  function normalizeTag(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  function uniqueList(items) {
    return [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];
  }

  function splitList(value) {
    return String(value || '')
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function writeOutput(value) {
    output.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  }
}
