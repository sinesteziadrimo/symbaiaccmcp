# Catalog MCP — Symbai Accounting

> Sincronizat cu registry-ul aplicației la 15 august 2026: **301 tool-uri**. Sursa de adevăr pentru sesiunea curentă rămâne `tools/list`, deoarece tokenul vede numai modulele sale de citire/scriere. Nu presupune că un tool lipsește doar fiindcă nu apare pe un token restrâns — și nu presupune o „limită a sesiunii": la contabilitate nu există filtrare pe rol de angajat sau pe arie, lista e exact modulele tokenului (spre deosebire de conexiunea `symbai` la POS, unde contul de angajat e filtrat și de rolul POS și de aria lui).

## Permisiuni și reguli de siguranță

- `readModules: null` înseamnă acces la toate citirile (compatibilitate/token complet). O listă de module limitează citirile la acele arii; `[]` lasă numai contextul universal al firmei.
- Scrierea cere modulul corespunzător în `writeModules`: `facturare`, `cheltuieli`, `contabilitate`, `declaratii`, `parteneri`, `stocuri`, `salarizare`, `banca`, `import`, `setari` sau `sql_write`.
- SQL read-only cere comutatorul separat `sqlRead` și vede numai view-uri `mcp_v_*` filtrate la firma tokenului.
- `execute_sql_write` este o capabilitate administrativă separată, periculoasă; nu înlocuiește tool-urile semantice.
- `companyId` vine exclusiv din token. Nu îl cere utilizatorului și nu încerca să-l trimiți în argumente.
- Pentru postări contabile/fiscale, aplicări de stoc, închideri/redeschideri, REGES, reparații și operații distructive: rulează mai întâi citirea/preview-ul, explică efectul, cere acord, apoi folosește `confirm:true` când schema îl cere.
- După orice scriere, verifică printr-un tool de citire. Interfața poate avea cache.
- Listele sunt paginate/plafonate; folosește `limit`, `offset`, `search` și filtrele expuse.
- Secretele, CNP-urile și alte câmpuri sensibile sunt redactate. Nu încerca să le recuperezi prin SQL.

## Orientare rapidă

| Cerere | Începe cu | Scriere uzuală |
|---|---|---|
| Situația firmei | `get_dashboard` | — |
| Balanță / P&L / bilanț | `get_trial_balance`, `get_profit_loss`, `get_balance_sheet` | `post_journal_entry` |
| Client sau furnizor | `list_clients`, `list_suppliers`, `get_partner_stats` | `create_*`, `update_*` |
| Facturi emise | `list_invoices`, `list_outgoing_invoices` | `create_invoice`, `update_invoice` |
| Facturi primite | `list_bills`, `list_incoming_invoices`, `get_inbox_quality_report` | `create_bill`, `update_bill` |
| Stoc | `list_warehouses`, `list_products`, `list_product_types`, `list_product_categories`, `get_warehouse_stock` | mișcare: `create_inventory_document` → `apply_inventory_document`; inventariere: `create_inventory_count` → `post_inventory_count` / `reverse_inventory_count` |
| Bancă / casă | `list_bank_accounts`, `list_bank_transactions`, `list_cash_registers` | `create_*` / `update_*`, apoi tranzacția dedicată |
| Import structurat | `get_accounting_import_fields`, `preview_accounting_import` | preview → `execute_accounting_import` cu confirmare |
| Salarizare | `get_payroll_summary`, `list_payroll_runs`, `check_payroll_approval_readiness` | `generate_payroll_lines`, `finalize_payroll_run` |
| REGES | `get_reges_integration_health`, `list_reges_pending` | tool-ul dedicat transmiterii, cu confirmare |
| Declarații / D406 | `list_tax_declarations`, `dry_run_d406` | preview → apply/attest/submit dedicat |
| Perioadă închisă | `list_period_closings`, `get_period_closing_readiness` | `reopen_period` / `unlock_month_everywhere` numai după acord |
| Integrare POS/Supplier | `get_platform_sync_health`, `list_platform_sync_logs` | preview → resync/repair dedicat |

## Rapoarte și context — 16

- `get_dashboard`
- `list_invoices`, `get_invoice`
- `list_bills`, `get_bills_aging`
- `list_accounts`, `list_journal_entries`
- `get_trial_balance`, `get_profit_loss`, `get_balance_sheet`, `get_vat_summary`, `get_cash_flow` (flux de numerar din GL, cu transferurile interne casă↔bancă excluse)
- `get_financial_indicators`, `get_account_ledger`, `get_journal_register`, `get_receivables_aging`

