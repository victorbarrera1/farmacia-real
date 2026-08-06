import { useRef, useState } from 'react';
import { Database, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { reemplazarCatalogo } from '../../data/repo';
import { aCsv, armarRespaldo, desdeCsv, leerRespaldo, type ResultadoCsv } from '../../lib/csv';
import { sanearSucursales } from '../../lib/dominio';
import { useProductos, useSucursales } from '../../hooks/useDatos';

/* ================================================================
   Carga del catálogo real y respaldos.
   ----------------------------------------------------------------
   El panel es la fuente del dueño, así que necesita dos cosas:

   1. Exportar (CSV para editar en Excel/Sheets, JSON como respaldo fiel).
   2. Importar el CSV corregido o restaurar un respaldo.

   La importación primero muestra qué leyó y qué problemas encontró; el
   catálogo se reemplaza solo cuando el usuario confirma.
   ================================================================ */

function bajar(nombre: string, contenido: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

const fechaArchivo = (): string => new Date().toISOString().slice(0, 10);

export function CatalogoIO() {
  const productos = useProductos();
  const sucursales = useSucursales();
  const inputCsv = useRef<HTMLInputElement>(null);
  const inputJson = useRef<HTMLInputElement>(null);
  const [previo, setPrevio] = useState<ResultadoCsv | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function elegirCsv(archivo: File | undefined) {
    if (!archivo) return;
    setAviso(null);
    setPrevio(desdeCsv(await archivo.text(), sucursales));
  }

  function confirmarCsv() {
    if (!previo?.productos.length) return;
    reemplazarCatalogo(previo.productos);
    setAviso(`Catálogo reemplazado: ${previo.productos.length} productos.`);
    setPrevio(null);
    if (inputCsv.current) inputCsv.current.value = '';
  }

  async function elegirJson(archivo: File | undefined) {
    if (!archivo) return;
    const datos = leerRespaldo(await archivo.text());
    if (!datos) {
      setAviso('Ese archivo no es un respaldo válido de Farmacias Real.');
      return;
    }
    const sucs = sanearSucursales(datos.sucursales);
    reemplazarCatalogo(datos.productos, sucs.length ? sucs : undefined);
    setAviso(`Respaldo restaurado: ${datos.productos.length} productos y ${sucs.length} sucursales.`);
    if (inputJson.current) inputJson.current.value = '';
  }

  return (
    <section className="card p-5">
      <header className="mb-4">
        <h3 className="text-[1rem] font-extrabold">Catálogo real y respaldos</h3>
        <p className="mt-0.5 max-w-[76ch] text-[0.85rem] leading-relaxed text-gris">
          Exporta el catálogo a CSV para trabajarlo en Excel o Google Sheets y vuelve a subirlo cuando esté listo. El
          respaldo JSON guarda productos y sucursales tal cual están (incluido el stock por local): consérvalo antes
          de una carga masiva.
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => bajar(`catalogo-farmacias-real-${fechaArchivo()}.csv`, aCsv(productos, sucursales), 'text/csv;charset=utf-8')}
          className="flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris hover:border-azul hover:text-azul"
        >
          <FileSpreadsheet className="size-4" aria-hidden="true" /> Exportar CSV
        </button>

        <button
          type="button"
          onClick={() =>
            bajar(
              `respaldo-farmacias-real-${fechaArchivo()}.json`,
              JSON.stringify(armarRespaldo(productos, sucursales), null, 2),
              'application/json',
            )
          }
          className="flex h-11 items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris hover:border-azul hover:text-azul"
        >
          <Download className="size-4" aria-hidden="true" /> Descargar respaldo JSON
        </button>

        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-azul px-4 text-[0.88rem] font-bold text-white hover:bg-azul-osc">
          <Upload className="size-4" aria-hidden="true" /> Importar CSV
          <input
            ref={inputCsv}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => { void elegirCsv(e.target.files?.[0]); }}
          />
        </label>

        <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-linea bg-white px-3.5 text-[0.88rem] font-bold text-gris hover:border-azul hover:text-azul">
          <Database className="size-4" aria-hidden="true" /> Restaurar respaldo
          <input
            ref={inputJson}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(e) => { void elegirJson(e.target.files?.[0]); }}
          />
        </label>
      </div>

      <p className="mt-3 text-[0.78rem] leading-relaxed text-gris-2">
        Columnas del CSV: <code>id, nombre, presentacion, laboratorio, principio_activo, categoria, ilustracion,
        precio, bioequivalente, receta, frio, descripcion</code> y una columna de stock por sucursal
        (<code>{sucursales.map((s) => `stock_${s.id}`).join(', ')}</code>). Solo <code>nombre</code> es obligatorio.
      </p>

      {aviso && (
        <p role="status" className="mt-3 rounded-lg border border-ok-pale bg-ok-pale px-3.5 py-2.5 text-[0.88rem] font-bold text-[#0F5A33]">
          {aviso}
        </p>
      )}

      {/* Vista previa antes de reemplazar nada */}
      {previo && (
        <div className="mt-4 rounded-xl border border-azul-borde bg-azul-pale p-4">
          <b className="block text-[0.95rem] font-extrabold text-azul-osc">
            Se leyeron {previo.productos.length} productos
          </b>

          {previo.errores.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-[0.84rem] leading-relaxed text-rojo-osc">
              {previo.errores.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              {previo.errores.length > 8 && <li>…y {previo.errores.length - 8} más.</li>}
            </ul>
          )}

          {previo.avisos.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-[0.84rem] leading-relaxed text-[#6B4A08]">
              {previo.avisos.slice(0, 8).map((a, i) => <li key={i}>{a}</li>)}
              {previo.avisos.length > 8 && <li>…y {previo.avisos.length - 8} más.</li>}
            </ul>
          )}

          <p className="mt-3 text-[0.84rem] leading-relaxed text-azul-osc">
            Al confirmar, el catálogo actual se reemplaza por completo (las sucursales no se tocan). Descarga un
            respaldo antes si quieres poder volver atrás.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmarCsv}
              disabled={!previo.productos.length}
              className="flex h-11 items-center gap-2 rounded-lg bg-azul px-4 text-[0.88rem] font-bold text-white hover:bg-azul-osc disabled:opacity-50"
            >
              Reemplazar catálogo con {previo.productos.length} productos
            </button>
            <button
              type="button"
              onClick={() => { setPrevio(null); if (inputCsv.current) inputCsv.current.value = ''; }}
              className="flex h-11 items-center rounded-lg border border-azul-borde bg-white px-4 text-[0.88rem] font-bold text-azul hover:border-azul"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
