import { createHash } from "node:crypto";

export type CatalogFilterType =
  | "enum"
  | "boolean"
  | "range"
  | "text"
  | "multi_select"
  | "reference";

export type CatalogFilterDefinition = {
  key: string;
  label: string;
  category: string;
  type: CatalogFilterType;
  source: "server_model" | "property_registry" | "commerce";
  unit?: string | null;
  schema_version: number;
  primary: boolean;
  options?: Array<{ value: string; label: string; aliases?: string[] }>;
};

export type CatalogRecord = {
  model: Record<string, any>;
  values: Record<string, unknown>;
  provenance: Record<string, unknown>;
};

export type CatalogQuery = {
  q: string;
  slugs: string[];
  page: number;
  limit: number;
  sort: "relevance" | "name_asc" | "name_desc" | "price_asc" | "price_desc" | "newest";
  filters: Record<string, string[]>;
  ranges: Record<string, { min?: number; max?: number }>;
  texts: Record<string, string>;
};

export const SYSTEM_CATALOG_FILTERS: CatalogFilterDefinition[] = [
  { key: "category", label: "Категория", category: "Каталог", type: "multi_select", source: "commerce", schema_version: 1, primary: false },
  { key: "brand", label: "Бренд", category: "Бренд / модель", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "family", label: "Семейство", category: "Бренд / модель", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "generation", label: "Поколение", category: "Бренд / модель", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "form_factor", label: "Форм-фактор", category: "Корпус", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "chassis_type", label: "Корзина / шасси", category: "Корпус", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "cpu_socket", label: "Сокет", category: "CPU", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "max_cpu", label: "Количество CPU", category: "CPU", type: "range", source: "server_model", schema_version: 1, primary: true },
  { key: "supported_ram_types", label: "Тип RAM", category: "RAM", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "ram_slots_total", label: "Количество DIMM", category: "RAM", type: "range", source: "server_model", schema_version: 1, primary: false },
  { key: "supported_drive_interfaces", label: "Интерфейс дисков", category: "Storage", type: "multi_select", source: "server_model", schema_version: 1, primary: true },
  { key: "drive_bays_total", label: "Количество отсеков", category: "Storage", type: "range", source: "server_model", schema_version: 1, primary: true },
  { key: "price", label: "Цена", category: "Коммерческие", type: "range", source: "commerce", unit: "USD", schema_version: 1, primary: false },
  { key: "availability", label: "Наличие", category: "Коммерческие", type: "enum", source: "commerce", schema_version: 1, primary: false, options: [
    { value: "in_stock", label: "В наличии" },
    { value: "available", label: "Доступно без учёта остатков" },
    { value: "backorder", label: "Под заказ" },
    { value: "out_of_stock", label: "Нет в наличии" },
  ] },
  { key: "condition", label: "Состояние", category: "Коммерческие", type: "enum", source: "commerce", schema_version: 1, primary: false },
];

const propertyType: Record<string, CatalogFilterType> = {
  enum: "enum",
  reference: "reference",
  list: "multi_select",
  number: "range",
  boolean: "boolean",
  text: "text",
  object: "text",
};

function list(value: unknown): unknown[] {
  if (value === undefined || value === null || value === "") return [];
  return Array.isArray(value) ? value.flatMap(list) : [value];
}

function strings(value: unknown) {
  return list(value).map(String).filter(Boolean);
}

function optionList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as any)?.values)
      ? (value as any).values
      : [];
  return source.map((item: any) =>
    typeof item === "object"
      ? { value: String(item.value ?? item.key), label: String(item.label ?? item.value ?? item.key) }
      : { value: String(item), label: String(item) },
  );
}

