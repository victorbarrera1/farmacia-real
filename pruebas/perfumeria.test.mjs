import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIAS } from '../src/data/categorias.ts';
import { PRODUCTOS } from '../src/data/productos.ts';
import { SUCURSALES } from '../src/data/sucursales.ts';
import { CATEGORIAS_VALIDAS, ILUSTRACIONES, alinearStock, sanearProducto } from '../src/lib/dominio.ts';
import { aCsv, desdeCsv } from '../src/lib/csv.ts';

describe('Perfumería integrada al dominio', () => {
  it('es una categoría pública y válida', () => {
    assert.ok(CATEGORIAS.some((c) => c.id === 'perfumeria' && c.et === 'Perfumería'));
    assert.ok(CATEGORIAS_VALIDAS.includes('perfumeria'));
    assert.ok(ILUSTRACIONES.includes('perfume'));
  });

  it('incluye ocho productos demo con stock por sucursal', () => {
    const perfumes = PRODUCTOS.filter((p) => p.cat === 'perfumeria');
    assert.equal(perfumes.length, 8);
    for (const p of perfumes) {
      assert.equal(p.st.length, SUCURSALES.length);
      assert.ok(p.p > 0);
      assert.equal(p.rec, undefined);
    }
  });

  it('conserva categoría e ilustración al sanear', () => {
    const p = sanearProducto({
      id: 'perfume-prueba', n: 'Perfume prueba', pres: '50 ml', lab: 'Demo', act: 'Fragancia',
      cat: 'perfumeria', il: 'perfume', p: 9990, st: [1, 2, 3, 4], vis: [true, true, true, true],
      px: [null, null, null, null],
    });
    assert.equal(p?.cat, 'perfumeria');
    assert.equal(p?.il, 'perfume');
  });

  it('sobrevive exportación e importación CSV con st/vis/px alineados', () => {
    const original = alinearStock(PRODUCTOS.filter((p) => p.cat === 'perfumeria'), SUCURSALES.length);
    const resultado = desdeCsv(aCsv(original, SUCURSALES), SUCURSALES);
    assert.deepEqual(resultado.errores, []);
    assert.equal(resultado.productos.length, 8);
    for (const p of resultado.productos) {
      assert.equal(p.cat, 'perfumeria');
      assert.equal(p.st.length, SUCURSALES.length);
      assert.equal(p.vis.length, SUCURSALES.length);
      assert.equal(p.px.length, SUCURSALES.length);
    }
  });
});
