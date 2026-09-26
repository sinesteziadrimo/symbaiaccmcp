---
name: conecteaza-accounting
description: Conectează sau repară accesul nominal la Symbai Accounting prin Symbai Connect și OAuth pentru Codex, Claude Code ori un client MCP compatibil; inclusiv manageri POS cu drepturi HR delegate.
---

# Conectarea la Accounting

Folosește contul propriu al persoanei și aceeași instalare Symbai Connect ca pentru POS. Accounting are propria conexiune per firmă. Nu cere tokenul contabilului, parola acestuia sau cheile aplicației REGES. Nu copia acreditările între utilizatori.

1. Verifică firma și persoana care trebuie să primească acces. Administratorul adaugă persoana în Accounting → Securitate, pe firma corectă. Un rol POS nu acordă automat acces Accounting.
2. Pentru managerul care lucrează numai prin asistent pe HR, deschide Securitate → Roluri, apasă „Adaugă: Asistent HR prin Connect” dacă rolul lipsește, apoi atribuie acest rol managerului. Alternativ activează acest drept pe un rol potrivit, cu vizualizare sau modificare; schimbarea unui rol afectează toți utilizatorii lui. Nu acorda administrarea securității pentru acest scop. Pentru contabilul care procesează certificate medicale prin această delegare, activează suplimentar payroll=edit pe rolul lui; aceasta nu este necesară managerului care doar depune actele. Dacă trebuie să lucreze și în interfața HR web, drepturile web se acordă separat, explicit.
3. Persoana se autentifică în Accounting cu propriul cont. Deschide „Asistenții mei” (/my-assistants) sau Integrări → Symbai Connect. Dacă Connect există deja, păstrează instalarea; pachetul personalizat adaugă activarea Accounting.
4. În Connect → „Firmele și accesul tău”, adaugă adresa firmei afișată în Accounting (/mcp/companies/<companyId>) și conectează Codex sau Claude Code. Contul propriu autorizează firma și permisiunile în browser. Loginul modelului, activarea Connect și accesul MCP sunt verificări distincte.
5. Reîmprospătează conexiunea/clientul numai când este necesar. Verifică tool-urile reale și get_connection_identity: product=accounting, companyId și userId corecte. Nu refolosi ID-urile POS. Pentru HR citește get_hr_workflow_guide, apoi o listă permisă, fără scrieri de probă.

Pentru ChatGPT sau alt client MCP compatibil OAuth folosește endpointul companiei și autentificarea nominală, dacă acel client oferă conectare MCP. Nu pretinde că instalarea Connect conectează automat orice client extern.

## Depanare

- Firmă absentă: verifică apartenența activă în Accounting și rolul persoanei. Pentru delegare HR este necesar hr-assistant=view/edit; pentru acces administrativ complet rămân drepturile administrative.
- Tool absent: tools/list reflectă atât consimțământul OAuth, cât și drepturile curente ale persoanei. Delegarea HR ascunde operațiile financiare, SQL, politici de aprobare și secrete. Nu schimba contul cu cel al contabilului pentru a ocoli restricția.
- 401 după retragerea rolului, dezactivarea persoanei sau a firmei este așteptat. Corectează apartenența autorizată și reautorizează; nu crea automat tokenuri manuale.
- Contul nominal poate fi suspendat sau dreptul HR poate fi retras din Securitate. Administratorul poate revoca o conexiune concretă din Integrări → administrarea avansată. Revocarea activării Connect este distinctă de revocarea accesului MCP.
- Tokenurile manuale rămân pentru integrări avansate administrate explicit. Folosește-le numai dacă utilizatorul cere acea variantă; nu le cere în chat și nu le afișa în loguri.

Nu acorda drepturi unei persoane nenominalizate. Nu testa conexiunea prin angajări, trimitere de acte la semnat sau transmitere REGES reale.
