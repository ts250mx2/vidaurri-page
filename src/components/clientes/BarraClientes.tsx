"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LogOut, PackagePlus, ReceiptText } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useArea } from "@/components/kiosco/AreaContext";
import { llamarArea } from "@/lib/kiosco/navegador";

// La barra del cliente que ya entró: "Hola, NOMBRE" y Salir a la derecha, y
// las tres puertas del área —Armar pedido, Mis pedidos, Contraseña— que en
// el celular bajan a un segundo renglón de pestañas a lo ancho y en pantalla
// grande se quedan en línea. Nada de ámbar aquí: el ámbar de cada pantalla
// es del botón que avanza (Entrar, Continuar, Enviar), y un acento en la
// barra se lo robaría.
//
// Es una isla porque necesita la ruta (para marcar la pestaña actual) y
// porque Salir llama al servidor. Sin nombre (la pantalla de entrar) no pinta
// nada: ahí el cromo es solo la marca.

// `whitespace-nowrap!` con importancia a propósito: `.rotulo-tecnico` pone
// `text-wrap: balance` fuera de capa y le gana a la utilidad normal, y una
// pestaña partida en dos renglones es lo que se quiere evitar. En el celular
// el icono va arriba y la etiqueta abajo (patrón de barra de pestañas); desde
// `sm` van en línea.
const CLASE_PESTANA =
  "rotulo-tecnico flex h-12 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap! rounded-md px-1.5 text-[10.5px] text-white/75 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:h-9 sm:flex-none sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-xs";

export function BarraClientes({ nombre }: { nombre: string | null }) {
  const pathname = usePathname();
  const area = useArea();
  const [saliendo, setSaliendo] = useState(false);

  if (!nombre) return null;

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    const respuesta = await llamarArea(area, "/salir", { metodo: "POST", cuerpo: {} });
    if (respuesta.status !== 200) console.error("[clientes] no se pudo cerrar la sesión", respuesta.status);
    // Navegación completa: el guardia de borde relee la cookie (ya borrada) y
    // deja al cliente en la pantalla de entrar.
    window.location.assign(area.rutas.entrar);
  }

  // En el celular las etiquetas se acortan ("Pedido") para que las tres
  // pestañas quepan en un renglón sin partirse.
  const pestanas = [
    { href: area.rutas.armar, texto: "Armar pedido", corto: "Pedido", Icono: PackagePlus, actual: pathname === area.rutas.armar || pathname === area.rutas.datos || pathname === area.rutas.listo },
    { href: area.rutas.misPedidos, texto: "Mis pedidos", corto: "Mis pedidos", Icono: ReceiptText, actual: pathname === area.rutas.misPedidos },
    { href: area.rutas.password ?? area.rutas.armar, texto: "Contraseña", corto: "Contraseña", Icono: KeyRound, actual: pathname === area.rutas.password },
  ];

  return (
    <>
      <div className="ml-auto flex min-w-0 items-center gap-1">
        <p className="mr-1 max-w-[7.5rem] truncate text-sm text-white sm:max-w-56" title={`Hola, ${nombre}`}>
          Hola, <span className="font-semibold">{nombre}</span>
        </p>
        <button
          type="button"
          onClick={() => void salir()}
          disabled={saliendo}
          aria-label="Salir"
          title="Salir"
          className={twMerge(CLASE_PESTANA, "h-10 flex-none flex-row px-2 sm:h-9 disabled:opacity-60")}
        >
          <LogOut aria-hidden className="size-4" />
          <span className="hidden sm:inline">{saliendo ? "Saliendo…" : "Salir"}</span>
        </button>
      </div>

      <nav
        aria-label="Área de clientes"
        className="order-last -mx-1 flex w-full items-stretch gap-1 border-t border-white/10 pt-1.5 sm:order-none sm:mx-0 sm:w-auto sm:border-0 sm:pt-0"
      >
        {pestanas.map(({ href, texto, corto, Icono, actual }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            aria-current={actual ? "page" : undefined}
            className={twMerge(CLASE_PESTANA, actual && "bg-white/15 text-white")}
          >
            <Icono aria-hidden className="size-4 shrink-0" />
            <span className="sm:hidden">{corto}</span>
            <span className="hidden sm:inline">{texto}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
