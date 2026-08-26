# Manual de usuario — Madera Boutique POS

Bienvenida / Bienvenido. Este manual está pensado para el encargado o la encargada de la boutique: cómo cobrar, cuidar el inventario, cerrar el día y proteger la información, sin jerga técnica.

El sistema funciona **sin internet**. Toda la información se guarda en la tablet. Por eso es importante no borrar datos del navegador y cerrar el día con respaldo al terminar el turno.

---

## 1. Introducción y primeros pasos

Al abrir la app verás el menú a la izquierda (en tablet o escritorio) o el botón de menú arriba a la izquierda (en pantalla chica). Ahí están las tres pestañas principales:

- **Caja** — Punto de venta. Aquí se buscan productos, se arma el carrito y se cobra.
- **Inventario** — Catálogo y existencias. Aquí se consulta el stock, se ajustan cantidades y se dan de alta productos nuevos.
- **Reportes** — Corte de caja, historial de ventas, reimpresión de tickets, devoluciones y respaldos.

### Menú de configuración (engranaje)

En la parte inferior del menú lateral está el botón **Ajustes**, con el icono de engranaje.

Al tocarlo se abre un panel con:

- **Tema (Claro / Oscuro)** — Un interruptor para cambiar la apariencia. El modo claro es más luminoso; el oscuro reduce el brillo en el local. La preferencia se recuerda la próxima vez que abras la app.
- **Zona de peligro** — El botón **Vaciar inventario**. Úsalo solo en casos muy especiales (ver la última sección de este manual).

---

## 2. Módulo de Caja (Ventas)

Esta es la pantalla del día a día. A la izquierda (o en el centro, en tablet) aparecen las tarjetas de producto; a la derecha está el **Carrito**. En pantallas chicas el carrito se abre con el botón flotante **Carrito**.

En la parte superior puedes conectar la impresora de tickets (**Conectar Impresora**). Si ya está lista, verás **Impresora Conectada**.

### Filtros rápidos y buscador

Arriba de los productos hay filtros grandes, pensados para tocarlos con el dedo:

- **Departamento** — `Todos`, `Hombre`, `Mujer`, `Niño` o `Unisex`.
- **Categoría** — `Todas`, `Ropa`, `Calzado`, `Accesorios`, `Maquillaje`, `Perfumería`, `Varios` (solo aparecen las que tienen mercancía).
- **Marca** — Lista desplegable para acotar por marca.
- **Buscar** — Escribe marca, descripción o talla. Ejemplo: `Nike`, `blusa` o `M`.

Consejo: si no encuentras un artículo, deja Departamento en **Todos**, Categoría en **Todas** y borra el texto del buscador.

Los productos sin existencia se ven atenuados y no se pueden agregar.

### Agregar productos al carrito

1. Localiza la prenda.
2. Toca el botón circular **+** (naranja) en la tarjeta.
3. Se abre **Precio de venta**. Confirma o ajusta el precio (aparece el precio base sugerido del inventario) y confirma.
4. El artículo entra al carrito con cantidad 1.

En el carrito puedes:

- Subir o bajar la cantidad con **+** y **−** (no puedes pasar del stock disponible).
- Tocar el precio para cambiarlo solo en esa venta (descuento o ajuste).
- Quitar la línea con el icono de basura.

El **Total** se actualiza solo.

### Cobro e impresión del ticket

1. Toca **Cobrar** (el botón grande naranja con el monto).
2. En **Cobrar venta** elige el método de pago:
   - **Efectivo** — Escribe el efectivo recibido. La app calcula el **cambio**. No podrás confirmar si el monto es menor al total.
   - **Transferencia** — Confirma visualmente que el pago llegó antes de finalizar.
3. Toca **Confirmar cobro**.

Al confirmar:

- La venta queda registrada.
- Se descuenta el stock de cada prenda.
- El carrito se vacía.
- Si la impresora está conectada, **el ticket se imprime automáticamente**.

Si la venta se guardó pero no salió el ticket, no cobres de nuevo: ve a **Reportes** y reimprime desde el historial.

---

## 3. Módulo de Inventario

Aquí ves el catálogo completo: departamento, categoría, marca, descripción, talla, precio y existencia.

Puedes usar los mismos filtros de Departamento, Categoría, Marca y el buscador para encontrar una prenda rápido.

### Consultar y ajustar existencias

En la tabla, la columna **Existencia** es editable:

1. Toca el número de existencias de la fila.
2. Escribe la cantidad correcta (por ejemplo, al contar anaquel o recibir mercancía).
3. Toca fuera del recuadro: el cambio se guarda al momento.

También puedes ajustar el **Precio** de la misma forma, tocando el recuadro y saliendo del campo.

Para corregir marca, talla u otros datos, usa el lápiz de **Acciones**. Para quitar un producto del catálogo, usa el icono de basura y confirma.

