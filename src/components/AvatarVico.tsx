import Image from "next/image";

export function AvatarVico({ alto = 96 }: { alto?: number }) {
  const ancho = Math.round((alto * 3) / 4);

  return (
    <div
      style={{ width: `${ancho}px`, height: `${alto}px` }}
      className="relative shrink-0 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
    >
      <Image
        src="/vico-avatar.png"
        alt="Vico, el asistente 3D de Autopartes Vidaurri"
        width={300}
        height={300}
        className="h-full w-full object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}
