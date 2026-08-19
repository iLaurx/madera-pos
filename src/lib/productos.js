import { CATEGORIAS, normalizarCategoria, normalizarDepartamento } from './constants'
import { normalizeText } from './utils'

export function etiquetaProducto(producto) {
  const marca = producto?.marca?.trim() ?? ''
  const descripcion =
    producto?.descripcion?.trim() ?? producto?.marcaDescripcion?.trim() ?? ''

  if (marca && descripcion) return `${marca} — ${descripcion}`
  return descripcion || marca || 'Producto'
}

export function extraerMarcasUnicas(productos) {
  if (!productos?.length) return []

  return [
    ...new Set(
      productos
        .map((p) => p.marca?.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Categorías con productos dentro del departamento activo (siempre incluye "Todas"). */
export function extraerCategoriasPorDepartamento(productos, departamento) {
  if (!productos?.length) return CATEGORIAS

  const filtrados = filtrarProductos(productos, departamento, 'Todas', 'Todas', '')
  const presentes = new Set()

  for (const producto of filtrados) {
    const cat = normalizarCategoria(producto.categoria)?.trim()
    if (cat) presentes.add(cat)
  }

  const opciones = CATEGORIAS.filter((cat) => cat === 'Todas' || presentes.has(cat))
  for (const cat of presentes) {
    if (!opciones.includes(cat)) opciones.push(cat)
  }

  return opciones
}

export function categoriaSigueDisponible(categorias, categoriaSeleccionada) {
  if (!categoriaSeleccionada || categoriaSeleccionada === 'Todas') return true

  const clave = normalizeText(categoriaSeleccionada)
  return categorias.some((cat) => normalizeText(cat) === clave)
}

/** Marcas presentes en el subconjunto ya filtrado por departamento y/o categoría. */
export function extraerMarcasPorTaxonomia(
  productos,
  departamento,
  categoria,
  { soloConExistencia = false } = {},
) {
  const filtrados = filtrarProductos(productos, departamento, categoria, 'Todas', '')
  const origen = soloConExistencia
    ? filtrados.filter((producto) => (producto.existencia ?? 0) > 0)
    : filtrados

  return extraerMarcasUnicas(origen)
}

export function marcaSigueDisponible(marcas, marcaSeleccionada) {
  if (!marcaSeleccionada || marcaSeleccionada === 'Todas') return true

  const clave = normalizeText(marcaSeleccionada)
  return marcas.some((marca) => normalizeText(marca) === clave)
}

export function filtrarProductos(productos, departamento, categoria, marca = 'Todas', busqueda = '') {
  if (!productos) return []

  const termino = normalizeText(busqueda)

  return productos.filter((producto) => {
    const depProducto = normalizarDepartamento(producto.departamento)
    const catProducto = normalizarCategoria(producto.categoria)

    const coincideDepartamento =
      departamento === 'Todos' ||
      normalizeText(depProducto) === normalizeText(departamento)
    if (!coincideDepartamento) return false

    const coincideCategoria =
      categoria === 'Todas' ||
      normalizeText(catProducto) === normalizeText(categoria)
    if (!coincideCategoria) return false

    const coincideMarca =
      marca === 'Todas' ||
      !marca ||
      normalizeText(producto.marca) === normalizeText(marca)
    if (!coincideMarca) return false

    if (!termino) return true

    const descripcion = producto.descripcion ?? producto.marcaDescripcion ?? ''
    const texto = normalizeText(
      [
        producto.departamento,
        producto.categoria,
        producto.marca,
        descripcion,
        producto.talla,
      ]
        .filter(Boolean)
        .join(' '),
    )

    return texto.includes(termino)
  })
}

/** Con stock primero; sin existencia al final (para Caja). */
export function ordenarStockPrimero(productos) {
  if (!productos?.length) return []

  return [...productos].sort((a, b) => {
    const aSinStock = (a.existencia ?? 0) <= 0
    const bSinStock = (b.existencia ?? 0) <= 0
    if (aSinStock === bSinStock) return 0
    return aSinStock ? 1 : -1
  })
}

export function cantidadEnCarritoPorProducto(carrito, productoId, excludeCartItemId = null) {
  return carrito
    .filter(
      (item) =>
        item.productoId === productoId &&
        item.cartItemId !== excludeCartItemId,
    )
    .reduce((sum, item) => sum + item.cantidad, 0)
}

import { safeRandomId } from './safeWeb'

export function crearCartItemId() {
  return safeRandomId('cart')
}
