"use client";

import { useEffect, useId, useState } from "react";
import clsx from "clsx";
import { cpTecleado, DOMICILIO_MAX, esCpCompleto, type Domicilio } from "@/lib/domicilio";

// El domicilio del cliente, con el catálogo de Correos de México detrás
// (`/api/cp`). El orden es el de la vida real: primero el código postal, y
// con sus cinco dígitos se prellenan solos estado, municipio y la lista de
// colonias de ESE código postal, que es lo único que hay que elegir. Los
// tres selects van en cascada por si el cliente no se sabe el CP (o el CP no
// está en el catálogo): estado → municipios de ese estado → colonia tecleada
// a mano. Es opcional en las tres pantallas: vacío no se manda nada, y con
// algo tecleado el padre exige que esté completo (`validarDomicilio`).
//
// Las claves del catálogo (estado '19', municipio '039') solo viven aquí para
// encadenar los selects; al pedido viajan los NOMBRES, para que un catálogo
// que cambie no deje ilegible un pedido viejo. Dos juegos de clases (`estilo`)
// porque el mostrador y el kiosco tienen campos de distinto tamaño.

interface Lugar {
  clave: string;
  nombre: string;
}

interface Props {
  valor: Domicilio;
  onChange: (domicilio: Domicilio) => void;
  disabled?: boolean;
  estilo: "mostrador" | "kiosco";
}

const CLASES = {
  mostrador: {
    campo:
      "h-11 w-full rounded-md border border-linea bg-hoja px-3 text-base text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60",
    etiqueta: "rotulo-tecnico text-xs text-tinta-suave",
    nota: "text-xs text-tinta-suave",
  },
  kiosco: {
    campo:
      "h-14 w-full rounded-lg border-2 border-linea bg-hoja px-4 text-lg text-tinta outline-none transition-colors duration-150 placeholder:text-tinta-suave focus:border-tinta disabled:opacity-60 sm:h-16 sm:text-xl",
    etiqueta: "rotulo-tecnico text-sm text-tinta-suave",
    nota: "text-sm text-tinta-suave",
  },
} as const;

/** Valor de la opción del select que abre el campo libre; nunca viaja al pedido. */
const OTRA_COLONIA = "__otra__";
const CP_NO_ENCONTRADO = "Ese código postal no está en el catálogo; elige el estado y el municipio a mano";

async function pedirJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    const datos = (await res.json().catch(() => null)) as (T & { ok?: boolean }) | null;
    return datos?.ok ? datos : null;
  } catch (error) {
    if (signal.aborted) return null;
    console.error("[domicilio] fallo consultando el catálogo de códigos postales", url, error);
    return null;
  }
}

