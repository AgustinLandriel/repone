# Reponé

App de inventario y pedidos a proveedores para comerciantes minoristas: escaneo de códigos de barra, carga de stock, cálculo de cantidad sugerida y exportación de pedidos por WhatsApp/email.

## Estructura

- `client/` — frontend (React + Vite + TypeScript + Tailwind), responsive: vista tipo app en mobile, vista de escritorio con sidebar + tabla de pedido.
- `services/auth-service/` — negocios, usuarios y login (emite JWT).
- `services/catalog-service/` — proveedores y productos.
- `services/orders-service/` — armado y envío de pedidos (le pide datos a `catalog-service` por HTTP interno).

Arquitectura de microservicios en migración a k3s/EC2 + Terraform + GitHub Actions + ArgoCD — ver plan en `~/.claude/plans/logical-inventing-horizon.md`.

## Desarrollo

Con Docker (levanta los 4 servicios juntos):

```bash
docker compose up --build
# app en http://localhost:8080
```

Sin Docker (cada uno en su terminal, más rápido para iterar):

```bash
# backends (necesitan JWT_SECRET, cualquier string sirve en dev)
cd services/auth-service && JWT_SECRET=dev npm install && npm run dev
cd services/catalog-service && JWT_SECRET=dev npm install && npm run dev
cd services/orders-service && JWT_SECRET=dev npm install && npm run dev

# frontend (proxea /api/* a los backends de arriba)
cd client && npm install && npm run dev
```

No hay datos demo precargados — registrá un comercio nuevo desde el login.
