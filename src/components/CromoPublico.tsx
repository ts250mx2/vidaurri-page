import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarraMovil } from "@/components/BarraMovil";
import { ChatVico } from "@/components/ChatVico";
import { DefsMetal } from "@/components/DefsMetal";

// El cromo del sitio público: header, pie, barra móvil y el chat de Vico
// alrededor del contenido. Lo usan el layout del grupo `(sitio)` y el
// `not-found` de la raíz (que vive fuera del grupo y por eso tiene que
// vestirse él mismo). Un solo lugar para que ambos pinten exactamente lo mismo.
export function CromoPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DefsMetal />
      <Header />
      {/* pb en móvil: espacio para la barra fija inferior */}
      <main className="pb-24 md:pb-0">{children}</main>
      <Footer />
      <BarraMovil />
      <ChatVico />
    </>
  );
}
