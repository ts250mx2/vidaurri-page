import Image from "next/image";
import clsx from "clsx";
import { NEGOCIO } from "@/config/negocio";

// La cara de Vico en el chat: el mismo render 3D de la portada
// (`public/vico-avatar.png`), recortado en círculo para el encabezado del
// hilo y para el lanzador flotante. Es la señal de que quien contesta es el
// asistente y no una persona del mostrador.

export function AvatarChat({ lado = 40, className }: { lado?: number; className?: string }) {
  return (
    <Image
      src="/vico-avatar.png"
      alt={`${NEGOCIO.asistente}, asistente IA de Autopartes Vidaurri`}
      width={lado}
      height={lado}
      sizes={`${lado}px`}
      className={clsx("shrink-0 rounded-full bg-white object-cover object-top", className)}
      style={{ width: lado, height: lado }}
    />
  );
}
