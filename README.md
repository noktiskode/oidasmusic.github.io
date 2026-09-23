# Barberena Mi Municipio — Astro

Migración del sitio Jekyll original a **Astro**, preparada para generar un sitio estático y publicarlo en GitHub Pages.

## Estructura

- `public/` — imágenes, favicon, manifest, CNAME y otros archivos estáticos.
- `src/components/` — Header, Footer, tarjetas y comentarios.
- `src/layouts/BaseLayout.astro` — estructura global y SEO.
- `src/pages/` — páginas y rutas.
- `src/content/posts/` — publicaciones Markdown migradas desde `_posts/`.
- `src/styles/global.css` — estilos originales del sitio.
- `.github/workflows/deploy.yml` — despliegue automático a GitHub Pages.

## Migración desde Jekyll

Se conservaron las 31 publicaciones Markdown, las imágenes del sitio, los favicons/manifest, los estilos editoriales, las páginas informativas y la integración existente de comentarios con Firebase. La estructura interna cambia a componentes/layouts/content collections de Astro.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilar

```bash
npm run build
```

El resultado queda en `dist/`.

## GitHub Pages

1. Sube este proyecto a un repositorio de GitHub.
2. En **Settings → Pages**, selecciona **GitHub Actions** como método de publicación.
3. El workflow compila Astro y publica `dist/`.
4. El proyecto conserva `barberenamimunicipio.top` mediante `public/CNAME`.

Si usas otro dominio, cambia `site` en `astro.config.mjs` y el contenido de `public/CNAME`.

## Contenido

Para agregar una publicación, crea un `.md` en `src/content/posts/` con el mismo frontmatter utilizado por las publicaciones existentes.

Las rutas originales tipo `/:titulo/` se mantienen para no romper los enlaces del sitio anterior.

## Comentarios

El componente de comentarios conserva la integración existente con Firebase/Firestore. Las reglas de seguridad de Firestore siguen siendo responsabilidad del proyecto Firebase.

## Nota sobre administración

Las páginas heredadas de administración/moderación se conservaron en `public/admin/` y `public/moderar.html`. GitHub Pages puede servir archivos estáticos, pero cualquier función server-side de la versión Jekyll/Cloudflare deberá mantenerse en su plataforma correspondiente si se necesita.
