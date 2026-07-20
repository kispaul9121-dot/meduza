import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";
import { adminGet, adminPost } from "../_shared/api";

const samples: Record<string, any[]> = {
  hpe: [
    {
      source_id: "hpe-flexlom-57414",
      term: "FlexibleLOM",
      vendor: "HPE",
      model: "Ethernet 10/25Gb 2-port 57414",
      part_number: "817753-B21",
      reusable: true,
      attributes: { ports: 2, speed_gbps: 25, unknown_profile: "OCP-like" },
      confidence: 0.93,
      source: { reference: "HPE QuickSpecs sample" },
      commercial: { sku: "PROTECTED-SKU", price: 100 },
    },
    {
      source_id: "hpe-smart-array-p408i",
      term: "Smart Array",
      vendor: "HPE",
      model: "P408i-a SR Gen10",
      part_number: "804331-B21",
      attributes: { ports: 8, controller_generation: "SR Gen10" },
      confidence: 0.97,
      source: { reference: "HPE controller sample" },
    },
  ],
  dell: [
    {
      source_id: "dell-ndc-x710",
      term: "NDC",
      vendor: "Dell",
      model: "Intel X710 Quad Port",
      part_number: "540-BBVL",
      reusable: true,
      attributes: { ports: 4, speed_gbps: 10 },
      confidence: 0.96,
      source: { reference: "Dell technical guide sample" },
    },
    {
      source_id: "dell-perc-h755",
      term: "PERC",
      vendor: "Dell",
      model: "PERC H755",
      attributes: { controller_generation: "PERC 11", cache_gb: 8 },
      confidence: 0.95,
      source: { reference: "Dell PERC sample" },
    },
  ],
};

type Batch = {
  id: string;
  adapter_key: string;
  file_name?: string;
  status: string;
  review_status: string;
  counts_json: Record<string, number>;
  rollback_reference?: string;
};
type Row = {
  id: string;
  source_identity: string;
  object_class: string;
  classification_confirmed?: string;
  action: string;
  review_status: string;
  apply_status: string;
  confidence?: number;
  raw_payload_json: any;
  normalized_payload_json: any;
  diff_json: any;
  warnings_json: any[];
  errors_json: any[];
};

const code = (value: unknown) => JSON.stringify(value, null, 2);

