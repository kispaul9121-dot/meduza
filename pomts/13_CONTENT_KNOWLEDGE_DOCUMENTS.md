# Этап 13. Content, Knowledge and Documents

> Перед началом обязательно прочитай `COMMON_STAGE_CONTRACT.md`, `STAGE_OWNERSHIP_MAP.md`, `STAGE_REPORT_TEMPLATE.md`, `README_EXECUTION_ORDER.md` и этот prompt целиком.

## Stage metadata

- `STAGE_ID`: `13`
- `MODE`: `IMPLEMENTATION`
- `INPUT_REPORTS`: `reports/stage-12-report.md`
- `OUTPUT_REPORT`: `reports/stage-13-report.md`
- `NEXT_STAGE`: `14`

## Skills

- `building-with-medusa` — custom content module, services, workflows, Admin и API
- `building-admin-dashboard-customizations` — content/document management UI и permissions
- `building-storefronts` — public knowledge, solution и document routes
- `domain-modeling` — content boundaries, revisions, evidence и polymorphic relations
- `supabase-postgres-best-practices` — constraints, indexes, migrations и revision safety
- `react-best-practices` — content rendering, caching и server/client boundaries
- `site-architecture` — content hierarchy, route ownership и internal linking
- `frontend-testing-debugging` — Admin/storefront runtime, network и browser checks
- `systematic-debugging` — только при подтверждённом зависании, migration failure или runtime defect
- `verification-before-completion` — publication, permission и evidence proof

## Ownership

Этап владеет:

- content domain и content types;
- editorial workflow и revision history;
- technical source evidence для опубликованного контента;
- public knowledge, solutions и documents;
- relations контента с товарами, server-domain entities и ReadyConfiguration;
- publication state и draft isolation;
- безопасным document/download lifecycle;
- content-side hooks, которые позднее использует SEO module.

## Out of scope

- SEO representation, `SeoEntry`, JSON-LD, sitemap, robots, redirects и indexation policy — этап 16.
- Programmatic SEO generation и массовое создание landing pages.
- Новая визуальная концепция, palette, typography или redesign — этап 18.
- Общий functional UX/performance cleanup storefront/Admin — этап 15.
- Изменение Compatibility Engine, cart, RFQ, pricing или order snapshot, кроме безопасных read-only relations к контенту.
- Повторная реализация import pipeline этапа 08.
- Автоматическая публикация AI/extracted content.

## Цель

Создать внутри Medusa единый reviewable content domain, связанный с server models, components, packs, ready configurations, brands, generations и storage topology. Контент должен создаваться через Admin без изменения кода, технические утверждения должны иметь проверяемый источник, а storefront должен получать только опубликованные данные.

Полный SEO module на этом этапе не реализовывать.

---

## 1. Входной контроль и восстановление прерванной попытки

1. Проверь текущую ветку, `git status`, незакоммиченные изменения и последний commit.
2. Найди все уже начатые Stage 13 files, migrations, models, routes, Admin pages и storefront pages.
3. Не перезаписывай и не удаляй чужую незавершённую работу. Сначала классифицируй её:
   - usable and consistent;
   - partial but recoverable;
   - conflicting with stage contracts;
   - generated/temporary artifact.
4. Если предыдущая попытка зависла:
   - найди последнее успешно завершённое действие;
   - найди failing command, migration, test или process;
   - останови orphan dev/build/test processes;
   - продолжи с проверяемой точки, а не запускай всё вслепую повторно.
5. Обязательно прочитай `reports/stage-12-report.md`, его gate и `NEXT_STAGE_OVERRIDES`.
6. Если `reports/stage-12-report.md` отсутствует:
   - восстанови его из commit с сообщением `Verify and stabilize Stage 12 commerce flow`, текущего Git state, CI/build/test evidence и Stage 12 contract;
   - не выдумывай проверки, которые реально не выполнялись;
   - создай восстановленный `reports/stage-12-report.md` с пометкой `reconstructed from repository evidence`;
   - разреши Stage 13 только если восстановленный gate может быть обоснован как `GO`;
   - иначе установи `NEXT_STAGE_GATE: STOP` и не начинай Stage 13 implementation.
7. Зафиксируй baseline-команды и pre-existing failures до изменений.
8. Не начинай этап 14 автоматически в Manual Review Mode.

---

## 2. Аудит существующих content/source/document сущностей

Перед созданием новых models найди и опиши:

- существующие `SourceDocument`, source-doc routes и Admin pages;
- source references в `ServerModel`, `Component`, `ComponentPack`, `StorageTopology`, assignments, compatibility rules и imports;
- media/upload storage, если он уже есть;
- статические knowledge/solution/article pages в storefront;
- существующие rich-text, markdown или JSON block renderers;
- route contracts этапа 02;
- текущие roles/permissions Admin;
- любые content-like поля в product/server models;
- document URLs и download behavior;
- draft/published flags, если они уже существуют.