## Parteneri și companie — 17

- Clienți: `list_clients`, `get_client`, `create_client`, `update_client`
- Furnizori: `list_suppliers`, `get_supplier`, `create_supplier`, `update_supplier`
- Fișe și controale: `get_client_ledger`, `get_supplier_ledger`, `get_partner_stats`, `list_invoice_mapping_memory`
- Profil firmă: `get_company_profile`, `list_company_contacts`, `list_company_administrators`, `list_company_associates`, `list_company_bank_accounts`

Clienții/furnizorii sincronizați din POS păstrează identitatea operațională autoritară în POS. `update_client` și `update_supplier` acceptă pe aceștia numai câmpurile contabile locale și refuză explicit restul. Pentru un furnizor RO cu `vatOnCash:true`, trimite intervalul valabil, momentul verificării și referința dovezii ANAF; tool-ul refuză un statut incomplet sau neverificabil.

## Facturare și eFactura — 12

- `list_outgoing_invoices`, `get_outgoing_invoice`
- `list_client_invoices` (fișa fiscală completă a facturilor emise clientului)
- `list_fiscal_series`, `create_fiscal_series`
- `create_invoice`, `update_invoice`, `delete_invoice`
- `list_efactura_inbox`, `check_efactura_status`, `get_efactura_deadline`, `upload_invoice_to_efactura`

## Cheltuieli, facturi primite și reconciliere AP — 28

- Citire curentă: `get_bill`, `list_incoming_invoices`, `get_incoming_invoice`, `list_mapping_rules`, `check_duplicate_invoice`
- Calitate/proveniență: `get_reception_invoice_link`, `get_mapping_rule_history`, `get_inbox_quality_report`, `get_bill_payment_header_reconciliation`, `list_purchase_bill_identity_reviews`
- Control POS/NIR: `get_pos_nir_bill_line_account_reconciliation`, `get_pos_asis_duplicate_bill_reconciliation`, `get_senneville_qa_orphan_bill_retirement`, `get_pos_cancelled_nir_orphan_bill_retirement`, `get_senneville_deleted_photo_invoice_25100_retirement`
- Preview: `preview_pos_supplier_subledger_repair`
- Scriere uzuală: `create_bill`, `update_bill`, `create_mapping_rule`, `bulk_delete_mapping_rules`, `resolve_purchase_bill_identity_review`
- Reparații confirmate: `apply_pos_supplier_subledger_repair`, `repair_bill_payment_headers`, `repair_pos_nir_bill_line_accounts`, `repair_pos_asis_duplicate_bills`, `retire_senneville_qa_orphan_bills`, `retire_pos_cancelled_nir_orphan_bills`, `retire_senneville_deleted_photo_invoice_25100`

Tool-urile cu nume de incident/tenant sunt workbench-uri controlate. Folosește-le numai când preview-ul dedicat găsește exact cohorta vizată; rezultat gol înseamnă „nu se aplică”, nu eroare.

## Jurnal, plan de conturi și închidere — 18

- Detalii: `get_account`, `get_journal_entry`, `get_opening_balances`
- Plan/jurnal: `create_account`, `update_account`, `post_journal_entry`, `upsert_opening_balances`
- Pregătire perioadă: `get_period_closing_readiness`, `list_period_closings`, `post_vat_on_cash`
- Tranziții: `reopen_period`, `unlock_month_everywhere`, `lock_pos_month`
- Reparații controlate: `preview_pos_cancelled_inventory_gl_repair`, `apply_pos_cancelled_inventory_gl_repair`, `preview_d406_legacy_pos_pending_valuation_attestation`, `apply_d406_legacy_pos_pending_valuation_attestation`, `repair_pos_inventory_journal_lines`

## Documente și mijloace fixe — 10

- `get_incoming_invoice_lines`, `approve_incoming_invoice`
- `list_fixed_assets`, `get_fixed_asset`, `get_fixed_asset_source_candidates`, `get_fixed_asset_source_allocations`
- `dispose_fixed_asset`, `modernize_fixed_asset`
- `get_pos_daily_sales_revenue_breakdown`, `list_compensation_orders`

## Stocuri și gestiune — 33

