# Simulador SABRE educativo

Simulador web de un GDS con la sintaxis de comandos de Sabre, pensado para practicar reservas aéreas sin acceso a un sistema real. Todo corre en el navegador (HTML/CSS/JS, sin dependencias); los PNR, boletos y colas se guardan en `localStorage`.

> Proyecto con fines exclusivamente educativos. No está afiliado ni respaldado por Sabre GLBL Inc. Horarios, tarifas, hoteles y autos son generados y ficticios; los códigos de aerolíneas se usan solo como referencia.

## Funciones

| Área | Comandos |
|---|---|
| Sesión | `SI*1234`, `SO*`, áreas de trabajo A–F |
| Codificar / decodificar | `W/*MAD`, `W/-CCMADRID`, `W/-APHEATHROW`, `W/-ALIBERIA`, `W/EQ*789` |
| Disponibilidad | `115DECMIAMAD`, `…9A`, `…‡IB`, `1*`, `1R22DEC`, `S*MIAMAD`, `2IB921/15DEC`, `VI*` |
| Venta | `01Y1`, `02Y3Y4`, `01Y1LL`, `0IB921Y15DECMIAMADNN1`, `0A` (ARNK), `0OTH…` |
| PNR | `-` nombre (adulto, niño `*C05`, infante `-I/`), `9` teléfono, `7TAW/`, `6`, `5` observaciones, `5-` forma de pago, `PE‡`, `W-`, `DK`, `FF` |
| SSR / OSI | `3DOCS/…`, `3VGML1`, `3WCHR1`, `3OSI YY …` |
| Asientos | `4G1*` mapa, `4G1/12A`, `4GX1` |
| Finalizar | `E`, `ER`, `I`, `IR` (valida campos obligatorios, continuidad y orden) |
| Recuperar / desplegar | `*ABCDEF`, `*-PEREZ`, `*R`, `*I`, `*N`, `*P9`, `*T`, `*P3`, `*P5`, `*B`, `*FF`, `*PE`, `*H` |
| Modificar | `X2`, `X1-3`, `XI`, `.1HK`, `-1.1¤…`, `91¤…`, `52¤`, `3¤2`, `D1` (dividir) |
| Tarifas | `WP`, `WPNC`, `WPNCB`, `WPRQ`, `WPP1ADT/1CNN`, `*PQ`, `PQD-ALL`, `FQMIAMAD15DEC‡IB`, `RD1` |
| Boletos | `W‡PQ1‡FCASH`, `W‡F*VI…`, `‡KP5`, `WETR`, `WETR*2`, `WV2` (void), `WFR2` (reembolso) |
| Hotel / auto | `HOTMAD/15DEC-18DEC2`, `HOD1`, `0H1`, `CFMAD/15DEC-18DEC/1000-1000`, `0C1` |
| Colas | `QC/`, `QP/50`, `Q/50`, `I`, `QR`, `E`, `QXI` |
| Utilidades | `T‡MAD`, `T‡15DEC‡30`, `T‡125*3`, `DC‡USD100/EUR`, `MD/MU/MT/MB`, `HELP` |

Teclado: `\` = ‡, `[` = ¤, `]` = § (fin de ítem para encadenar entradas, p. ej. `6JUAN§ER`). Historial con ↑/↓, `Esc` limpia, `Alt+1..6` cambia de área.

La interfaz incluye panel gráfico del PNR, guía con 11 lecciones, formularios que generan el comando equivalente, referencia buscable y lista de registros guardados.

## Ejecutar localmente

Abre `index.html` en el navegador, o sirve la carpeta: `python3 -m http.server`.

## Despliegue en GitHub Pages

El workflow `.github/workflows/pages.yml` publica el sitio en cada push. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
