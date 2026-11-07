# Liz Zapata Fotógrafa — inicio del proyecto

## Requisitos
- Node.js LTS instalado
- Visual Studio Code

## Abrir y ejecutar
1. Descomprime el proyecto.
2. Abre la carpeta `liz-zapata-web` desde Visual Studio Code.
3. Abre Terminal > New Terminal.
4. Ejecuta:

```bash
npm install
npm run dev
```

5. Abre la dirección local que muestre Vite (normalmente http://localhost:5173).

## Supabase
1. Crea un proyecto en Supabase.
2. En Project Settings > API copia Project URL y la clave pública `anon`/publishable.
3. Duplica `.env.example` y nombra el archivo `.env.local`.
4. Pega los valores en `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Reinicia el servidor con `Ctrl + C` y `npm run dev`.

No pongas nunca la `service_role` key en el frontend.

## Estado de esta primera entrega
- Rutas enlazadas para Inicio, Sobre mí, Categorías, Personal, Blog y contacto.
- Servicios y contacto tiene una pestaña propia (/contacto), siguiendo la maqueta aprobada, con panel amarillo, fotografía, servicios, datos de contacto y formulario.
- El logo enlaza a `/admin`.
- Formulario inicial de autenticación Supabase.
- Formulario de contacto que prepara el correo mediante mailto; la integración de envío real queda para la siguiente etapa.
- Diseño adaptable inicial para escritorio, tablet y móvil.

Las imágenes de muestra son temporales. En la siguiente etapa se reemplazarán por imágenes administrables desde Supabase Storage y contenido guardado en la base de datos. El panel CRUD y las políticas de seguridad aún deben construirse antes de publicar.
