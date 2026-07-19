# HelloCarCar

HelloCarCar is an Algeria-first procurement decision assistant for buyers sourcing Chinese vehicles. The first release is a multilingual, RTL-friendly Web/PWA experience with a lightweight API adapter layer.

## Local run

Use the bundled Codex Node runtime when `node` is not on PATH:

```powershell
$node = "C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
& $node scripts\serve-static.mjs apps\web 4173
& $node apps\api\src\server.mjs
```

Open `http://127.0.0.1:4173`. The current web layer is dependency-free so it can be reviewed before the Next.js migration. API endpoints are documented in `outputs/hellocarcar_api_contract.md`.

## Product boundary

The MVP supports vehicle discovery, price evidence, masked supplier previews, report requests, manual T/T review, and PI/VIN logistics lookup. It does not sell vehicles or expose supplier identities by default.
