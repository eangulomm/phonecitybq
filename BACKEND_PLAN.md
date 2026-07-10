# Backend Plan: Google Sheets + Apps Script

Este frontend ya puede consumir datos remotos desde Google Apps Script cambiando variables de entorno. El backend debe exponer un Web App que lea Google Sheets, normalice filas y devuelva JSON estable.

## Conexion Desde El Frontend

Crear un archivo `.env` basado en `.env.example`:

```env
PUBLIC_DATA_SOURCE=remote
PUBLIC_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

El frontend llamara el Web App asi:

```text
GET https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?resource=products
GET https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?resource=categories
GET https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?resource=siteConfig
```

Cada respuesta puede ser un arreglo directo o un objeto `{ "data": ... }`. Se recomienda usar `{ "ok": true, "data": ... }`.

## Estructura Recomendada De Google Sheets

Usa un archivo de Google Sheets con estas hojas:

- `Products`
- `Categories`
- `SiteConfig`
- `Banners`
- `PaymentMethods`
- `Brands`
- `Testimonials`
- `FAQ`
- `Orders`
- `Leads`
- `Newsletter`

## Hoja Products

Columnas:

```text
id
slug
name
brand
category
price
oldPrice
discount
images
mainImage
description
specs
stock
condition
sku
featured
isNew
bestSeller
tags
active
sortOrder
updatedAt
```

Formato de columnas especiales:

- `images`: URLs separadas por coma.
- `specs`: JSON string, por ejemplo `{"Pantalla":"6.1 OLED","Memoria":"256GB"}`.
- `tags`: etiquetas separadas por coma.
- `featured`, `isNew`, `bestSeller`, `active`: `TRUE` o `FALSE`.
- `price`, `oldPrice`, `discount`, `stock`, `sortOrder`: numeros.

Respuesta JSON:

```json
{
  "ok": true,
  "data": [
    {
      "id": "p-iphone-15-pro",
      "slug": "iphone-15-pro-256gb-titanio",
      "name": "iPhone 15 Pro 256GB Titanio",
      "brand": "Apple",
      "category": "celulares",
      "price": 4890000,
      "oldPrice": 5290000,
      "discount": 8,
      "images": [
        "https://drive.google.com/uc?export=view&id=FILE_ID_1",
        "https://drive.google.com/uc?export=view&id=FILE_ID_2"
      ],
      "mainImage": "https://drive.google.com/uc?export=view&id=FILE_ID_1",
      "description": "Equipo premium con camara Pro, pantalla Super Retina y rendimiento de alto nivel.",
      "specs": {
        "Pantalla": "6.1 pulgadas OLED",
        "Memoria": "256GB",
        "Camara": "48MP Pro"
      },
      "stock": 5,
      "condition": "Nuevo",
      "sku": "APL-15P-256-TI",
      "featured": true,
      "isNew": true,
      "bestSeller": true,
      "tags": ["iphone", "premium", "5g"]
    }
  ]
}
```

## Hoja Categories

Columnas:

```text
id
slug
name
description
image
active
sortOrder
updatedAt
```

Respuesta JSON:

```json
{
  "ok": true,
  "data": [
    {
      "id": "celulares",
      "slug": "celulares",
      "name": "Celulares",
      "description": "iPhone, Samsung, Xiaomi, Motorola y equipos certificados.",
      "image": "https://drive.google.com/uc?export=view&id=FILE_ID"
    }
  ]
}
```

## Hoja SiteConfig

Recomendado en formato clave/valor:

```text
key
value
type
```

Ejemplos:

```text
name | NovaCell Premium | string
tagline | Tecnologia premium con asesoria humana | string
logoText | NOVACELL | string
url | https://tudominio.com | string
whatsapp | 573001112233 | string
email | ventas@tudominio.com | string
address | Bogota, Colombia | string
hero.title | Compra tecnologia premium con respaldo real | string
hero.subtitle | Celulares, accesorios y gadgets seleccionados... | string
hero.image | https://drive.google.com/uc?export=view&id=FILE_ID | string
colors.brand | #0d9488 | string
colors.accent | #10b981 | string
```

Respuesta JSON:

```json
{
  "ok": true,
  "data": {
    "name": "NovaCell Premium",
    "tagline": "Tecnologia premium con asesoria humana",
    "logoText": "NOVACELL",
    "url": "https://tudominio.com",
    "whatsapp": "573001112233",
    "email": "ventas@tudominio.com",
    "address": "Bogota, Colombia",
    "colors": {
      "brand": "#0d9488",
      "accent": "#10b981"
    },
    "hero": {
      "title": "Compra tecnologia premium con respaldo real",
      "subtitle": "Celulares, accesorios y gadgets seleccionados, con garantia, pagos seguros y atencion directa por WhatsApp.",
      "cta": "Ver catalogo",
      "secondaryCta": "Hablar con asesor",
      "image": "https://drive.google.com/uc?export=view&id=FILE_ID"
    }
  }
}
```

## Hojas Complementarias

### Banners

Columnas:

```text
id
title
text
href
image
active
sortOrder
```

### PaymentMethods

Columnas:

```text
id
name
logo
active
sortOrder
```

### Brands

Columnas:

```text
id
name
logo
active
sortOrder
```

### Testimonials

Columnas:

```text
id
name
text
rating
active
sortOrder
```

### FAQ

Columnas:

```text
id
q
a
active
sortOrder
```

## Endpoints GET

Minimos para este frontend:

```text
GET ?resource=products
GET ?resource=categories
GET ?resource=siteConfig
```

Recomendados despues:

```text
GET ?resource=product&slug=iphone-15-pro-256gb-titanio
GET ?resource=category&slug=celulares
GET ?resource=search&q=ipad
GET ?resource=brands
GET ?resource=paymentMethods
GET ?resource=faq
GET ?resource=banners
```

Formato de error:

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

## Endpoints POST

Para capturar acciones comerciales:

```text
POST ?resource=order
POST ?resource=lead
POST ?resource=newsletter
```

### POST order

Body:

```json
{
  "customer": {
    "name": "Cliente Demo",
    "phone": "573001112233",
    "email": "cliente@email.com"
  },
  "items": [
    {
      "id": "p-airpods-pro",
      "sku": "APL-APP2-USBC",
      "name": "AirPods Pro 2 USB-C",
      "qty": 1,
      "price": 899000
    }
  ],
  "subtotal": 899000,
  "source": "web"
}
```

Guardar en hoja `Orders` con columnas:

```text
id
createdAt
status
customerName
customerPhone
customerEmail
itemsJson
subtotal
source
notes
```

Respuesta:

```json
{
  "ok": true,
  "data": {
    "orderId": "ORD-20260709-0001",
    "status": "received"
  }
}
```

### POST lead

Body:

```json
{
  "name": "Cliente Demo",
  "phone": "573001112233",
  "email": "cliente@email.com",
  "message": "Quiero asesoria para comprar un iPhone.",
  "source": "contact"
}
```

Guardar en hoja `Leads`:

```text
id
createdAt
name
phone
email
message
source
status
```

### POST newsletter

Body:

```json
{
  "email": "cliente@email.com",
  "source": "newsletter"
}
```

Guardar en hoja `Newsletter`:

```text
id
createdAt
email
source
active
```

## Imagenes Subidas A Google Drive

Opcion simple:

1. Crear carpeta publica en Google Drive para imagenes del catalogo.
2. Subir imagenes optimizadas en `.webp`, `.jpg` o `.png`.
3. Configurar cada archivo como "Cualquier persona con el enlace puede ver".
4. Copiar el `FILE_ID` del enlace.
5. Guardar en Sheets la URL:

```text
https://drive.google.com/uc?export=view&id=FILE_ID
```

Ejemplo:

```text
https://drive.google.com/file/d/1ABCxyz123/view?usp=sharing
```

Se convierte en:

```text
https://drive.google.com/uc?export=view&id=1ABCxyz123
```

Recomendaciones:

- Usar imagenes de producto cuadradas, ideal 1200x1200.
- Comprimir antes de subir.
- Evitar imagenes mayores a 500 KB cuando sea posible.
- Guardar `mainImage` y `images` en Sheets.
- Si Google Drive da problemas de cache o cuotas, migrar imagenes a Cloudinary, Firebase Storage o un CDN.

## Recomendaciones De Seguridad

- No guardar secretos en el frontend. Las variables `PUBLIC_*` son publicas.
- Validar `resource` contra una lista permitida.
- En POST, validar campos requeridos, tipos y longitud maxima.
- Sanitizar texto antes de guardar en Sheets.
- Implementar rate limiting basico con `CacheService` por IP aproximada o token.
- No exponer hojas internas, correos privados ni IDs administrativos.
- Para escritura, usar un token simple en header o body si el endpoint no debe ser publico.
- Registrar `createdAt`, `source` y `userAgent` para auditoria.
- Responder siempre JSON; no devolver errores crudos de Apps Script.
- Activar CORS solo para los dominios necesarios cuando el sitio tenga dominio final.
- Mantener backups periodicos del Google Sheet.

## Pseudocodigo Apps Script

```js
function doGet(e) {
  const resource = e.parameter.resource;
  const routes = {
    products: getProducts,
    categories: getCategories,
    siteConfig: getSiteConfig,
    product: () => getProductBySlug(e.parameter.slug),
    category: () => getCategoryBySlug(e.parameter.slug)
  };

  if (!routes[resource]) return json({ ok: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
  return json({ ok: true, data: routes[resource]() });
}

function doPost(e) {
  const resource = e.parameter.resource;
  const body = JSON.parse(e.postData.contents || '{}');

  if (resource === 'order') return json({ ok: true, data: createOrder(body) });
  if (resource === 'lead') return json({ ok: true, data: createLead(body) });
  if (resource === 'newsletter') return json({ ok: true, data: createNewsletter(body) });

  return json({ ok: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } });
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```