- Gestiuni: `list_warehouses`, `get_warehouse`, `get_warehouse_stock`, `create_warehouse`, `update_warehouse`, `delete_warehouse`
- Produse: `list_products`, `get_product`, `create_product`, `update_product`, `delete_product`
- Categorii: `list_product_categories`, `get_product_category`, `create_product_category`, `update_product_category`, `delete_product_category`
- Configurare tipuri: `list_product_types`, `get_product_type`, `create_product_type`, `update_product_type`, `delete_product_type`
- Unități de măsură: `list_units_of_measure`, `get_unit_of_measure`, `create_unit_of_measure`, `update_unit_of_measure`, `delete_unit_of_measure`
- Documente operaționale: `list_inventory_documents`, `get_inventory_document`, `create_inventory_document`, `apply_inventory_document`
- Inventariere canonică: `create_inventory_count`, `post_inventory_count`, `reverse_inventory_count`

`create_product` și `update_product` validează că `categoryId` și `supplierId` aparțin firmei tokenului, iar tipul de produs există în configurația firmei/sistemului. Produsele/gestiunile/categoriile POS păstrează proprietatea upstream; MCP poate modifica numai câmpurile locale permise. Toate ștergerile cer `confirm:true`: produsul este arhivat logic numai fără stoc, fără documente draft dependente și numai dacă este manual, categoria se șterge numai fără produse/subcategorii, iar gestiunea numai fără stoc/documente. Tipurile de produs validează conturile și cer simultan drepturi de scriere `stocuri` + `contabilitate`; tool-urile lor nu apar în `tools/list` fără ambele granturi. Orice remapare a unui cont purtător de stoc este blocată cât există stoc cantitativ/valoric, iar ștergerea este refuzată pentru tipuri POS/de sistem sau încă folosite. Unitățile se dezactivează, nu se șterg fizic, și pot fi regăsite cu `list_units_of_measure(includeInactive:true)` pentru reactivare.

Documentul operațional cere produse rezolvate prin `productId`, se creează în `draft`, iar aplicarea mută stocul și poate posta jurnalul. Cantitatea, CMP-ul și valoarea sunt calculate zecimal exact (3/8/2 zecimale), inclusiv la transfer și retur. Pentru `return_supplier`, trimite recepția exactă în `sourceInventoryDocumentId` și linia exactă în `sourceInventoryLineId`; returul direct MCP este permis numai pentru recepția standalone 408, nu pentru una deja facturată.

Inventarierea nu se creează prin aliasul legacy `inventariere`/`inventory`. Folosește `create_inventory_count`: serverul captează stocul scriptic sub aceleași lock-uri ca postarea, cere metadatele legale (entitate, gestionar, comisie, cont, metodă) și clasifică fiecare diferență ca `consum`, `shortage`, `plus` sau `ignore`. `post_inventory_count` cere `confirm:true` și folosește exact același serviciu ca UI. `reverse_inventory_count` cere confirmare, refuză orice mișcare ulterioară chiar dacă soldul a revenit aparent la aceeași valoare și restaurează snapshotul cantitativ/valoric exact înainte de nota oglindă.

## Bancă, casă și registrul de încasări/plăți — 25

- Conturi: `list_bank_accounts`, `get_bank_account`, `create_bank_account`, `update_bank_account`
- Bancă: `list_bank_transactions`, `get_bank_transaction`, `create_bank_transaction`, `create_bank_transactions_batch` (extras întreg, atomic, max 200 linii), `update_bank_transaction`, `reconcile_bank_transaction`, `unreconcile_bank_transaction`, `auto_reconcile_bank_transactions`
- Casierii: `list_cash_registers`, `get_cash_register`, `create_cash_register`, `update_cash_register`
- Numerar: `list_cash_transactions`, `get_cash_transaction`, `create_cash_transaction`, `update_cash_transaction`, `delete_cash_transaction`, `reconcile_cash_transaction`, `unreconcile_cash_transaction`
- Registru: `list_registru_incasari_plati`, `create_registru_entry`

