# Apps Script Backend

Este directorio contiene el backend completo para el ecommerce:

- `Code.gs`: archivo unico listo para copiar y pegar en Apps Script.
- `ADMIN_IMAGE_UPLOAD_EXAMPLE.html`: ejemplo de subida de imagen desde celular o computador.
- `ADMIN_CREATE_PRODUCT_EXAMPLE.html`: ejemplo de creacion de producto usando una URL de imagen subida.

## 1. Crear Google Sheet

1. Crea un Google Sheet nuevo.
2. Ponle un nombre, por ejemplo `Ecommerce Backend`.
3. Ve a `Extensiones > Apps Script`.
4. Borra el contenido inicial y pega todo el contenido de `Code.gs`.
5. Guarda el proyecto.

El codigo usa siempre:

```js
SpreadsheetApp.getActiveSpreadsheet()
```

No necesitas configurar Spreadsheet ID.

## 2. Ejecutar setupSheets()

1. En Apps Script selecciona la funcion `setupSheets`.
2. Haz clic en `Run`.
3. Acepta permisos.

Esto crea automaticamente estas hojas y encabezados:

- `Products`
- `Categories`
- `SiteConfig`
- `Banners`
- `Brands`
- `PaymentMethods`
- `Testimonials`
- `FAQ`
- `Orders`
- `Leads`
- `Newsletter`

## 3. Ejecutar seedDemoData()

1. Selecciona la funcion `seedDemoData`.
2. Haz clic en `Run`.

Esto agrega datos demo si las hojas estan vacias.

## 4. Desplegar como Web App

1. Ve a `Deploy > New deployment`.
2. Tipo: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Deploy.
6. Copia la URL del Web App.

## 4.1. Configurar clave de administrador

Antes de usar el panel privado, configura una propiedad del script:

```text
ADMIN_PASSWORD=clave_privada_del_cliente
```

Ruta en Apps Script: `Project Settings > Script properties`.

Esta clave permite entrar a `/admin` desde celular o computador. Apps Script la valida y crea una sesion temporal para proteger la lista privada de productos, subida de imagenes, creacion, actualizacion y ocultado de productos.

## 5. Conectar el frontend

En el frontend crea o edita `.env`:

```env
PUBLIC_DATA_SOURCE=remote
PUBLIC_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

Luego corre:

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'; npm.cmd run dev -- --host 127.0.0.1 --port 4321
```

## Endpoints GET

```text
GET ?resource=products
GET ?resource=product&slug=
GET ?resource=categories
GET ?resource=category&slug=
GET ?resource=brands
GET ?resource=banners
GET ?resource=faq
GET ?resource=paymentMethods
GET ?resource=testimonials
GET ?resource=siteConfig
GET ?resource=search&q=
```

Endpoint GET privado:

```text
GET ?resource=adminProducts&adminSessionToken=SESION_TEMPORAL
```

## Endpoints POST publicos

```text
POST ?resource=order
POST ?resource=lead
POST ?resource=newsletter
POST ?resource=adminLogin
```

## Endpoints POST privados

Estos requieren `adminSessionToken` dentro del JSON enviado:

```text
POST ?resource=uploadImage
POST ?resource=createProduct
POST ?resource=updateProduct
POST ?resource=deleteProduct
```

Todas las respuestas siguen:

```json
{ "ok": true, "data": {} }
```

Errores:

```json
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "Mensaje seguro" } }
```
