# Legacy Configurator Logic Audit

Date: 2026-07-13  
Project: `D:\Meduza site`  
Legacy source: `C:\Users\kampo\OneDrive\Documents\pauloud 2` read-only

## Sources Reviewed

- `src/data/configurator.js`
- `src/components/configurator/ConfiguratorOptionRow.jsx`
- `src/components/configurator/ConfiguratorSummaryPanel.jsx`
- `src/components/configurator/ConfiguratorFilterSwitches.jsx`
- `src/lib/configuratorHelpers.js`
- `src/lib/configuratorBackplaneSync.js`
- `src/lib/configuratorOptionFilters.js`
- `src/lib/configuratorOptionUiState.js`
- `src/lib/dl360StorageScenarios.js`
- `src/lib/dl360StorageScenarios.test.js`
- `src/styles/part-10.css`
- `src/styles/part-14.css`
- `src/styles/part-15.css`
- `payload-cms/src/collections/CPUs.ts`
- `payload-cms/src/collections/RAMModules.ts`
- `payload-cms/src/collections/RAIDControllers.ts`
- `payload-cms/src/collections/NetworkCards.ts`
- `payload-cms/src/collections/ServerChassisVariants.ts`
- `payload-cms/src/lib/rulesEngine/facts.ts`
- `payload-cms/src/lib/rules/dl360TestingRulesetSeed.ts`
- `payload-cms/src/lib/rules/dl360NicsSeed.ts`
- `payload-cms/src/lib/rules/dl360ExpansionOptionsSeed.ts`
- `payload-cms/src/lib/rules/dl360PsuCoolingSeed.ts`
- `payload-cms/src/lib/rules/dl360GpuSeed.ts`

## CPU Logic

Payloud local configurator had four DL360-era CPU options: Intel Xeon Silver 4210R, Silver 4214R, Gold 5218R, and Gold 6248R. Each row carried cores, base/turbo clock, TDP, socket `LGA3647`, memory type `DDR4-2933`, price delta, and min/max CPU quantity `1..2`.

Important missed finding: legacy `configuratorOptionFilters.js` inferred Xeon Scalable CPU generation from model numbers. Models beginning with `31/41/51/61/81` were treated as `1st`, and `32/42/52/62/82` as `2nd`. `ConfiguratorFilterSwitches.jsx` rendered this as buttons: `Все`, `Xeon Scalable 1st Gen`, `Xeon Scalable 2nd Gen`.

Payload also had CPU socket/family collections, so the old architecture was ready for platform-specific CPU lists. Current Medusa imports CPU specs into `specs_json`. Storefront now has an inferred CPU generation filter again, but Medusa still lacks a persisted CPU generation/applicability field.

Status: `partial`.

## RAM Logic

Payloud RAM options included 32GB/64GB RDIMM ECC and 128GB LRDIMM ECC at DDR4-2933. The legacy facts engine calculated selected RAM modules, total GB, selected RAM speeds, and CPU memory speed limit. This is where warnings such as high-speed RAM downclocking belong.

Important missed finding: the old UI extracted memory speeds from specs/text and rendered speed buttons such as `Все`, `2133 MT/s`, `2400 MT/s`, `2666 MT/s`, `2933 MT/s` where those options existed. Payload facts compared `selectedRamSpeeds` with `selectedCpuMemorySpeedLimit`.

Current Medusa calculates `cpu_max_memory_speed`, `ram_speed`, and effective specs. The 1 CPU / 12 DIMM limit works through an enabled normalized rule. Storefront now has RAM speed filters and hides RAM above the selected CPU memory-speed limit when that limit is present. Missing piece: explicit downclock warnings such as 3200 running at 2933.

Status: `partial`.

## Storage Logic

Payloud separated storage by interface and form: SATA/SAS/NVMe, HDD/SSD, SFF/LFF/U.2 NVMe. Legacy DL360 storage scenarios distinguished `8SFF Standard` from `8SFF + Media Bay`.