`create_bank_transaction` și `create_cash_transaction` folosesc normalizarea canonică a direcției, validează ziua calendaristică și respectă blocarea perioadei. Proveniența de import/sync rămâne server-owned. `update_bank_transaction` corectează numai rânduri create manual; extrasele importate și tranzacțiile POS sunt imuabile și se corectează prin reimport/supersede. Corecțiile sunt permise numai înainte de reconciliere și revalidează tenantul sub lock. Reconcilierea cu factură client/furnizor actualizează documentul și postează nota de plată în aceeași tranzacție; dereconcilierea restaurează documentul și postează stornarea auditabilă. Auto-reconcilierea acceptă numai dovada bancară v3 deterministă, fără review, cu stingere exactă. `update_bank_account` nu permite reinterpretarea IBAN-ului/monedei după extrase verificate sau mișcări; `update_cash_register` nu schimbă moneda unei case cu istoric.

## Import și migrare — 5

- Contracte: `get_accounting_import_fields`
- Istoric: `list_accounting_import_sessions`, `get_accounting_import_session`
- Flux structurat: `preview_accounting_import` → `execute_accounting_import`

Importul MCP primește antetele, rândurile și maparea semantică explicită; `companyId` este impus din token. Preview-ul rulează validatorul canonic fără scriere. Execuția cere `confirm:true`, refuză erorile blocante și raportează distinct orice import parțial, care trebuie verificat înainte de reluare. Sunt executabile numai motoarele demonstrate sigure (`payroll`, `opening_balances`, `fixed_assets`). Importul payroll cere o singură perioadă `YYYY-MM`, fie mapată din fișier, fie declarată în valori implicite, iar preview-ul și execuția folosesc aceeași perioadă. Tipurile legacy rămase, inclusiv contactele care necesită convergență cu ownership-ul POS și resolverele canonice de partener, sunt refuzate fail-closed până la migrarea lor completă.

## Declarații fiscale și SAF-T D406 — 26

- Tracker: `list_tax_declarations`, `get_tax_declaration`, `create_tax_declaration`, `update_tax_declaration`, `mark_tax_declaration_submitted`
- Bază D406: `dry_run_d406`, `list_d406_fiscal_vector`, `attest_d406_fiscal_vector`
- Master data: `get_d406_master_data_repair_issues`, `preview_d406_master_data_repair`, `apply_d406_master_data_repair`, `undo_d406_master_data_repair_batch`
- Active/anual: `get_d406_active_annual_manifest_preview`, `get_d406_active_annual_manifest_status`, `get_d406_active_asset_bulk_close_preview`
- Produse periodice: `get_d406_periodic_product_repair_issues`, `preview_d406_periodic_product_repair`, `apply_d406_periodic_product_repair`
- Parteneri ANAF: `preview_d406_partner_anaf_profiles`, `apply_d406_partner_anaf_profiles`, `preview_d406_partner_anaf_rollover`, `apply_d406_partner_anaf_rollover`
- Legacy/subledger: `preview_d406_legacy_subledger_repair`, `apply_d406_legacy_subledger_repair`
- Legături ASIS: `preview_asis_document_journal_links`, `apply_asis_document_journal_links`

## Salarizare operațională — 25

- Angajați/state: `list_employees`, `get_employee`, `create_employee`, `update_employee`, `list_payroll_runs`, `get_payroll_run`, `create_payroll_run`
- Contracte legacy: `list_contracts`, `create_contract`
- Pontaj/concedii: `list_time_entries`, `record_time_entry`, `list_leave_requests`, `create_leave_request`, `review_leave_request`, `list_medical_certificates`
- Calcul și obligații: `list_labor_obligations`, `list_payroll_run_lines`, `get_payroll_summary`, `generate_payroll_lines`, `settle_labor_obligation`, `check_payroll_approval_readiness`, `get_payslip`
- Finalizare: `finalize_payroll_run`, `reopen_payroll_run`, `prepare_d112`

## HR, contracte individuale, REGES și zilieri — 93

