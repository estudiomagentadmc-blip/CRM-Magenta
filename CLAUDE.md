# CRM Magenta

CRM gratuito para pymes y emprendedores (Entre Ríos, Argentina), desarrollado por Estudio Magenta (Marcos Agustín Martínez). Producto pensado para gente no técnica que gestiona su negocio desde el celular.

- **Sitio en vivo:** https://crm.estudiomagenta.com.ar/ (GitHub Pages + dominio NIC.ar delegado en Cloudflare)
- **Repo:** https://github.com/estudiomagentadmc-blip/CRM-Magenta (branch `main`, deploy automático de Pages)
- **Estrategia de producto:** el gancho es el "loop de cobro" — ver quién te debe → recordatorio por WhatsApp en 1 toque → registrar el cobro. Las cobranzas son el analgésico; el resto (métricas, reportes) es secundario. Priorizar siempre mobile y baja fricción.

## Arquitectura

- **App single-file:** todo vive en `index.html` (~1.300 líneas): CSS, HTML y JS sin framework ni build.
- **Datos:** objeto global `DB` (`clientes, ventas, leads, cobranzas, presupuestos, gastos, productos, cuentaCorriente`) persistido en `localStorage` (clave en `STORE_KEY`) y opcionalmente sincronizado a Google Drive (`appDataFolder`, OAuth verificado por Google — NO tocar el scope ni las URLs de privacidad/términos sin revisar la verificación).
- **PWA:** `manifest.json` + `service-worker.js` (cache `crm-magenta-v1`, red-primero para navegación). Si se cambian assets estáticos cacheados, subir la versión del cache. Banner "Instalar app" propio (`beforeinstallprompt`; en iOS muestra instrucciones).
- **Libs por CDN:** Chart.js, xlsx, jsPDF. `privacidad.html` y `terminos.html` deben seguir en este dominio (requisito de la verificación OAuth de Google).

## Trampas conocidas (costaron tiempo real)

1. **El bloque `// INIT` (`loadLocal();setStatus('off');renderAll();`) debe ser LO ÚLTIMO del script.** Si queda antes de las `const` (`C`, `FORMS`, `overlay`, `mContent`), el TDZ tira ReferenceError silencioso y TODOS los botones quedan muertos.
2. **GitHub Pages se cuelga seguido en este repo.** Después de cada push, verificar el sitio en vivo con `curl ... | grep "<string nuevo>"`; si a los ~3 min no salió, destrabar con `git commit --allow-empty && git push`. Nunca reportar "subido" sin esta verificación (skill `/crm-deploy`).
3. **Si el push rechaza con "fetch first":** el usuario tocó Settings > Pages y GitHub auto-commiteó el CNAME → `git pull --rebase origin main`.
4. **Índices en tablas:** los botones Ver/editar deben usar `DB.xxx.indexOf(item)`, no el índice de la lista filtrada (bug histórico: con búsqueda activa editaba/borraba el registro equivocado).
5. **Líneas larguísimas:** hay 3 líneas de >10k chars (logos base64). Leer el archivo por rangos o con grep; leerlo entero rompe el límite de lectura.

## Convenciones

- **Idioma:** UI y commits en español rioplatense (voseo: "Cargá", "Tenés"). Mensajes al usuario final simples, sin jerga técnica.
- **Iconografía:** un solo sistema — SVG de línea estilo Feather, `stroke="currentColor"`, clases `.ic`/`.ic-lg`. Nada de emojis en la UI (la única excepción: el logo oficial de Google en el botón de sign-in, exigido por Google).
- **Colores:** variables CSS en `:root` (`--accent: #2D5F3F` verde marca, `--danger`, `--warn`...). Usar siempre las variables.
- **Estilo JS:** compacto, sin punto y coma faltantes, funciones globales llamadas desde `onclick` inline. Los formularios viven en el objeto `FORMS`, el guardado centralizado en `saveForm()` con ramas por tipo (`cli/ven/lead/cob/pre/gas/prod`).
- **Patrón "crear al vuelo":** los selects de cliente y producto tienen opción `__nuevo__` que despliega campos inline y crea la entidad al guardar (`resolverCliente()`/`resolverProducto()`, dedup case-insensitive por nombre). Mantener este patrón para nuevas entidades.
- **Ventas recurrentes:** `procesarRecurrentes()` corre al inicio de `renderAll()`; genera ventas+cobranzas vencidas y agenda `proxima`. Guard de 36 iteraciones.
- **Cuenta corriente:** los movimientos se sincronizan vía `syncCC(...)` con dedup por `refId` — nunca insertar movimientos a mano sin `refId`.

## Verificación antes de subir

Correr la batería del skill `/crm-test` (server local en :8731 + MCP de Chrome). Mínimo indispensable: carga sin errores de consola, `cargarDatosEjemplo()`, abrir los 7 modales, y el flujo venta completa (cliente nuevo + producto nuevo + descuento → cobranza con fecha pactada).