Important missed finding: old `ConfiguratorPage.jsx` had a storage filter panel with `Тип диска: Все / HDD / SSD` and `Интерфейс: Все / SATA / SAS / NVMe`.

Current Medusa has 4 DL360 model variants and drive options with interface/form-factor metadata. Storefront now exposes safe HDD/SSD and SATA/SAS/NVMe filters over imported drive rows. Missing deeper model piece: normalized hierarchy of interface -> drive class -> form factor -> bay/backplane.

Status: `partial`.

## Backplane vs MediaBay

Important finding: Payloud did not treat Backplane and Media Bay as the same list.

Legacy `dl360StorageScenarios.js` used `driveBayOptions` for base drive bay/backplane scenarios and `mediaBayOptions` for optional expansion. Tests explicitly asserted that Media Bay options stay outside top-level scenario cards. `dl360ExpansionOptionsSeed.ts` modeled HPE Media Bay part numbers such as `867966-B21`, `871242-B21`, `867970-B21`, and `868000-B21`, each with provided bays/interfaces and requirements.

Current Medusa imports Media Bay rows as `type: backplane` with `specs_json.media_bay = true`. This is safe for now, but architecturally incomplete.

Recommended safe current step: keep schema unchanged and split UI/API logical groups using `specs_json.media_bay`.  
Recommended future change: add `component.type = media_bay` or a first-class `component_group`.

Status: `needs review`.

## RAID Logic

Legacy local RAID rows included software/HBA, 12G SAS RAID with 2GB cache, and 12G SAS RAID with 8GB cache + BBU. Payload had a dedicated `RAIDControllers` collection, and legacy text mixed HPE Smart Array and Dell PERC class controllers.

Current Medusa has RAID imported, but RAID fields are not fully structured. It needs `vendor`, `controller_family`, `placement`, `supported_interfaces`, `cache`, `requires_cable`, `requires_riser`, and `vendor_platform`.

Status: `needs review`.

## NIC Logic

Legacy NIC seed carried ports, speedGbps, connector, interfaceType, card height, requirements, warnings, and source lines. Legacy facts modeled OCP/FlexibleLOM support, available PCIe slots, used PCIe slots, selected PCIe slots, and riser type.

Important missed finding: old option filters separated embedded/NDC, FlexibleLOM and PCIe network cards from option text/specs.

Current Medusa imports NICs with specs for ports/speed/connector/slot_type and warnings. Storefront now exposes safe network slot filters for Embedded, FlexibleLOM, OCP and PCIe where imported rows support them. Missing active facts are `nic_qty`, `available_pcie_slots`, `used_pcie_slots`, `required_riser`, `port_speed`, `port_type`, and `vendor_platform`.

Status: `partial`.

## PSU Logic

Legacy local configurator had PSU bundle rows such as `2x 800W Platinum`, `2x 1100W Platinum`, and `2x 1600W Titanium`. Payload QuickSpecs seed also had individual HPE Flex Slot SKU rows with wattage, efficiency, input type, high-line requirements and source references.

Current Medusa shows both legacy bundles and individual HPE SKU rows, which creates visual near-duplicates. Storefront now deduplicates RAM/PSU display rows by normalized visible characteristics without deleting imported data. Proper model fix should separate bundle rows from single-SKU rows and normalize PSU capacity/high-line rules before enabling draft rules.

Status: `partial`.

## GPU Logic

Legacy Payloud had GPU facts for selected GPU count, power watts, required power cable SKUs, high-performance fan/heatsink kits, riser requirements, and unsupported/disabled states. The facts engine set GPU production readiness to false.

Current Medusa has no `gpu` component enum. GPU rows and GPU rules were intentionally skipped. This should remain skipped until a separate GPU migration and UI/rule plan are approved.

Status: `missing`.

## Calculator / Summary UI

Legacy summary panel was sticky, compact, and B2B-oriented. It used a calculator heading, selected option rows, validation popover, total near the bottom, and quote CTA. Rows were around 12.5px text with tight line-height and subtle borders.