- Citiri: `list_employment_contracts`, `get_employment_contract`, `list_employment_detachments`, `list_incoming_reges_detachments`, `list_contract_amendments`, `list_hr_documents`, `get_hr_document`, `list_reges_pending`, `list_reges_transmissions`, `get_reges_nomenclator`, `get_reges_profile`, `get_reges_integration_health`, `get_reges_deadline_rules`
- Angajare/contract: `hire_employee`, `complete_employment_contract_draft`, `review_employment_contract_legal_terms`, `amend_employment_contract`, `review_legacy_amendment_snapshot`, `confirm_contract_role_classification`, `apply_signed_employment_amendment`, `cancel_employment_amendment`, `update_employee_tax_identity`, `designate_payroll_primary_contract`
- Detașări/comunicări: `create_employment_detachment`, `review_employment_detachment_snapshot`, `record_employment_detachment_communication`, `record_service_relationship_communication`, `sync_incoming_reges_detachments`, `respond_incoming_reges_detachment`
- Suspendare/încetare: `suspend_employment_contract`, `end_contract_suspension`, `terminate_employment_contract`
- REGES: `submit_employee_to_reges`, `submit_contract_to_reges`, `submit_detachment_to_reges`, `end_detachment_in_reges`, `cancel_detachment_in_reges`, `submit_amendment_to_reges`, `submit_termination_to_reges`, `submit_suspension_to_reges`, `poll_reges_results`, `resolve_ambiguous_reges_message`
- Corecții/mutări REGES: `correct_employee_in_reges`, `submit_reges_exceptional_contract_operation`, `submit_contract_move_to_reges`, `cancel_contract_move_in_reges`, `respond_incoming_reges_move`
- Cozi și nomenclatoare REGES: `list_reges_queue_events`, `sync_reges_notifications`, `sync_incoming_reges_moves`, `sync_reges_move_lifecycle`, `save_reges_employer_allowance_type`, `delete_reges_employer_allowance_type`
- Semnare: `send_contract_for_signature`, `get_contract_signature_status`
- Cereri HR ale angajatului (concediu, adeverințe, acte): `list_employee_hr_request_catalog`, `create_employee_hr_request`, `list_employee_hr_requests`, `get_employee_hr_request`, `get_employee_hr_request_file`, `review_employee_hr_request`
- Aprobări pe cereri HR: `list_employee_hr_approval_inbox`, `decide_employee_hr_approval`, `list_employee_hr_approval_policies`, `save_employee_hr_approval_policy`, `set_employee_hr_approval_policy_enabled`, `simulate_employee_hr_approval_route`
- Documente HR (șabloane și generare): `list_hr_document_templates`, `save_hr_document_template`, `generate_hr_document`, `edit_hr_document_draft`
- Onboarding angajat nou: `get_hiring_requirements`, `initialize_employee_onboarding`, `get_employee_onboarding_readiness`, `record_employee_onboarding_document`, `get_employee_onboarding_file`
- Conformitate angajat (medicina muncii, SSM, instruiri): `list_employee_compliance`, `schedule_employee_compliance`, `complete_employee_compliance`
- Modificări de detașare: `create_employment_detachment_modification`, `record_employment_detachment_modification_communication`, `cancel_employment_detachment_modification`
- Zilieri: `list_day_laborers`, `list_day_laborer_entries`, `get_day_laborer_limits`, `list_day_laborer_registries`, `register_day_laborer_day`, `cancel_day_laborer_day`, `mark_day_laborer_day_paid`, `generate_day_laborer_registry`, `mark_day_laborer_registry_submitted`, `generate_day_laborer_payment_receipt`, `generate_day_laborer_ssm_document`

## Integrări POS/Supplier — 14

- Conexiuni/config: `list_platform_connections`, `get_platform_sync_config`, `upsert_platform_sync_config`, `list_ecosystem_connections`
- Sincronizare: `trigger_platform_sync`, `list_platform_sync_logs`, `get_platform_sync_log`, `list_platform_sync_module_states`, `get_platform_sync_health`
- Stoc POS: `preview_pos_inventory_document_resync`, `apply_pos_inventory_document_resync`, `promote_pos_stock_to_cantitativ`
- Legacy/Supplier: `list_legacy_sync_schedules`, `list_supplier_legacy_sync_logs`

## Setări și automatizări — 6

- `get_company`, `update_company`
- `list_automation_rules`, `get_automation_rule`, `create_automation_rule`, `list_automation_logs`

## SQL — 4

- Read-only: `list_database_tables` → `describe_database_table` → `execute_sql_query`
- Administrativ: `execute_sql_write` (capabilitate `sql_write`, confirmare strictă, tenant fence)

## Workflow de verificare

1. `tools/list` și o citire de context (`get_company` / `get_dashboard`).
2. Tool semantic dedicat; SQL numai dacă raportul standard nu poate răspunde.
3. Preview/readiness înainte de orice efect contabil sau extern.
4. Confirmare explicită cu perioada, documentele și efectul descrise clar.
5. Scrierea exactă, o singură dată.
6. Re-citire cu `get_*`/`list_*`/raport și dovadă în răspuns.
