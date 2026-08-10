import { normalizeText } from './utils'

export const DEPARTAMENTOS = [
  'Todos',
  'Hombre',
  'Mujer',
  'Niño',
  'Unisex',
]

export const DEPARTAMENTOS_PRODUCTO = DEPARTAMENTOS.filter((d) => d !== 'Todos')

export const CATEGORIAS = [
  'Todas',
  'Ropa',
  'Calzado',
  'Accesorios',
  'Maquillaje',
  'Perfumería',
  'Varios',
]

export const CATEGORIAS_PRODUCTO = CATEGORIAS.filter((c) => c !== 'Todas')

/** Categorías aceptadas en importación masiva (sin "Varios"). */
export const CATEGORIAS_IMPORTACION = CATEGORIAS_PRODUCTO.filter((c) => c !== 'Varios')

export const IMPORT_DEFAULTS = {
  departamento: 'Unisex',
  categoria: 'Varios',
  marca: 'Genérica',
}

const DEPARTAMENTO_LEGACY = {
  'Ropa Hombre': 'Hombre',
  'Ropa Mujer': 'Mujer',
  'Niño/Bebé': 'Niño',
  Bebé: 'Niño',
}

const CATEGORIA_LEGACY = {
  'Ropa Hombre': 'Ropa',
  'Ropa Mujer': 'Ropa',
  Hombre: 'Ropa',
  Mujer: 'Ropa',
  Perfumeria: 'Perfumería',
  Tenis: 'Calzado',
}

function buscarValorCanonico(valor, lista, legacyMap = {}) {
  const texto = String(valor ?? '').trim()
  if (!texto) return null

  if (legacyMap[texto]) return legacyMap[texto]
  if (lista.includes(texto)) return texto

  const clave = normalizeText(texto)
  return lista.find((item) => normalizeText(item) === clave) ?? null
}

export function normalizarDepartamento(departamento) {
  const valor = String(departamento ?? '').trim()
  return buscarValorCanonico(valor, DEPARTAMENTOS_PRODUCTO, DEPARTAMENTO_LEGACY) ?? valor
}

export function normalizarCategoria(categoria) {
  const valor = String(categoria ?? '').trim()
  return buscarValorCanonico(valor, CATEGORIAS_PRODUCTO, CATEGORIA_LEGACY) ?? valor
}

export function esDepartamentoValido(departamento) {
  return Boolean(buscarValorCanonico(departamento, DEPARTAMENTOS_PRODUCTO, DEPARTAMENTO_LEGACY))
}

export function esCategoriaValida(categoria) {
  return Boolean(buscarValorCanonico(categoria, CATEGORIAS_PRODUCTO, CATEGORIA_LEGACY))
}

export function esCategoriaImportacionValida(categoria) {
  return Boolean(buscarValorCanonico(categoria, CATEGORIAS_IMPORTACION, CATEGORIA_LEGACY))
}

export function resolverDepartamentoImportacion(valor) {
  return buscarValorCanonico(valor, DEPARTAMENTOS_PRODUCTO, DEPARTAMENTO_LEGACY)
}

export function resolverCategoriaImportacion(valor) {
  return buscarValorCanonico(valor, CATEGORIAS_IMPORTACION, CATEGORIA_LEGACY)
}

/** Migra un producto con taxonomía plana antigua a departamento + categoría. */
export function migrarTaxonomiaProducto(producto) {
  const cat = String(producto.categoria ?? '').trim()

  if (producto.departamento) {
    return {
      departamento: normalizarDepartamento(producto.departamento) || 'Unisex',
      categoria: normalizarCategoria(producto.categoria) || 'Ropa',
    }
  }

  const catNorm = normalizeText(cat)

  if (catNorm === normalizeText('Hombre') || catNorm === normalizeText('Ropa Hombre')) {
    return { departamento: 'Hombre', categoria: 'Ropa' }
  }
  if (catNorm === normalizeText('Mujer') || catNorm === normalizeText('Ropa Mujer')) {
    return { departamento: 'Mujer', categoria: 'Ropa' }
  }
  if (catNorm === normalizeText('Tenis') || catNorm === normalizeText('Calzado')) {
    return { departamento: 'Unisex', categoria: 'Calzado' }
  }
  if (catNorm === normalizeText('Accesorios')) {
    return { departamento: 'Unisex', categoria: 'Accesorios' }
  }
  if (catNorm === normalizeText('Maquillaje')) {
    return { departamento: 'Mujer', categoria: 'Maquillaje' }
  }
  if (catNorm === normalizeText('Perfumería')) {
    return { departamento: 'Unisex', categoria: 'Perfumería' }
  }

  const categoriaCanonica = buscarValorCanonico(cat, CATEGORIAS_PRODUCTO, CATEGORIA_LEGACY)
  if (categoriaCanonica) {
    return { departamento: 'Unisex', categoria: categoriaCanonica }
  }

  return { departamento: 'Unisex', categoria: cat || 'Ropa' }
}
