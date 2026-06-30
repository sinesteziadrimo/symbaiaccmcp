# Catalog de capabilități MCP — Symbai Accounting (client-facing)

> Sursa de adevăr pentru tokenul curent e `tools/list` (depinde de modulele bifate). Mai jos e harta pe arii, cu numele reale ale tool-urilor uzuale. Citirea e mereu disponibilă; scrierea cere modulul corespunzător bifat pe token.

## Rapoarte & tablou de bord (citire)
- `get_dashboard` — KPI firmă (venituri, cheltuieli, profit, solduri), opțional pe interval.
- `list_invoices` / `get_invoice` — facturi de vânzare (paginat) + detalii cu linii.
- `list_bills` / `get_bills_aging` — facturi de achiziție + vechimea datoriilor (aging AP).
- `list_accounts` — planul de conturi.
- `list_journal_entries` — note contabile recente.
- `get_trial_balance`, `get_profit_loss`, `get_balance_sheet`, `get_vat_summary`, `get_financial_indicators`, `get_account_ledger`, `get_journal_register`, `get_receivables_aging` — rapoarte financiare calculate; foloseste-le inainte de SQL pentru intrebari standard.

## Facturare — vânzări (modul `facturare`)
- `list_outgoing_invoices` / `get_outgoing_invoice` — facturi pentru eFactura.
- `create_invoice` *(confirm)* — factură de vânzare nouă (postează automat în jurnal); `update_invoice` *(confirm)*, `delete_invoice` *(confirm)*.
- `list_fiscal_series` / `create_fiscal_series` — serii de numerotare.

## Cheltuieli — achiziții (modul `cheltuieli`)
- `create_bill` / `update_bill` — facturi de achiziție (AP).
- `list_incoming_invoices` / `get_incoming_invoice` — facturi primite (eFactura).
- `list_mapping_rules` / `create_mapping_rule` — reguli de mapare linii furnizor → cont/produs.

## Contabilitate / jurnal (modul `contabilitate`)
- `post_journal_entry` *(confirm)* — postează o notă contabilă (debit=credit, min 2 linii).
- `list_accounts` / `get_account` / `create_account` / `update_account` — plan de conturi.
- `get_opening_balances` / `upsert_opening_balances` *(confirm)* — solduri inițiale.

## Declarații fiscale (modul `declaratii`)
- `list_tax_declarations` / `get_tax_declaration` — tracker declarații (tip, perioadă, status, scadență).
- `create_tax_declaration` / `update_tax_declaration` — gestionează intrările de declarații.
- Generarea efectivă (D300/D394/D406/D112/CA3/UStVA...) și depunerea la ANAF se fac în aplicație; depunerea e ireversibilă.

## eFactura, documente & închidere
- `list_efactura_inbox`, `check_efactura_status`, `get_efactura_deadline` — citiri eFactura; `upload_invoice_to_efactura` cere modulul `facturare` si confirmare operationala cu utilizatorul.
- `get_incoming_invoice_lines`, `approve_incoming_invoice`, `list_fixed_assets`, `dispose_fixed_asset`, `list_compensation_orders` — documente contabile si mijloace fixe.
- `get_period_closing_readiness` — verifica daca perioada poate fi inchisa inainte de actiuni de finalizare; `post_vat_on_cash` cere modulul `contabilitate`.

## Parteneri (modul `parteneri`)
- `list_clients` / `get_client` / `create_client` — clienți (cumpărători).
- `list_suppliers` / `get_supplier` / `create_supplier` — furnizori.
- `get_client_ledger` / `get_supplier_ledger` / `get_partner_stats` — fișe + statistici (citire).
- `check_duplicate_invoice` — verifică duplicate la facturi primite.

## Stocuri & gestiune (modul `stocuri`)
- `list_warehouses` / `create_warehouse` — depozite.
- `get_warehouse_stock` — stoc pe depozit.
- `list_inventory_documents` / `get_inventory_document` / `create_inventory_document` — documente (NIR/transfer/ajustare).
- `apply_inventory_document` *(confirm)* — aplică documentul (mișcă stocul + postează jurnal).
- `list_products` / `create_product` — produse.

## Salarizare & HR (modul `salarizare`)
- `list_employees` / `get_employee` / `create_employee` / `update_employee` — angajați (salariile NU se setează prin MCP).
- `list_contracts` / `create_contract` — contracte de muncă.
- `list_payroll_runs` / `get_payroll_run` / `create_payroll_run` — state de plată.

## Bancă & casă (modul `banca`)
- `list_bank_accounts` / `create_bank_account` — conturi bancare.
- `list_bank_transactions` / `create_bank_transaction` — tranzacții bancare.
- `list_cash_registers` / `list_cash_transactions` / `create_cash_transaction` — registru de casă.
- `list_registru_incasari_plati` / `create_registru_entry` — registru încasări-plăți.

## Setări & companie (modul `setari` pentru scriere)
- `get_company` — datele firmei (secretele eFactura/Reges/SMTP sunt ascunse).
- `update_company` — actualizează date firmă (fără câmpuri-secret).
- `list_automation_rules` / `get_automation_rule` / `create_automation_rule` / `list_automation_logs` — automatizări.
- `get_company_profile` / `list_company_contacts` / `list_company_administrators` / `list_company_associates` — informații firmă (citire).

## SQL read-only (toggle `sqlRead` pe token)
- `list_database_tables` → `describe_database_table` → `execute_sql_query` este workflow-ul pentru intrebari analitice neacoperite de rapoartele dedicate.
- Interogheaza doar view-uri `mcp_v_*`, deja filtrate pe firma curenta. Doar `SELECT`/`WITH ... SELECT`; fara scriere, fara tabele brute si fara secrete.
- Foloseste SQL dupa tool-urile dedicate, cu coloane explicite si `LIMIT`. Nu incerca sa ocolesti permisiuni sau confirmari prin SQL.

## Convenții
- Tool-urile marcate *(confirm)* refuză execuția fără `confirm:true` — explică întâi, apoi reapelează cu confirmarea.
- Listele sunt plafonate (≤200 rânduri); folosește `limit`/`offset`/filtre.
- Datele sensibile (parole, tokenuri, CNP, salarii, secrete API) sunt redactate automat din răspunsuri.