export function propertyCatalogDefinitions(
  definitions: any[],
  concepts: any[] = [],
  aliases: any[] = [],
): CatalogFilterDefinition[] {
  const conceptMap = new Map(concepts.map((concept) => [concept.id, concept]));
  const aliasesByConcept = new Map<string, string[]>();
  for (const alias of aliases) {
    const values = aliasesByConcept.get(alias.technology_concept_id) || [];
    values.push(alias.alias);
    aliasesByConcept.set(alias.technology_concept_id, values);
  }
  return definitions
    .filter(
      (definition) =>
        definition.filterable === true &&
        definition.lifecycle_status === "active" &&
        definition.usage_status !== "deprecated",
    )
    .map((definition) => {
      const allowed = optionList(definition.allowed_values_json);
      const referenced = allowed.map((option) => {
        const concept = conceptMap.get(option.value);
        return concept
          ? {
              value: option.value,
              label: concept.display_name,
              aliases: aliasesByConcept.get(option.value) || [],
            }
          : option;
      });
      return {
        key: `attr.${definition.key}`,
        label: definition.label,
        category: "Дополнительные характеристики",
        type: propertyType[definition.value_type] || "text",
        source: "property_registry" as const,
        unit: definition.unit,
        schema_version: Number(definition.schema_version || 1),
        primary: false,
        options: referenced,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function catalogSchemaVersion(definitions: CatalogFilterDefinition[]) {
  const value = definitions.map((definition) => ({
    key: definition.key,
    type: definition.type,
    schema_version: definition.schema_version,
    options: definition.options,
  }));
  return `catalog-${createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12)}`;
}

export function buildCatalogRecord(input: {
  model: Record<string, any>;
  effective_properties?: Array<{ key: string; value: unknown; source_scope?: string; source_id?: string; definition?: any }>;
  commerce?: {
    categories?: string[];
    price?: number | null;
    availability?: string | null;
    condition?: string | null;
  };
}): CatalogRecord {
  const { model, commerce = {} } = input;
  const values: Record<string, unknown> = {
    category: commerce.categories || [],
    brand: model.brand,
    family: model.family,
    generation: model.generation,
    form_factor: model.form_factor,
    chassis_type: model.chassis_type,
    cpu_socket: model.cpu_socket,
    max_cpu: model.max_cpu,
    supported_ram_types: model.supported_ram_types || [],
    ram_slots_total: model.ram_slots_total,
    supported_drive_interfaces: model.supported_drive_interfaces || [],
    drive_bays_total: Number(model.drive_bays_front || 0) + Number(model.drive_bays_rear || 0),
    price: commerce.price,
    availability: commerce.availability,
    condition: commerce.condition,
  };
  const provenance: Record<string, unknown> = {};
  for (const property of input.effective_properties || []) {
    values[`attr.${property.key}`] = normalizePropertyValue(property.value, property.definition);
    provenance[`attr.${property.key}`] = {
      scope: property.source_scope,
      source_id: property.source_id,
    };
  }
  return {
    model: {
      ...model,
      catalog_price: commerce.price ?? null,
      catalog_availability: commerce.availability ?? null,
      catalog_condition: commerce.condition ?? null,
    },
    values,
    provenance,
  };
}

const unitFactors: Record<string, number> = {
  "mhz:ghz": 0.001,
  "ghz:mhz": 1000,
  "mb:gb": 0.001,
  "gb:mb": 1000,
  "gb:tb": 0.001,
  "tb:gb": 1000,
  "mm:cm": 0.1,
  "cm:mm": 10,
}

export function normalizePropertyValue(value: unknown, definition?: any) {
  if (Array.isArray(value)) return value.map((item) => normalizePropertyValue(item, definition))
  const object = value && typeof value === "object" ? value as Record<string, unknown> : undefined
  const raw = object
    ? object.normalized_value ?? object.value ?? object.id ?? object.key ?? value
    : value
  if (definition?.value_type !== "number") return raw
  const parsed = number(raw)
  if (parsed === undefined) return raw
  const rule = definition.normalization_rule_json || {}
  const sourceUnit = String(object?.unit || rule.source_unit || definition.unit || "").toLocaleLowerCase()
  const targetUnit = String(rule.target_unit || definition.unit || "").toLocaleLowerCase()
  const conversion = rule.conversions?.[sourceUnit]
  const factor = Number(
    conversion?.factor ??
    conversion ??
    rule.factor ??
    rule.multiplier ??
    unitFactors[`${sourceUnit}:${targetUnit}`] ??
    1,
  )
  const offset = Number(conversion?.offset ?? rule.offset ?? 0)
  return parsed * (Number.isFinite(factor) ? factor : 1) + (Number.isFinite(offset) ? offset : 0)
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function definitionValues(record: CatalogRecord, key: string) {
  return strings(record.values[key]);
}

function matchesFilter(record: CatalogRecord, query: CatalogQuery, excludedKey?: string) {
  if (query.slugs.length && !query.slugs.includes(String(record.model.slug))) return false;
  const q = query.q.toLocaleLowerCase();
  if (
    q &&
    ![
      record.model.public_name,
      record.model.brand,
      record.model.family,
      record.model.generation,
      record.model.model,
      record.model.slug,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(q))
  ) return false;
  for (const [key, selected] of Object.entries(query.filters)) {
    if (key === excludedKey || !selected.length) continue;
    const options = definitionValues(record, key).map((value) => value.toLocaleLowerCase());
    if (!selected.some((value) => options.includes(value.toLocaleLowerCase()))) return false;
  }
  for (const [key, range] of Object.entries(query.ranges)) {
    if (key === excludedKey) continue;
    const value = number(record.values[key]);
    if (value === undefined) return false;
    if (range.min !== undefined && value < range.min) return false;
    if (range.max !== undefined && value > range.max) return false;
  }
  for (const [key, text] of Object.entries(query.texts)) {
    if (key === excludedKey) continue;
    const values = definitionValues(record, key).join(" ").toLocaleLowerCase();
    if (!values.includes(text.toLocaleLowerCase())) return false;
  }
  return true;
}

function relevance(record: CatalogRecord, q: string) {
  if (!q) return 0;
  const needle = q.toLocaleLowerCase();
  const fields = [record.model.public_name, record.model.model, record.model.family, record.model.brand, record.model.slug]
    .map((value) => String(value || "").toLocaleLowerCase());
  return fields.reduce((score, value, index) =>
    score + (value === needle ? 100 - index : value.startsWith(needle) ? 50 - index : value.includes(needle) ? 10 - index : 0), 0);
}

function compareRecords(left: CatalogRecord, right: CatalogRecord, query: CatalogQuery) {
  const tie = String(left.model.slug).localeCompare(String(right.model.slug));
  if (query.sort === "name_asc") return String(left.model.public_name).localeCompare(String(right.model.public_name)) || tie;
  if (query.sort === "name_desc") return String(right.model.public_name).localeCompare(String(left.model.public_name)) || tie;
  if (query.sort === "price_asc") return (number(left.values.price) ?? Number.MAX_SAFE_INTEGER) - (number(right.values.price) ?? Number.MAX_SAFE_INTEGER) || tie;
  if (query.sort === "price_desc") return (number(right.values.price) ?? -1) - (number(left.values.price) ?? -1) || tie;
  if (query.sort === "newest") return new Date(right.model.created_at || 0).getTime() - new Date(left.model.created_at || 0).getTime() || tie;
  return relevance(right, query.q) - relevance(left, query.q) || String(left.model.public_name).localeCompare(String(right.model.public_name)) || tie;
}

function labelFor(definition: CatalogFilterDefinition, value: string) {
  return definition.options?.find(
    (option) => option.value === value || option.aliases?.includes(value),
  )?.label || value;
}

export function executeCatalogQuery(input: {
  records: CatalogRecord[];
  definitions: CatalogFilterDefinition[];
  query: CatalogQuery;
  duration_ms?: number;
  query_count?: number;
}) {
  const started = performance.now();
  const { records, definitions, query } = input;
  const filtered = records.filter((record) => matchesFilter(record, query));
  const sorted = [...filtered].sort((left, right) => compareRecords(left, right, query));
  const offset = (query.page - 1) * query.limit;
  const items = sorted.slice(offset, offset + query.limit).map((record) => record.model);
  const facets = definitions.map((definition) => {
    const candidates = records.filter((record) => matchesFilter(record, query, definition.key));
    if (definition.type === "range") {
      const values = candidates.map((record) => number(record.values[definition.key])).filter((value): value is number => value !== undefined);
      return {
        key: definition.key,
        type: definition.type,
        values: [],
        range: values.length ? { min: Math.min(...values), max: Math.max(...values), count: values.length, unit: definition.unit || null } : null,
      };
    }
    if (definition.type === "text") return { key: definition.key, type: definition.type, values: [], range: null };
    const counts = new Map<string, number>();
    for (const candidate of candidates)
      for (const value of new Set(definitionValues(candidate, definition.key)))
        counts.set(value, (counts.get(value) || 0) + 1);
    return {
      key: definition.key,
      type: definition.type,
      values: [...counts.entries()]
        .map(([value, count]) => ({ value, label: labelFor(definition, value), count }))
        .sort((left, right) => left.label.localeCompare(right.label)),
      range: null,
    };
  });
  const activeFilters = {
    ...query.filters,
    ...Object.fromEntries(Object.entries(query.ranges).map(([key, value]) => [key, value])),
    ...query.texts,
  };
  return {
    items,
    total: filtered.length,
    pagination: {
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(filtered.length / query.limit),
      has_previous: query.page > 1,
      has_next: offset + query.limit < filtered.length,
    },
    facets,
    filter_schema: {
      version: catalogSchemaVersion(definitions),
      definitions,
    },
    active_filters: activeFilters,
    applied_sort: query.sort,
    query_metadata: {
      duration_ms: Number((input.duration_ms ?? performance.now() - started).toFixed(3)),
      assembly_ms: Number((performance.now() - started).toFixed(3)),
      scanned_count: records.length,
      returned_count: items.length,
      query_count: input.query_count ?? 0,
      deterministic_tiebreaker: "slug",
      cache_policy: "public, max-age=30, stale-while-revalidate=120",
    },
  };
}

const aliases: Record<string, string> = {
  chassis: "chassis_type",
  socket: "cpu_socket",
  ram: "supported_ram_types",
  storage: "supported_drive_interfaces",
  cpu_generation: "attr.cpu_generation",
};

function scalar(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function selections(value: unknown) {
  return list(value)
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCatalogQuery(
  raw: Record<string, unknown>,
  definitions: CatalogFilterDefinition[],
): { query?: CatalogQuery; errors: string[] } {
  const errors: string[] = [];
  const page = Number(scalar(raw.page) || 1);
  const limit = Number(scalar(raw.limit) || 12);
  const sort = String(scalar(raw.sort) || "relevance") as CatalogQuery["sort"];
  const sorts = new Set(["relevance", "name_asc", "name_desc", "price_asc", "price_desc", "newest"]);
  if (!Number.isInteger(page) || page < 1 || page > 100000) errors.push("page must be an integer between 1 and 100000");
  if (!Number.isInteger(limit) || limit < 1 || limit > 48) errors.push("limit must be an integer between 1 and 48");
  if (!sorts.has(sort)) errors.push(`unsupported sort ${sort}`);
  const definitionMap = new Map(definitions.map((definition) => [definition.key, definition]));
  const filters: Record<string, string[]> = {};
  const ranges: Record<string, { min?: number; max?: number }> = {};
  const texts: Record<string, string> = {};
  const control = new Set(["q", "search", "page", "limit", "sort", "slugs"]);
  for (const [rawKey, value] of Object.entries(raw)) {
    if (control.has(rawKey) || value === undefined || value === "") continue;
    let key = aliases[rawKey] || rawKey;
    let bound: "min" | "max" | undefined;
    if (key === "bays_min" || key === "bays_max") {
      bound = key.endsWith("min") ? "min" : "max";
      key = "drive_bays_total";
    } else if (key === "price_min" || key === "price_max") {
      bound = key.endsWith("min") ? "min" : "max";
      key = "price";
    } else if (key.endsWith(".min") || key.endsWith(".max")) {
      bound = key.endsWith(".min") ? "min" : "max";
      key = key.slice(0, -4);
    }
    const definition = definitionMap.get(key);
    if (!definition) {
      errors.push(`unsupported filter ${rawKey}`);
      continue;
    }
    if (definition.type === "range" || bound) {
      const parsed = Number(scalar(value));
      if (!Number.isFinite(parsed)) errors.push(`${rawKey} must be numeric`);
      else ranges[key] = { ...(ranges[key] || {}), [bound || "min"]: parsed };
    } else if (definition.type === "text") {
      const text = String(scalar(value)).trim();
      if (text.length > 120) errors.push(`${rawKey} must be at most 120 characters`);
      else texts[key] = text;
    } else if (definition.type === "boolean") {
      const values = selections(value);
      if (values.some((item) => !["true", "false"].includes(item))) errors.push(`${rawKey} must be true or false`);
      else filters[key] = values;
    } else {
      const selected = selections(value);
      if (definition.options?.length) {
        const normalized: string[] = [];
        for (const item of selected) {
          const needle = item.toLocaleLowerCase();
          const option = definition.options.find((candidate) =>
            [candidate.value, candidate.label, ...(candidate.aliases || [])]
              .some((candidateValue) => candidateValue.toLocaleLowerCase() === needle));
          if (!option) errors.push(`${rawKey} contains unsupported value ${item}`);
          else normalized.push(option.value);
        }
        filters[key] = normalized;
      } else filters[key] = selected;
    }
  }
  const q = String(scalar(raw.q ?? raw.search) || "").trim();
  const slugs = selections(raw.slugs).slice(0, 48);
  if (q.length > 120) errors.push("q must be at most 120 characters");
  if (selections(raw.slugs).length > 48) errors.push("slugs accepts at most 48 values");
  if (slugs.some((slug) => !/^[a-z0-9][a-z0-9-]{0,119}$/i.test(slug))) errors.push("slugs contains an invalid slug");
  for (const [key, range] of Object.entries(ranges))
    if (range.min !== undefined && range.max !== undefined && range.min > range.max)
      errors.push(`${key} minimum cannot exceed maximum`);
  return errors.length
    ? { errors }
    : { query: { q, slugs, page, limit, sort, filters, ranges, texts }, errors };
}

export function validateCatalogPropertyIndex(definitions: any[], assignments: any[]) {
  const active = definitions.filter((definition) => definition.filterable && definition.lifecycle_status === "active");
  const definitionIds = new Set(definitions.map((definition) => definition.id));
  const counts = new Map<string, number>();
  const orphan_assignment_ids: string[] = [];
  for (const assignment of assignments) {
    if (!definitionIds.has(assignment.property_definition_id)) orphan_assignment_ids.push(assignment.id);
    counts.set(assignment.property_definition_id, (counts.get(assignment.property_definition_id) || 0) + 1);
  }
  return {
    valid: orphan_assignment_ids.length === 0,
    schema_version: catalogSchemaVersion([
      ...SYSTEM_CATALOG_FILTERS,
      ...propertyCatalogDefinitions(active),
    ]),
    filterable_definition_count: active.length,
    requires_backfill: active.filter((definition) => !counts.get(definition.id)).map((definition) => definition.key),
    orphan_assignment_ids,
  };
}