Current Medusa summary was similar structurally but had larger text and more vertical spacing. It has now been tightened in storefront CSS.

## Configurator Row Style

Legacy `option-row` style used:

- font size: 13-14px
- font weight: mostly 500-600, not heavy
- line height: about 18px
- min-height: about 50px
- padding: 8-9px vertical, 10-11px horizontal
- border: `1px solid #dce5ef`
- border radius: 8px
- selected state: pale blue background and inset left accent bar
- disabled state: muted background and opacity
- required/recommended/warning: small state badges

Storefront CSS has been adjusted toward this compact style.

## Current Medusa Gap Analysis

| Area | Payloud had | Current Medusa has | Gap |
| --- | --- | --- | --- |
| CPU generation selection | `Все`, `1st Gen`, `2nd Gen` filters inferred from CPU model | inferred storefront filter + CPU specs in `specs_json` | no persisted generation/applicability table |
| CPU-specific RAM | facts for CPU memory speed limit | effective RAM speed basics + CPU-aware RAM list filtering | no explicit downclock warning |
| RAM frequency | selected RAM speeds and downclock facts | imported RAM speed + storefront speed filter | no active downclock warning rule |
| Storage hierarchy | SAS/SATA/NVMe + HDD/SSD + SFF/LFF/U.2 | drive specs, model scenarios, storefront HDD/SSD + interface filters | hierarchy not normalized in data model |
| Backplane vs MediaBay | separate driveBayOptions/mediaBayOptions | mixed `backplane` type with `media_bay` flag | schema needs `media_bay` or group layer |
| RAID placement/vendor | dedicated RAID collection | imported RAID text/specs | missing structured placement/vendor fields |
| NIC limits | PCIe/OCP/FlexibleLOM facts and filters | imported NIC specs + storefront slot filters | missing slot capacity facts |
| PSU | bundle rows + HPE Flex Slot SKU facts | imported bundle and SKU rows, UI dedupe | needs canonical bundle vs single-SKU grouping |
| GPU | facts, accessories, warnings, disabled states | skipped | needs separate migration |
| Draft rules | legacy facts/operators | imported disabled draft rules | must be normalized manually |
| UI style | compact B2B rows and calculator | modern but roomier storefront | CSS now partially aligned |

## Recommended Data Model Changes

1. Add `component.type = gpu`
   - Needed for legacy GPU rows, power cable/riser/cooling rules.
   - Requires migration.
   - Risk: medium.
   - Temporary `specs_json` workaround: no, because type filtering/UI groups need enum support.

2. Add `component.type = media_bay`
   - Needed because Payloud explicitly separated Media Bay from Backplane.
   - Requires migration.
   - Risk: medium.
   - Temporary `specs_json` workaround: yes, use `specs_json.media_bay = true`.

3. Add `component_group`
   - Needed for logical UI grouping without overloading component type.
   - Could be stored in `specs_json` short term.
   - Migration required only if database-level filtering is needed.

4. Add RAID/NIC/GPU `placement`
   - Needed for embedded/pci/mezzanine/ocp distinctions.
   - Temporary `specs_json` workaround: yes.

5. Add `slot_type`
   - Needed for PCIe/OCP/FlexibleLOM rules.
   - Temporary `specs_json` workaround: yes.

6. Add `vendor_platform`
   - Needed to split HPE Smart Array, Dell PERC, Broadcom/LSI, generic rows.
   - Temporary `specs_json` workaround: yes.

7. Add `supported_interfaces`
   - Needed for SAS/SATA/NVMe filtering and RAID/backplane compatibility.
   - Temporary `specs_json` workaround: yes.

8. Add `requires_components`
   - Needed for cable kit/riser/cooling dependencies.
   - Temporary `specs_json` workaround: yes, but rule simulator would benefit from structured data.

9. Add `effective_specs_json`
   - Needed to persist derived facts such as effective RAM speed or usable drive bay counts.
   - Migration required if saved configurations need replayable derived specs.
