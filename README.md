# Premium Ecommerce Template

Frontend ecommerce en Astro, Tailwind CSS y JavaScript vanilla. La plantilla usa datos mock por defecto y queda preparada para consumir Google Sheets mediante Google Apps Script.

## Comandos

```powershell
npm.cmd install
$env:ASTRO_TELEMETRY_DISABLED='1'; npm.cmd run dev -- --host 127.0.0.1 --port 4321
$env:ASTRO_TELEMETRY_DISABLED='1'; npm.cmd run build
```

## Seguridad del admin

El panel `/admin` queda desactivado por defecto en builds publicos. Para usarlo en local necesitas:

```powershell
$env:PUBLIC_ENABLE_ADMIN='true'
$env:PUBLIC_ADMIN_TOKEN='EL_TOKEN_PRIVADO_DE_APPS_SCRIPT'
```

Tambien debes configurar `ADMIN_TOKEN` en `Script properties` dentro de Apps Script. Lee [SECURITY.md](./SECURITY.md) antes de entregar o vender una tienda.

## Datos

Los mocks viven en `src/data`. La capa preparada para API vive en `src/services`:

- `apiClient.js`: cliente para Apps Script.
- `mappers.js`: normaliza productos y categorías antes de usarlos.
- `products.js`, `categories.js`, `siteConfig.js`: servicios consumidos por paginas y componentes.

Para usar Apps Script:

```env
PUBLIC_DATA_SOURCE=remote
PUBLIC_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

El endpoint debe responder a `?resource=products`, `?resource=categories` y `?resource=siteConfig`, devolviendo un arreglo directo o `{ "data": [...] }`.

En GitHub Pages, el workflow reconstruye la web con Apps Script en cada push y cada 30 minutos para traer productos e imágenes nuevas desde Google Sheets.

## Estructura esperada de producto

```js
{
  id,
  slug,
  name,
  brand,
  category,
  price,
  oldPrice,
  discount,
  images,
  mainImage,
  description,
  specs,
  stock,
  condition,
  sku,
  featured,
  isNew,
  bestSeller,
  tags
}
```
