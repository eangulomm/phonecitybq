# Seguridad del sistema

Este proyecto permite que el cliente use el panel desde celular o computador entrando a una ruta privada no enlazada desde la tienda.

Ruta privada actual:

```text
/akfycbx-pcity-bq-9m4q2z/
```

## Como funciona el acceso

1. El cliente entra a la ruta privada.
2. Escribe su clave privada.
3. Apps Script valida la clave usando `Script properties`.
4. Si la clave es correcta, Apps Script crea una sesion temporal de 6 horas.
5. Las acciones privadas usan esa sesion temporal para crear, editar, ocultar productos y subir imagenes.

La clave no queda escrita dentro del frontend ni dentro de GitHub Pages.

## Configuracion obligatoria en Apps Script

En Apps Script ve a `Project Settings > Script properties` y agrega:

```text
ADMIN_PASSWORD=una_clave_larga_para_el_cliente
```

Recomendacion: usa una clave larga de 12 o mas caracteres, mezclando letras, numeros y simbolos.

Tambien puedes configurar `ADMIN_TOKEN` para integraciones privadas, pero para clientes normales usa `ADMIN_PASSWORD`.

## Endpoints publicos

Estos endpoints pueden usarse sin clave:

- `GET ?resource=products`
- `GET ?resource=product&slug=...`
- `GET ?resource=categories`
- `GET ?resource=siteConfig`
- `GET ?resource=search&q=...`
- `POST ?resource=lead`
- `POST ?resource=newsletter`
- `POST ?resource=order`
- `POST ?resource=adminLogin`

## Endpoints privados

Estos endpoints requieren `adminSessionToken` valido:

- `GET ?resource=adminProducts&adminSessionToken=...`
- `POST ?resource=uploadImage`
- `POST ?resource=createProduct`
- `POST ?resource=updateProduct`
- `POST ?resource=deleteProduct`

## Entrega a clientes

- Crea un Google Sheet y un Apps Script por cada cliente.
- Usa una clave diferente por cliente.
- No subas claves a GitHub.
- Si el cliente pierde la clave, cambia `ADMIN_PASSWORD` en Apps Script.
- Si alguien deja de trabajar con la tienda, cambia `ADMIN_PASSWORD`.
- Mantén el Web App como `Execute as: Me` y `Who has access: Anyone`, porque las acciones sensibles se protegen con sesion.

## Limitaciones

Esta seguridad es suficiente para un panel sencillo de tienda pequeña. Para venderlo como producto mas grande, con usuarios por empleado, roles, auditoria y recuperacion de contraseña, conviene migrar el admin a un backend con autenticacion real como Firebase, Supabase, Auth0 o un servidor propio.