Создай audit section в отчёте с таблицей:

| Existing entity/file | Current role | Keep | Extend | Migrate | Do not duplicate | Risk |
|---|---|---:|---:|---:|---:|---|

Критическое правило:

- не создавай вторую параллельную сущность с тем же смыслом;
- raw technical source evidence из этапов 03/08 не превращай автоматически в public content;
- public document/download и private source evidence должны иметь явную границу доступа.

---

## 3. Каноническая content architecture

Создай или расширь Medusa custom module, а не отдельный сервер.

Минимальный канонический набор сущностей:

### `ContentEntry`

Хранит логическую единицу контента.

Поля:

- `id`;
- `type`;
- `slug`;
- `locale`;
- `title`;
- `summary`;
- `status`;
- `current_revision_id`;
- `author_id`;
- `reviewer_id`;
- `reviewed_at`;
- `published_at`;
- `archived_at`;
- `canonical_owner_type`;
- `canonical_owner_id`;
- `index_hint` как content-side hint, не SEO policy;
- `created_at`;
- `updated_at`.

Поддержи content types:

- `solution`;
- `industry`;
- `use_case`;
- `article`;
- `buying_guide`;
- `compatibility_guide`;
- `faq`;
- `brand_landing`;
- `generation_landing`;
- `glossary`;
- `document_download`.

Content type не должен быть жёстко размазан по storefront `if/else`. Используй registry/configuration pattern, если он уже принят проектом.

### `ContentRevision`

Хранит immutable revision:

- `content_entry_id`;
- `revision_number`;
- `title`;
- `summary`;
- `body_json` или существующий безопасный rich-text format;
- `change_note`;
- `created_by`;
- `created_at`;
- `source_completeness`;
- `review_status`;
- `reviewed_by`;
- `reviewed_at`;
- `content_hash`.

Правила:

- published revision не изменяется in-place;
- edit опубликованного материала создаёт новую draft revision;
- rollback выбирает предыдущую revision, но не удаляет историю;
- body не может исполнять arbitrary JavaScript;
- raw HTML разрешён только при существующей безопасной sanitization policy.

### `ContentRelation`

Связывает контент с domain entities.

Поля:

- `content_entry_id`;
- `target_type`;
- `target_id`;
- `relation_kind`;
- `sort_order`;
- `label_override`;
- `created_at`.

Relation kinds:

- `about`;
- `applies_to`;
- `related`;
- `recommended_product`;
- `recommended_configuration`;
- `supporting_document`;
- `source_evidence`;
- `parent`;
- `child`.

Target registry должен поддерживать как минимум:

- `ServerModel`;
- `Component`;
- `ComponentPack`;
- `ReadyConfiguration`;
- product/category;
- brand;
- generation / `VendorGenerationTemplate`;
- `StorageTopology` / `ServerStorageOption`;
- `TechnologyConcept`;
- другой `ContentEntry`.

Не доверяй произвольному `target_type`. Проверяй type через allowlist/registry и существование target entity.

### `ContentEvidenceLink`

Связывает техническое утверждение или revision с источником.

Поля:

- `content_revision_id`;
- `claim_key` или `block_id`;
- `source_document_id`;
- `locator` — page/section/table/URL fragment;
- `evidence_note`;
- `verification_status`;
- `verified_by`;
- `verified_at`;
- `confidence`;
- `source_hash`.

Статусы evidence:

- `unverified`;
- `partially_verified`;
- `verified`;
- `rejected`;
- `source_outdated`.

Технический content нельзя публиковать, если обязательные technical claims не имеют accepted evidence.

### Documents

Сначала проверь существующий `SourceDocument`.

Раздели роли:

- `SourceDocument` — internal/raw/verified technical source и provenance;
- public `document_download` — управляемый ContentEntry, который может ссылаться на разрешённый source/file asset;
- extracted text/OCR/raw chunks не публикуются автоматически.

Если отдельная asset entity действительно нужна, создай минимальный `DocumentAsset`:

- original filename;
- storage key/provider;
- MIME type;
- size;
- checksum;
- document type;
- vendor/version/date;
- visibility;
- download policy;
- source URL;
- malware/validation status;
- extracted text reference, private by default.

Не создавай `DocumentAsset`, если существующий media/source model уже безопасно покрывает эти поля.

---

## 4. Workflow и publication state

Поддержи workflow:

```text
draft → in_review → approved → published → archived
```

Допустимые возвраты:

- `in_review → draft` с review comment;
- `approved → draft` только с причиной;
- `published → archived`;
- edit published → новая draft revision, текущая published revision остаётся публичной до новой публикации.

Обязательные проверки перед publish:

1. slug/locale uniqueness;
2. title и summary заполнены;
3. body соответствует schema;
4. все relations валидны;
5. public document безопасен и доступен;
6. technical claims имеют evidence;
7. unreviewed extracted text отсутствует в published body;
8. author/reviewer separation соблюдена, если роль требует;
9. canonical owner не конфликтует;
10. linked unpublished/deleted entities обработаны явно;
11. нет broken internal links;
12. content type имеет storefront renderer или явно Admin-only.

Не разрешай publish простым изменением поля `status` в generic CRUD. Используй workflow/service с validation и audit trail.

---

## 5. Permissions и security

Определи и проверь roles/capabilities:

- content author — create/edit draft;
- reviewer — review/approve/reject;
- publisher — publish/archive;
- technical reviewer — verify technical evidence;
- super-admin — управляет permissions, но publish всё равно проходит validation workflow.

Правила:

- Store API возвращает только published revision;
- draft/review content не должен утекать через list, detail, relation или search endpoint;
- preview требует Admin auth или short-lived signed token;
- private source documents не доступны через public download route;
- проверяй MIME, extension, file size и storage key;
- запрети path traversal;
- не проксируй произвольный remote URL;
- remote fetch/import должен использовать stage-08 security policy и SSRF protection;
- не доверяй client-supplied author/reviewer/status;
- все mutation routes используют validation и workflows;
- audit trail сохраняет actor/time/action/revision.

---

## 6. Admin implementation

Создай или расширь Admin sections без визуального редизайна:

### Content Library

- list/filter by type, status, locale, author, reviewer, modified date;
- create/edit draft;
- relation picker;
- source/evidence panel;
- revision history;
- review comments;
- preview;
- publish readiness;
- archive action.

### Document Library

- source/public visibility;
- file metadata;
- checksum/version/date;
- linked content/domain entities;
- evidence usage count;
- download test;
- review status;
- duplicate detection.

### Review Queue

- entries waiting for review;
- missing evidence;
- rejected claims;
- stale source;
- broken relations;
- publication blockers.

Admin UI должен использовать существующие Medusa UI primitives и project patterns. Не добавляй новую UI library и не меняй visual direction.

---

## 7. API и service contracts

Создай service/workflow layer. Минимальные operations:

- create content entry;
- create revision;
- update draft revision;
- submit for review;
- approve/reject;
- publish revision;
- archive entry;
- attach/detach relation;
- attach/verify/reject evidence;
- register document;
- resolve public content;
- resolve related entities;
- preview content;
- invalidate content cache.

Admin API:

- validated mutation routes через workflows;
- list/detail/filter;
- revision history;
- review queue;
- evidence validation;
- document management;
- preview.

Store API:

- published list by type/locale;
- published detail by slug/locale;
- related products/models/configurations;
- public documents;
- glossary/FAQ data;
- 404 for draft, archived or unknown slug.

DTO должен явно возвращать:

- published revision only;
- type/slug/locale/title/summary/body;
- modified/published dates;
- public relations;
- public documents;
- breadcrumbs data;
- content-side SEO hooks for stage 16.

Storefront не обращается напрямую к БД.

---

## 8. Storefront routes и rendering

Прочитай route strategy и route contracts этапа 02. Не меняй canonical prefix strategy.

Реализуй предусмотренные contracts для:

- solutions listing;
- solution detail;
- knowledge listing;
- knowledge detail;
- document/download detail;
- glossary/FAQ where required by the route contract.

Страницы должны поддерживать:

- server-rendered published content;
- breadcrumbs;
- related ServerModel/Product/ReadyConfiguration;
- related documents;
- internal links;
- loading/error/empty states;
- correct 404;
- mobile-safe rendering;
- accessible headings, links and download labels.

Не создавай фиктивные статьи, claims, документы или vendor specs ради заполнения интерфейса. Для runtime smoke допускаются test fixtures, которые не попадают в production seed/publication.

---

## 9. Internal linking ownership

Зафиксируй owner каждого link type:

- content → server/product;
- server/product → related content;
- content → content;
- content → public document;
- content → ReadyConfiguration;
- brand/generation landing → models/components;
- glossary term → related guide/article.

Правила:

- relation создаётся в backend и валидируется;
- storefront не угадывает relation по совпадению строки;
- удаление/архивация target не создаёт silently broken public link;
- orphan content попадает в review finding;
- circular parent/child hierarchy блокируется;
- related items имеют deterministic sort/fallback.

---

## 10. Content-side SEO hooks для этапа 16

Подготовь только данные и contracts:

- stable slug;
- locale;
- canonical owner type/id;
- title override hint;
- description override hint;
- index hint;
- modified date;
- published date;
- author/reviewer;
- related entity;
- content type;
- public image/document reference where valid.

Не создавай здесь:

