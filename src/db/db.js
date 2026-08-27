import Dexie from 'dexie'
import { migrarTaxonomiaProducto } from '../lib/constants'

export const db = new Dexie('MaderaBoutique')

db.version(1).stores({
  productos: '++id, categoria, marcaDescripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
})

db.version(2).stores({
  productos: '++id, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
}).upgrade((tx) =>
  tx
    .table('productos')
    .toCollection()
    .modify((producto) => {
      if (!producto.descripcion && producto.marcaDescripcion) {
        producto.descripcion = producto.marcaDescripcion
      }
      if (producto.marca == null) {
        producto.marca = ''
      }
      delete producto.marcaDescripcion
    }),
)

db.version(3).stores({
  productos: '++id, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
}).upgrade((tx) =>
  tx.table('productos').toCollection().modify((producto) => {
    if (producto.categoria === 'Ropa Hombre') producto.categoria = 'Hombre'
    if (producto.categoria === 'Ropa Mujer') producto.categoria = 'Mujer'
  }),
)

db.version(4).stores({
  productos: '++id, departamento, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
}).upgrade((tx) =>
  tx.table('productos').toCollection().modify((producto) => {
    const { departamento, categoria } = migrarTaxonomiaProducto(producto)
    producto.departamento = departamento
    producto.categoria = categoria
  }),
)

db.version(5).stores({
  productos: '++id, departamento, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
}).upgrade((tx) =>
  tx.table('productos').toCollection().modify((producto) => {
    if (producto.departamento === 'Niño/Bebé') {
      producto.departamento = 'Niño'
    }
  }),
)

db.version(6).stores({
  productos: '++id, departamento, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
}).upgrade((tx) =>
  tx.table('productos').toCollection().modify((producto) => {
    if (producto.categoria === 'Tenis') {
      producto.categoria = 'Calzado'
    }
  }),
)

db.version(7).stores({
  productos: '++id, departamento, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, items',
  snapshots: '++id, fecha',
})

db.version(8).stores({
  productos: '++id, departamento, categoria, marca, descripcion, talla, precio, existencia',
  ventas: '++id, fecha, total, metodoPago, creditoId, items',
  snapshots: '++id, fecha',
  creditos: '++id, clienteNombre, telefono, limiteCredito, saldoActual, fechaCreacion',
})

export default db
