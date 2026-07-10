const ETHIOPIC_ENUM_MAP: Record<string, Record<string, string>> = {
  am: {
    PATRIARCHATE: 'መንበረ ፓትርያርክ',
    ARCHDIOCESE: 'ሊቀ ጳጳሳት',
    DIOCESE: 'ሀገረ ስብከት',
    PARISH: 'ደብር',
  },
  gez: {
    PATRIARCHATE: 'መንበረ ፓትርያርክ',
    ARCHDIOCESE: 'ሊቀ ጳጳሳት',
    DIOCESE: 'ሀገረ ስብከት',
    PARISH: 'ደብር',
  },
};

/**
 * Resolves a single field value based on the requested language and fallback chain.
 * Falls back: gez -> am -> en.
 */
function resolveValue(
  enVal: any,
  amVal: any,
  gezVal: any,
  language: string,
): any {
  const hasValue = (val: any) => val !== undefined && val !== null && val !== '';

  if (language === 'gez') {
    if (hasValue(gezVal)) return gezVal;
    if (hasValue(amVal)) return amVal;
    return hasValue(enVal) ? enVal : null;
  }

  if (language === 'am') {
    if (hasValue(amVal)) return amVal;
    return hasValue(enVal) ? enVal : null;
  }

  // default to 'en'
  return hasValue(enVal) ? enVal : null;
}

/**
 * Traverses the response entity recursively to collapse language-specific
 * fields (*_en, *_am, *_gez) into flat fields based on requested locale,
 * and maps structural enums to Ethiopic equivalents.
 */
export function resolvePolyglotPayload(data: any, language: string): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle array structures
  if (Array.isArray(data)) {
    return data.map((item) => resolvePolyglotPayload(item, language));
  }

  // Handle object structures
  if (typeof data === 'object') {
    // If it's a Date or other non-plain object, return it as-is
    if (data instanceof Date) {
      return data;
    }

    const resolved: any = {};
    const keys = Object.keys(data);
    const translatableBases = new Set<string>();

    // 1. Identify all suffixes to group them by base property name
    for (const key of keys) {
      if (key.endsWith('_en') || key.endsWith('_am') || key.endsWith('_gez')) {
        const base = key.slice(0, -3);
        translatableBases.add(base);
      } else if (
        key.endsWith('En') ||
        key.endsWith('Am') ||
        key.endsWith('Gez')
      ) {
        // CamelCase counterparts from prisma objects
        const base = key.slice(0, -2);
        translatableBases.add(base);
      }
    }

    // 2. Map standard non-translated fields recursively
    for (const key of keys) {
      const isTranslatedKey =
        key.endsWith('_en') ||
        key.endsWith('_am') ||
        key.endsWith('_gez') ||
        key.endsWith('En') ||
        key.endsWith('Am') ||
        key.endsWith('Gez');

      if (!isTranslatedKey) {
        resolved[key] = resolvePolyglotPayload(data[key], language);
      }
    }

    // 3. Resolve the translatable bases into flat keys (e.g. name, title)
    for (const base of translatableBases) {
      // Look up values under both snake_case and camelCase
      const enVal = data[`${base}_en`] ?? data[`${base}En`];
      const amVal = data[`${base}_am`] ?? data[`${base}Am`];
      const gezVal = data[`${base}_gez`] ?? data[`${base}Gez`];

      const resolvedValue = resolveValue(enVal, amVal, gezVal, language);

      // Save to camelCase property or snake_case property based on existing keys pattern,
      // but the prompt says: "collapse those keys into flat, standard names (e.g., parse input row name_am and map it to flat return property name)"
      // So name_en/name_am/name_gez gets flattened to "name", and title_en/title_am/title_gez gets flattened to "title".
      resolved[base] = resolvedValue;
    }

    // 4. Map structural scope enums to Ethiopic if language is non-English
    const enumMap = ETHIOPIC_ENUM_MAP[language];
    if (enumMap) {
      for (const key of Object.keys(resolved)) {
        const val = resolved[key];
        if (typeof val === 'string' && enumMap[val]) {
          resolved[key] = enumMap[val];
        }
      }
    }

    return resolved;
  }

  // Base types
  return data;
}