- `SeoEntry`;
- `SeoTemplate`;
- Redirect Manager;
- `IndexationPolicy`;
- Sitemap Manager;
- robots policy;
- JSON-LD renderer;
- IndexNow/SearchSubmission;
- programmatic landing generator.

Stage 16 должен потреблять Stage 13 content hooks, а не мигрировать дублирующие SEO fields из нескольких content tables.

---

## 11. Migrations и data safety

1. Все schema changes — только migrations.
2. Используй additive migration и безопасный backfill.
3. Existing source documents/references сохраняются.
4. Не меняй public URL без redirect owner из этапа 16; при необходимости сохрани slug history как content event/handoff, но не создавай Redirect entity.
5. Добавь constraints/indexes как минимум для:
   - unique active slug/type/locale;
   - content status;
   - published date;
   - revision number per entry;
   - relation target lookup;
   - evidence source/revision lookup;
   - document checksum/stable identity.
6. Migration должна быть repeatable/verifiable и иметь rollback/recovery plan.
7. Не удаляй legacy content/source fields до доказанного backfill и consumer migration.
8. Не копируй large extracted text в публичный DTO.

---

## 12. Caching и invalidation

- published content можно кэшировать только по type/slug/locale/revision;
- draft preview не использует public cache;
- publish/archive/relation/document changes invalidates affected routes;
- related entity changes не должны оставлять stale public content indefinitely;
- cache invalidation должна быть проверяема;
- не добавляй performance redesign, принадлежащий этапу 15.

---

## 13. Tests и runtime scenarios

Добавь применимые tests.

### Backend/domain

- content type validation;
- revision immutability;
- valid/invalid workflow transitions;
- publish readiness;
- evidence-required technical content;
- relation target validation;
- duplicate slug/locale;
- archive behavior;
- document visibility;
- private source isolation;
- audit trail.

### API/security

- author cannot publish without permission;
- reviewer workflow;
- draft does not leak through Store API;
- unpublished related entity handling;
- invalid target type rejected;
- path traversal rejected;
- unsafe remote document URL rejected;
- MIME/size policy;
- preview authorization;
- malformed body validation.

### Storefront

- solutions list/detail;
- knowledge list/detail;
- related products/models;
- documents/downloads;
- breadcrumbs;
- empty state;
- published page HTTP 200;
- draft/archived/unknown page 404;
- no hydration/console errors;
- responsive smoke.

### Migration/build

- migration apply;
- migration validation/rollback strategy;
- typecheck;
- lint;
- backend tests;
- storefront tests;
- production builds;
- runtime/browser smoke.

Не объявляй `GO` только по успешному build.

---

## 14. Stage-specific Definition of Done

- Content создаётся через Admin без изменения кода.
- Есть канонические content types и безопасный body format.
- Draft/review/published/archive workflow работает через services/workflows.
- Published revision immutable и имеет revision history.
- Technical claims имеют source evidence и reviewer state.
- Unreviewed extracted content не публикуется.
- Existing SourceDocument/import provenance не продублированы и не потеряны.
- Relations с ServerModel, Component, Pack, ReadyConfiguration, brand/generation и topology работают.
- Store API не раскрывает draft/private data.
- Solutions/knowledge/document routes работают по canonical route strategy.
- Есть Admin Content Library, Review Queue и document/source management или безопасное расширение существующих pages.
- SEO hooks подготовлены без создания Stage 16 domain.
- Tests, migrations, build и runtime evidence достаточны.
- Нет redesign и изменений вне ownership Stage 13.

---

## 15. Stage-specific report evidence

В `reports/stage-13-report.md` дополнительно к `STAGE_REPORT_TEMPLATE.md` обязательно включи:

1. content entity/relationship diagram;
2. existing SourceDocument/media migration decision;
3. content type registry/table;
4. workflow transition matrix;
5. role/permission matrix;
6. content → product/server/ready configuration relation examples;
7. technical claim → source evidence examples с locator;
8. draft isolation and publication API evidence;
9. document public/private scenarios;
10. internal-link ownership table;
11. storefront route matrix и 200/404 evidence;
12. migration names, constraints и rollback/recovery;
13. точные test/build/runtime commands с exit status;
14. список unfinished/unverified без сокрытия;
15. доказательство, что SeoEntry/redirect/sitemap/indexation не реализованы преждевременно.

---

## 16. Gate

Применяй семантику из `COMMON_STAGE_CONTRACT.md`.

- `GO_WITH_CORRECTIONS` исправляется в текущем этапе.
- `GO` допустим только после независимого read-only review и устранения Stage 13 findings.
- При невозможности доказать Stage 12 gate, migration safety, draft isolation или document security установи `STOP`.
- После `GO` создай атомарный Stage 13 commit и укажи `NEXT_STAGE_OVERRIDES` либо `NONE`.
- В Manual Review Mode остановись и не запускай этап 14 самостоятельно.
