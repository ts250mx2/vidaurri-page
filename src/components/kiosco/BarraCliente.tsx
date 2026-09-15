"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ReceiptText, UserRound } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { cerrarTurno } from "@/lib/kiosco/navegador";
import {
  esRutaKioscoAbierta,
  RUTA_KIOSCO,
  RUTA_KIOSCO_ENTRAR,
  RUTA_KIOSCO_MIS_PEDIDOS,
} from "@/lib/kiosco/rutas";

// La esquina del cliente en la barra del kiosco. Sin sesión de cliente, un
// solo enlace discreto: "¿Eres cliente? Entra con tu celular". Con sesión,
// "Hola, NOMBRE", "Mis pedidos" y "Salir". Nada de ámbar aquí: el ámbar de
// cada pantalla es del botón que avanza (Entrar, Continuar, Enviar), y un
// acento en la barra se lo robaría.
//
// Es una isla porque necesita la ruta (en activar y salir, pantallas del
// personal, no se pinta; en entrar no se ofrece entrar) y porque Salir llama
// al servidor. El nombre llega del layout, que ya leyó la cookie.

const CLASE_ENLACE =
  "rotulo-tecnico inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-xs text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white";

export function BarraCliente({ nombre }: { nombre: string | null }) {
  const pathname = usePathname();
  const [saliendo, setSaliendo] = useState(false);

  if (esRutaKioscoAbierta(pathname)) return null;

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    await cerrarTurno("salir");
    // Navegación completa: el layout relee la cookie y la barra vuelve a la
    // del público general, sin rastro del nombre.
    window.location.assign(RUTA_KIOSCO);
  }

  if (!nombre) {
    if (pathname === RUTA_KIOSCO_ENTRAR) return null;
    return (
      <Link href={RUTA_KIOSCO_ENTRAR} prefetch={false} className={CLASE_ENLACE}>
        <UserRound aria-hidden className="size-4" />
        ¿Eres cliente? Entra con tu celular
      </Link>
    );
  }

  const enMisPedidos = pathname === RUTA_KIOSCO_MIS_PEDIDOS;
  return (
    <div className="flex items-center gap-1">
      <p className="mr-1 max-w-48 truncate text-sm text-white" title={`Hola, ${nombre}`}>
        Hola, <span className="font-semibold">{nombre}</span>
      </p>
      <Link
        href={RUTA_KIOSCO_MIS_PEDIDOS}
        prefetch={false}
        aria-current={enMisPedidos ? "page" : undefined}
        className={twMerge(CLASE_ENLACE, enMisPedidos && "bg-white/15 text-white")}
      >
        <ReceiptText aria-hidden className="size-4" />
        Mis pedidos
      </Link>
      <button
        type="button"
        onClick={() => void salir()}
        disabled={saliendo}
        className={twMerge(CLASE_ENLACE, "disabled:opacity-60")}
      >
        <LogOut aria-hidden className="size-4" />
        {saliendo ? "Saliendo…" : "Salir"}
      </button>
    </div>
  );
}
