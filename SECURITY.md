# Seguridad del sistema

Este proyecto separa la tienda publica del panel de administracion. La tienda puede vivir en GitHub Pages, pero el panel no debe publicarse abierto para clientes finales.

## Regla principal

Nunca publiques un panel de administracion funcional dentro del sitio publico. En GitHub Pages, `/admin` queda desactivado por defecto.

## Apps Script

Las acciones privadas del backend exigen un token:

- `GET ?resource=adminProducts`
- `POST ?resource=uploadImage`
- `POST ?resource=createProduct`
- `POST ?resource=updateProduct`
- `POST ?resource=deleteProduct`

Configura el token en Apps Script:

1. Abre el proyecto de Apps Script.
2. Ve a `Project Settings`.
3. En `Script properties`, agrega:

```text
ADMIN_TOKEN=un_token_largo_y_dificil_de_adivinar
```

Usa un valor largo, por ejemplo de 40 a 64 caracteres mezclando letras, numeros y simbolos.

## Frontend publico

Para publicar la tienda:

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'; $env:PUBLIC_DATA_SOURCE='remote'; $env:PUBLIC_APPS_SCRIPT_API_URL='https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec'; npm.cmd run build
```

No configures `PUBLIC_ENABLE_ADMIN=true` en GitHub Pages ni en un hosting publico.

## Panel privado

Para usar el admin solo en tu computador o en un entorno privado:

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
$env:PUBLIC_DATA_SOURCE='remote'
$env:PUBLIC_APPS_SCRIPT_API_URL='https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec'
$env:PUBLIC_ENABLE_ADMIN='true'
$env:PUBLIC_ADMIN_TOKEN='el_mismo_token_de_apps_script'
npm.cmd run dev -- --host 127.0.0.1 --port 4321
```

Luego entra a:

```text
http://127.0.0.1:4321/phonecitybq/admin
```

## Recomendaciones para venderlo

- Crea un Google Sheet y un Apps Script por cada cliente.
- Usa un `ADMIN_TOKEN` diferente por cliente.
- No subas `.env` a GitHub.
- No reutilices tokens entre tiendas.
- Si un cliente pierde acceso, cambia `ADMIN_TOKEN` en Apps Script y en su entorno privado.
- Mantén el Web App de Apps Script como `Execute as: Me` y `Who has access: Anyone`, pero protege toda accion de administracion con token.
- Para un producto mas robusto, crea un panel admin separado con login real en un backend propio o con Firebase/Supabase/Auth0.
