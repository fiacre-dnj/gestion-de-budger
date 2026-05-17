/** Normalise les arguments renvoyés par le LLM (null, chaîne vide, clés null). */
export function normalizeToolArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw?.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, value]) => value !== null && value !== undefined,
      ),
    );
  } catch {
    return {};
  }
}

export function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requireString(value: unknown, fieldName: string): string {
  const s = optionalString(value);
  if (!s) {
    throw new Error(`Paramètre "${fieldName}" requis.`);
  }
  return s;
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function requireNumber(value: unknown, fieldName: string): number {
  const n = optionalNumber(value);
  if (n === undefined) {
    throw new Error(`Paramètre "${fieldName}" requis (nombre).`);
  }
  return n;
}