const ImportPipelinePage = () => {
  const [params] = useSearchParams();
  const [vendor, setVendor] = useState("hpe");
  const [fileName, setFileName] = useState("hpe-technical-sample.json");
  const [source, setSource] = useState(code(samples.hpe));
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [permission, setPermission] = useState<any>(null);
  const [dryRun, setDryRun] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const approvedGroups = useMemo(
    () => [...new Set(rows.filter((row) => selected[row.id]).map((row) => row.classification_confirmed || row.object_class))],
    [rows, selected],
  );

  const refreshList = async () => {
    const result = await adminGet<{ batches: Batch[] }>("/admin/server-configurator/import-pipeline/batches");
    setBatches(result.batches);
  };
  const loadBatch = async (id: string) => {
    const result = await adminGet<{ batch: Batch; records: Row[]; permission: any }>(`/admin/server-configurator/import-pipeline/batches/${id}`);
    setBatch(result.batch);
    setRows(result.records);
    setPermission(result.permission);
    setSelected(Object.fromEntries(result.records.filter((row) => row.review_status !== "rejected" && row.action !== "block").map((row) => [row.id, true])));
  };
  useEffect(() => {
    refreshList().catch((error) => toast.error(error.message));
    const requestedBatch = params.get("batch");
    if (requestedBatch)
      loadBatch(requestedBatch).catch((error) => toast.error(error.message));
  }, []);

  const chooseVendor = (next: string) => {
    setVendor(next);
    setFileName(`${next}-technical-sample.json`);
    setSource(code(samples[next]));
  };
  const execute = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); }
    catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(false); }
  };
  const extract = () => execute(async () => {
    const records = JSON.parse(source);
    if (!Array.isArray(records)) throw new Error("Technical source must contain a JSON array of records.");
    const result = await adminPost<{ batch: Batch; records: Row[]; reused: boolean }>("/admin/server-configurator/import-pipeline/batches", {
      source_type: "json", adapter_key: vendor, file_name: fileName, source_schema_version: 1, records, previous_source_identities: [],
    });
    setBatch(result.batch); setRows(result.records);
    setSelected(Object.fromEntries(result.records.filter((row) => row.action !== "block").map((row) => [row.id, true])));
    toast.success(result.reused ? "Existing batch reused by content hash." : "Raw source extracted and normalized.");
    await refreshList();
    await loadBatch(result.batch.id);
  });
  const review = () => batch && execute(async () => {
    await adminPost(`/admin/server-configurator/import-pipeline/batches/${batch.id}/review`, {
      review_status: "approved",
      rows: rows.map((row) => ({ id: row.id, review_status: selected[row.id] ? "approved" : "rejected", classification_confirmed: row.classification_confirmed || row.object_class })),
    });
    await loadBatch(batch.id); toast.success("Explicit review saved.");
  });
  const preview = () => batch && execute(async () => {
    const result = await adminPost<any>(`/admin/server-configurator/import-pipeline/batches/${batch.id}/dry-run`, { approved_groups: approvedGroups });
    setDryRun(result.result); setPermission(result.permission); setBatch(result.batch);
    toast.success("Dry-run completed without domain writes.");
  });
  const apply = () => batch && execute(async () => {
    const key = `${batch.id}:${batch.adapter_key}:v1`;
    const result = await adminPost<any>(`/admin/server-configurator/import-pipeline/batches/${batch.id}/apply`, {
      idempotency_key: key, approved_groups: approvedGroups, confirmation: "APPLY_REVIEWED_TECHNICAL_IMPORT",
    });
    toast.success(result.result.idempotent_replay ? "Idempotent result reused." : "Draft technical data applied.");
    await loadBatch(batch.id); await refreshList();
  });
  const rollback = () => batch && execute(async () => {
    await adminPost(`/admin/server-configurator/import-pipeline/batches/${batch.id}/rollback`, { confirmation: "ROLLBACK_TECHNICAL_IMPORT" });
    toast.success("Technical writes rolled back."); await loadBatch(batch.id); await refreshList();
  });

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading>Technical Import Pipeline</Heading>
        <Text className="text-ui-fg-subtle">Vendor adapters → raw → staging → normalized → review → transactional draft apply. Products, SKU, price and inventory stay in Medusa commercial import.</Text>
      </div>
      <Container className="flex flex-col gap-y-4">
        <div className="flex items-center gap-x-3">
          <Select value={vendor} onValueChange={chooseVendor}>
            <Select.Trigger className="w-48"><Select.Value /></Select.Trigger>
            <Select.Content><Select.Item value="hpe">HPE sample</Select.Item><Select.Item value="dell">Dell sample</Select.Item><Select.Item value="supermicro">Supermicro adapter</Select.Item></Select.Content>
          </Select>
          <Input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="Source file name" />
          <Button onClick={extract} isLoading={busy}>Extract & normalize</Button>
        </div>
        <Textarea value={source} onChange={(event) => setSource(event.target.value)} rows={10} aria-label="Structured technical source" />
        <Text size="small" className="text-ui-fg-subtle">Structured technical data only. Unknown attributes are preserved as reviewable draft mappings; executable code is never accepted.</Text>
      </Container>

      <Container>
        <Heading level="h2">Import batches</Heading>
        <div className="mt-3 flex flex-wrap gap-2">
          {batches.map((item) => <Button key={item.id} variant={batch?.id === item.id ? "primary" : "secondary"} size="small" onClick={() => loadBatch(item.id)}>{item.file_name || item.adapter_key} · {item.status}</Button>)}
        </div>
      </Container>

      {batch && <>
        <Container className="flex items-center justify-between">
          <div><Heading level="h2">Review batch</Heading><Text size="small">{batch.id} · {batch.adapter_key}</Text></div>
          <div className="flex gap-2"><Badge color={batch.review_status === "approved" ? "green" : "orange"}>{batch.review_status}</Badge><Badge>{batch.status}</Badge><Badge color={permission?.granted ? "green" : "red"}>{permission?.granted ? "Apply permission granted" : "Apply permission required"}</Badge></div>
        </Container>
        <div className="flex flex-col gap-y-3">
          {rows.map((row) => <Container key={row.id} className="p-0">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <label className="flex items-center gap-3"><input type="checkbox" checked={Boolean(selected[row.id])} disabled={row.action === "block"} onChange={(event) => setSelected((current) => ({ ...current, [row.id]: event.target.checked }))} /><div><Text weight="plus">{row.source_identity}</Text><Text size="small" className="text-ui-fg-subtle">{row.object_class} · confidence {Math.round((row.confidence || 0) * 100)}%</Text></div></label>
              <div className="flex gap-2"><Badge>{row.action}</Badge><Badge color={row.errors_json?.length ? "red" : row.warnings_json?.length ? "orange" : "green"}>{row.errors_json?.length ? "blocked" : row.warnings_json?.length ? "review" : "clean"}</Badge><Badge>{row.apply_status}</Badge></div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-6 lg:grid-cols-3">
              <details><summary className="cursor-pointer text-ui-fg-subtle">Raw source</summary><pre className="mt-2 max-h-72 overflow-auto rounded bg-ui-bg-subtle p-3 text-xs">{code(row.raw_payload_json)}</pre></details>
              <details open><summary className="cursor-pointer text-ui-fg-subtle">Normalized proposal</summary><pre className="mt-2 max-h-72 overflow-auto rounded bg-ui-bg-subtle p-3 text-xs">{code(row.normalized_payload_json)}</pre></details>
              <details><summary className="cursor-pointer text-ui-fg-subtle">Diff / evidence</summary><pre className="mt-2 max-h-72 overflow-auto rounded bg-ui-bg-subtle p-3 text-xs">{code({ diff: row.diff_json, warnings: row.warnings_json, errors: row.errors_json })}</pre></details>
            </div>
          </Container>)}
        </div>
        <Container className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={review} isLoading={busy}>Approve selected rows</Button>
          <Button variant="secondary" onClick={preview} isLoading={busy}>Run dry-run</Button>
          <Button onClick={apply} disabled={!dryRun?.apply_available || !permission?.granted || batch.status === "applied"} isLoading={busy}>Apply reviewed drafts</Button>
          <Button variant="danger" onClick={rollback} disabled={batch.status !== "applied" || !permission?.granted} isLoading={busy}>Rollback batch</Button>
          {dryRun && <Text size="small">Dry-run: {dryRun.approved_item_count} approved, {dryRun.blockers.length} blockers, 0 writes.</Text>}
        </Container>
      </>}
    </div>
  );
};

export const config = defineRouteConfig({ label: "Technical Import" });

export default ImportPipelinePage;
