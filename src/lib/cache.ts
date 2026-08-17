// Caché en memoria con TTL para catálogos chicos (marcas, tipos, modelos).
// Mismo patrón que aldo.ts en vidaurri-ia: Map con expiración; suficiente para
// una sola instancia. Las búsquedas NO se cachean aquí (varían por filtros).

const almacen = new Map<string, { valor: unknown; expira: number }>();

export async function conCache<T>(
  clave: string,
  ttlMs: number,
  producir: () => Promise<T>
): Promise<T> {
  const hit = almacen.get(clave);
  if (hit && hit.expira > Date.now()) return hit.valor as T;
  const valor = await producir();
  almacen.set(clave, { valor, expira: Date.now() + ttlMs });
  return valor;
}

export const TTL_CATALOGO_MS = 60 * 60 * 1000; // 1 h: lineas/partes/modelos casi no cambian
