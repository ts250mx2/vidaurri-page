"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useArea } from "@/components/kiosco/AreaContext";

// Aviso persistente mientras la contraseña siga siendo el celular: se lee en
// cada pantalla del área, no bloquea nada y se apaga solo cuando el cliente
// la cambia (la cookie se refirma con `passwordPorDefecto: false`). En la
// propia pantalla de cambio no se repite: ya está ahí. Sin ámbar: es un
// recordatorio, no la acción de la pantalla.

export function AvisoPassword() {
  const pathname = usePathname();
  const area = useArea();
  if (!area.rutas.password || pathname === area.rutas.password) return null;

  return (
    <div role="status" className="shrink-0 border-b border-linea bg-hoja">
      <p className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-4 py-2 text-sm text-tinta sm:px-6">
        <KeyRound aria-hidden className="size-4 shrink-0 text-tinta-suave" />
        <span>
          Tu contraseña sigue siendo tu celular:{" "}
          <Link
            href={area.rutas.password}
            prefetch={false}
            className="font-semibold underline decoration-linea-fuerte decoration-2 underline-offset-2 transition-colors duration-150 hover:decoration-tinta"
          >
            cámbiala
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
