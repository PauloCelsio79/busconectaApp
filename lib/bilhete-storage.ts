import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PassageiroBilhete } from '@/lib/mappers/reserva';

const KEY = 'bilhete_passageiros_v1';

type Cache = Record<string, PassageiroBilhete[]>;

async function readCache(): Promise<Cache> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

async function writeCache(cache: Cache): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(cache));
}

/** Guarda os passageiros adicionados no fluxo de reserva (por id ou código do bilhete). */
export async function guardarPassageirosBilhete(
  chaves: string[],
  passageiros: PassageiroBilhete[]
): Promise<void> {
  if (passageiros.length === 0 || chaves.length === 0) return;
  const cache = await readCache();
  for (const chave of chaves) {
    if (chave.trim()) cache[chave.trim()] = passageiros;
  }
  await writeCache(cache);
}

export async function obterPassageirosBilhete(
  chave: string
): Promise<PassageiroBilhete[] | null> {
  if (!chave.trim()) return null;
  const cache = await readCache();
  return cache[chave.trim()] ?? null;
}

/** Preferência: nomes vindos da API; senão cache local da compra. */
export async function enriquecerPassageirosBilhete(
  reservaId: string,
  codigo: string | undefined,
  daApi: PassageiroBilhete[]
): Promise<PassageiroBilhete[]> {
  if (daApi.length > 0) return daApi;
  const porId = await obterPassageirosBilhete(reservaId);
  if (porId?.length) return porId;
  if (codigo) {
    const porCodigo = await obterPassageirosBilhete(codigo);
    if (porCodigo?.length) return porCodigo;
  }
  return [];
}