### Alta manual de un producto nuevo

Cuando llega una pieza que aún no está en el sistema:

1. Toca **Alta manual** (arriba a la derecha, con el icono **+**).
2. Completa el formulario:
   - **Departamento** y **Categoría**
   - **Marca**
   - **Descripción** (obligatorio)
   - **Talla / Número** (obligatorio; puede ser `M`, `42`, `Única`, etc.)
   - **Precio** y **Existencia**
3. Toca **Agregar producto**.

El artículo queda disponible de inmediato en **Caja**.

---

## 4. Reportes, corte de caja y devoluciones

La pestaña se llama **Reportes — Corte de Caja**. Arriba verás un resumen: total vendido, prendas vendidas, efectivo y transferencia.

### Filtrar ventas por fecha

Usa la barra **Fecha**:

- El **selector de fecha** (calendario) para un día concreto.
- **Hoy** — Solo las ventas del día actual (así abre la pantalla).
- **Ayer** — El turno anterior.
- **Ver Todo** — Todo el historial, sin filtrar por día.

El resumen y la tabla **Historial de ventas** siempre corresponden al periodo elegido.

### Realizar e imprimir el corte de caja

Al finalizar el turno:

1. Toca **Hoy** para ver únicamente las ventas de este día.
2. Revisa que el efectivo y las transferencias coincidan con lo que hay en caja.
3. Toca **Imprimir Corte de Caja**. Sale un ticket de resumen (totales, efectivo, transferencia y prendas).
4. Toca **Cerrar día y descargar respaldo**. Esto:
   - Descarga el Excel de las ventas del día (si hubo ventas).
   - Descarga un archivo JSON de seguridad.
   - Crea un **punto de restauración (snapshot)** interno.

Haz el cierre **una vez al terminar el turno**, con la impresora lista si necesitas el ticket de corte.

### Reimprimir tickets

En **Historial de ventas**, cada fila tiene un icono de **impresora**. Tócalo para volver a imprimir el ticket de esa venta (por ejemplo, si se acabó el papel o te lo pidieron de nuevo).

### Procesar una devolución

Las devoluciones se hacen desde el historial, no desde Caja:

1. Localiza la venta (usa **Hoy**, **Ayer** o el calendario).
2. Toca el icono de **devolver** (flecha de deshacer).
3. Confirma: *«¿Confirmas la devolución de esta venta? El dinero se restará del corte del día y los artículos regresarán al inventario.»*

Qué ocurre al confirmar:

- Las prendas **vuelven al stock** (se reingresa la existencia).
- La venta **se elimina del historial** y **ya no suma en el corte** (ni en efectivo ni en transferencia).
- No se puede deshacer: si te equivocaste, tendrás que volver a cobrar la venta en Caja.

Pide siempre el ticket original y verifica la prenda antes de confirmar.

---

## 5. Zona de seguridad y respaldos

Los datos viven en la tablet. Un cierre de día bien hecho es la mejor protección.

### Puntos de restauración (snapshots)

En Reportes, abajo, está **Puntos de Restauración (Snapshots)**.

- Se crean **automáticamente** cada vez que cierras el día con éxito.
- Se conservan los **últimos 30**.
- Cada uno guarda inventario y ventas de ese momento.

**Restaurar** sustituye **todos** los datos actuales por los de ese punto (productos y ventas). Pide confirmación y **no se puede deshacer**. Úsalo solo si hubo un error grave (por ejemplo, un vaciado accidental) y tienes certeza de la fecha y hora del respaldo.

También puedes **Exportar respaldo (JSON)** o **Restaurar base de datos** desde un archivo guardado en la tablet o una USB. Restaurar un archivo también reemplaza todo lo actual.

### Precaución: Vaciar inventario

En **Ajustes** (engranaje) → **Zona de peligro** está **Vaciar inventario**.

- Borra **todos los productos del catálogo**.
- **No se puede deshacer** desde ese botón.
- **No borra las ventas**, pero Caja quedará sin mercancía hasta que vuelvas a cargar o restaurar el inventario.

No lo uses al cerrar el día ni para “limpiar” una categoría. Si lo pulsas por error, detente y restaura el último snapshot o un respaldo JSON **antes** de seguir vendiendo.

---

## Recordatorio rápido del turno

1. Abre **Caja**, conecta la impresora si hace falta.
2. Cobra con **+**, elige **Efectivo** o **Transferencia** y confirma: el ticket sale solo.
3. Ajusta existencias o da de alta piezas en **Inventario**.
4. En **Reportes**, filtra **Hoy**, imprime el corte y pulsa **Cerrar día y descargar respaldo**.
5. No uses **Vaciar inventario** salvo instrucción explícita y con un respaldo reciente.

Si algo no cuadra (un total, un ticket o el stock), revisa primero el historial del día y el último punto de restauración antes de repetir un cobro.