export function FormularioDomicilio({ valor, onChange, disabled = false, estilo }: Props) {
  const id = useId();
  const c = CLASES[estilo];
  const [estados, setEstados] = useState<Lugar[]>([]);
  const [municipios, setMunicipios] = useState<Lugar[]>([]);
  /** Colonias del CP consultado; vacío = la colonia se teclea a mano. */
  const [colonias, setColonias] = useState<string[]>([]);
  /** Clave del estado elegido, para pedir sus municipios. */
  const [claveEstado, setClaveEstado] = useState("");
  /** CP cuya consulta ya llegó (bien o mal); mientras difiere del tecleado, se está buscando. */
  const [cpConsultado, setCpConsultado] = useState("");
  const [avisoCp, setAvisoCp] = useState<string | null>(null);
  /** El cliente prefirió escribir la colonia aunque el CP traiga lista (la suya no viene, o viene con otro nombre). */
  const [coloniaManual, setColoniaManual] = useState(false);

  function cambiar(parte: Partial<Domicilio>) {
    onChange({ ...valor, ...parte });
  }

  // Los estados se piden una vez; la lista es la misma para todos.
  useEffect(() => {
    const control = new AbortController();
    void pedirJson<{ estados: Lugar[] }>("/api/cp/estados", control.signal).then((datos) => {
      if (datos) setEstados(datos.estados);
    });
    return () => control.abort();
  }, []);

  // Los municipios siguen al estado elegido (por el CP o a mano).
  useEffect(() => {
    if (!claveEstado) return;
    const control = new AbortController();
    void pedirJson<{ municipios: Lugar[] }>(`/api/cp/municipios?estado=${claveEstado}`, control.signal).then(
      (datos) => {
        if (datos) setMunicipios(datos.municipios);
      }
    );
    return () => control.abort();
  }, [claveEstado]);

  // Con los cinco dígitos del CP se consulta el catálogo y se prellena todo.
  // El estado se toca dentro de la promesa, no en el efecto; y una respuesta
  // tardía de un CP anterior se descarta con el aborto.
  const cp = valor.cp;
  useEffect(() => {
    if (!esCpCompleto(cp)) return;
    const control = new AbortController();
    void pedirJson<{ estado: Lugar; municipio: Lugar; colonias: string[] }>(`/api/cp?cp=${cp}`, control.signal).then(
      (datos) => {
        if (control.signal.aborted) return;
        setCpConsultado(cp);
        if (!datos) {
          setColonias([]);
          setAvisoCp(CP_NO_ENCONTRADO);
          return;
        }
        setAvisoCp(null);
        setClaveEstado(datos.estado.clave);
        setColonias(datos.colonias);
        onChange({
          ...valor,
          cp,
          estado: datos.estado.nombre,
          municipio: datos.municipio.nombre,
          // Un solo asentamiento en el CP: ya está elegido. Varios: que elija.
          colonia: datos.colonias.length === 1 ? datos.colonias[0] : datos.colonias.includes(valor.colonia) ? valor.colonia : "",
        });
      }
    );
    return () => control.abort();
    // Solo el CP dispara la consulta: el resto del domicilio se lee en el momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cp]);

  function cambiarCp(texto: string) {
    const nuevo = cpTecleado(texto);
    if (nuevo === valor.cp) return;
    // Al cambiar el CP las colonias de antes ya no valen; estado y municipio
    // se conservan hasta que el nuevo CP diga otra cosa.
    setColonias([]);
    setAvisoCp(null);
    setColoniaManual(false);
    cambiar({ cp: nuevo, colonia: "" });
  }

  function cambiarEstado(clave: string) {
    setClaveEstado(clave);
    setMunicipios([]);
    setColonias([]);
    setColoniaManual(false);
    cambiar({ estado: estados.find((e) => e.clave === clave)?.nombre ?? "", municipio: "", colonia: "" });
  }

  function cambiarMunicipio(clave: string) {
    cambiar({ municipio: municipios.find((m) => m.clave === clave)?.nombre ?? "" });
  }

  const claveMunicipio = municipios.find((m) => m.nombre === valor.municipio)?.clave ?? "";
  const claveEstadoActual = estados.find((e) => e.nombre === valor.estado)?.clave ?? claveEstado;
  const buscandoCp = esCpCompleto(valor.cp) && cpConsultado !== valor.cp;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-cp`} className={c.etiqueta}>
            Código postal
          </label>
          <input
            id={`${id}-cp`}
            type="text"
            inputMode="numeric"
            value={valor.cp}
            onChange={(e) => cambiarCp(e.target.value)}
            placeholder="Ej: 64000"
            maxLength={5}
            autoComplete="postal-code"
            disabled={disabled}
            className={clsx(c.campo, "num-tab font-mono")}
          />
          <p className={c.nota}>
            {buscandoCp ? "Buscando el código postal…" : "Con el CP se llenan solos el estado, el municipio y las colonias."}
          </p>
          {avisoCp && (
            <p role="alert" className="text-xs font-semibold text-anotacion">
              {avisoCp}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-calle`} className={c.etiqueta}>
            Calle y número
          </label>
          <input
            id={`${id}-calle`}
            type="text"
            value={valor.calle}
            onChange={(e) => cambiar({ calle: e.target.value })}
            placeholder="Ej: Av. Ruiz Cortines 1234, int. 3"
            maxLength={DOMICILIO_MAX.calle}
            autoComplete="street-address"
            disabled={disabled}
            className={c.campo}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-estado`} className={c.etiqueta}>
            Estado
          </label>
          <select
            id={`${id}-estado`}
            value={claveEstadoActual}
            onChange={(e) => cambiarEstado(e.target.value)}
            disabled={disabled || estados.length === 0}
            className={c.campo}
          >
            <option value="">{estados.length === 0 ? "Cargando…" : "Elige el estado"}</option>
            {estados.map((e) => (
              <option key={e.clave} value={e.clave}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${id}-municipio`} className={c.etiqueta}>
            Municipio
          </label>
          <select
            id={`${id}-municipio`}
            value={claveMunicipio}
            onChange={(e) => cambiarMunicipio(e.target.value)}
            disabled={disabled || !claveEstadoActual}
            className={c.campo}
          >
            <option value="">{claveEstadoActual ? "Elige el municipio" : "Primero el estado"}</option>
            {municipios.map((m) => (
              <option key={m.clave} value={m.clave}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor={`${id}-colonia`} className={c.etiqueta}>
            Colonia
          </label>
          {colonias.length > 0 && !coloniaManual ? (
            <select
              id={`${id}-colonia`}
              value={valor.colonia}
              onChange={(e) => {
                // La última opción abre el campo libre: la colonia no está en la
                // lista de Correos o el cliente la conoce con otro nombre.
                if (e.target.value === OTRA_COLONIA) {
                  setColoniaManual(true);
                  cambiar({ colonia: "" });
                  return;
                }
                cambiar({ colonia: e.target.value });
              }}
              disabled={disabled}
              className={c.campo}
            >
              <option value="">Elige la colonia</option>
              {colonias.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
              <option value={OTRA_COLONIA}>Otra colonia… (escribirla)</option>
            </select>
          ) : (
            <input
              id={`${id}-colonia`}
              type="text"
              value={valor.colonia}
              onChange={(e) => cambiar({ colonia: e.target.value })}
              placeholder={esCpCompleto(valor.cp) ? "Escribe la colonia" : "Teclea el CP para elegirla de la lista"}
              maxLength={DOMICILIO_MAX.colonia}
              autoComplete="address-level3"
              autoFocus={coloniaManual}
              disabled={disabled}
              className={c.campo}
            />
          )}
          {colonias.length > 0 && coloniaManual && (
            <button
              type="button"
              onClick={() => {
                setColoniaManual(false);
                cambiar({ colonia: "" });
              }}
              disabled={disabled}
              className="self-start text-xs font-semibold text-tinta underline underline-offset-4"
            >
              Mejor elegirla de la lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
