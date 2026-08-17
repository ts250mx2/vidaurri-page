// Glifo de WhatsApp (lucide no incluye iconos de marca). Trazo simple del
// telefono dentro de la burbuja, suficiente a tamanos chicos.

export function IconWhatsApp({ lado = 20 }: { lado?: number }) {
  return (
    <svg
      aria-hidden
      width={lado}
      height={lado}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.1 4c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.4 3.8 2.1.9 2.6.7 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.3-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.1-.2 0-.4.1-.5l.6-.7c.2-.2.2-.4.1-.6l-.8-1.8c-.1-.4-.3-.7-.6-.7h-.8Z" />
    </svg>
  );
}
