# 🏛️ Arsitektur Sistem — VAMOS FMS

## Gambaran Umum

VAMOS menggunakan arsitektur **Dual-App Single-Instance SPA** — dua domain aplikasi (Fleet Operations & Finance) disajikan dalam satu antarmuka tanpa page reload.

---

## Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Vue 3 SPA (index.html)                 │  │
│  │                                                           │  │
│  │  ┌─────────┐ ┌──────────────┐ ┌───────┐ ┌────────────┐  │  │
│  │  │ Booking │ │ Maintenance  │ │  P2H  │ │   V-TACS   │  │  │
│  │  └────┬────┘ └──────┬───────┘ └───┬───┘ └─────┬──────┘  │  │
│  │       └──────────────┴────────────┴────────────┘          │  │
│  │                         │                                 │  │
│  │              ┌──────────┴──────────┐                      │  │
│  │              │    Vue Router       │                      │  │
│  │              │  (Hash Mode #/)     │                      │  │
│  │              └──────────┬──────────┘                      │  │
│  │                         │                                 │  │
│  │  ┌──────────┐  ┌───────┴────────┐  ┌──────────────────┐  │  │
│  │  │  Pinia   │  │  ApiService.js │  │   localForage    │  │  │
│  │  │ (State)  │  │ (Demo / Prod)  │  │  (IndexedDB)     │  │  │
│  │  └──────────┘  └───────┬────────┘  └──────────────────┘  │  │
│  └────────────────────────┼──────────────────────────────────┘  │
│                           │                                     │
│                   google.script.run                              │
│                  .apiDispatcher(payload)                         │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                     ═══════╪═══════  (Internet / iframe boundary)
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│              GOOGLE APPS SCRIPT (V8 Engine)                     │
│                           │                                     │
│              ┌────────────┴────────────┐                        │
│              │    apiDispatcher()      │                        │
│              │   (RPC Single Entry)    │                        │
│              └─────┬──────────┬────────┘                        │
│                    │          │                                  │
│          ┌─────────┘          └─────────┐                       │
│          ▼                              ▼                       │
│  ┌───────────────┐            ┌───────────────┐                 │
│  │ Spreadsheet 1 │            │ Spreadsheet 2 │                 │
│  │ (Booking/P2H) │            │ (Maintenance/  │                │
│  │               │            │  V-TACS)       │                │
│  └───────────────┘            └───────────────┘                 │
│                                                                 │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Users_Roles   │  │ Audit_Logs  │  │     WA_Outbox        │  │
│  │  (Auth Sheet)  │  │ (Immutable) │  │ (Message Queue)      │  │
│  └────────────────┘  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alur Data (Data Flow)

### Request Lifecycle

```
1. User klik tombol di Vue
2. Vue → ApiService.js (cek mode demo/production)
3a. [Demo]  → Return mock data dari localForage/JSON statis
3b. [Prod]  → google.script.run.apiDispatcher({ action, token, data })
4. GAS Dispatcher → Middleware Auth (validasi token + role)
5. Dispatcher → Route ke fungsi handler yang sesuai
6. Handler → CRUD ke Spreadsheet yang tepat
7. GAS → Return JSend response { status, code, message, data }
8. Vue → Update Pinia state + render UI
9. Cache ke IndexedDB (localForage) jika data referensi
```

### Dual-Mode Branching

```
ApiService.js
    │
    ├── if (VITE_APP_MODE === 'demo')
    │       └── MockRepository → localForage / JSON statis
    │
    └── if (VITE_APP_MODE === 'production')
            └── GasRepository → google.script.run (Promise Wrapper)
```

---

## Build & Deployment Pipeline

```
[ src/ ]                    [ gas/ ]
    │                           │
    ▼                           │
npm run build:prod              │
    │                           │
    ▼                           │
vite-plugin-singlefile          │
    │                           │
    ▼                           ▼
[ deploy/index.html ] ◀──copy── [ gas/*.gs ]
          │
          ▼
      clasp push
    (dari /deploy)
          │
          ▼
Google Apps Script Project
          │
          ▼
   doGet(e) serves
     index.html
```
