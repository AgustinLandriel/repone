# Reponé

App de inventario y pedidos a proveedores para comerciantes minoristas: escaneo de códigos de barra, carga de stock, cálculo de cantidad sugerida y exportación de pedidos por WhatsApp/email.

## Estructura

- `client/` — frontend (React + Vite + TypeScript + Tailwind), responsive: vista tipo app en mobile, vista de escritorio con sidebar + tabla de pedido.
- `services/auth-service/` — negocios, usuarios y login (emite JWT).
- `services/catalog-service/` — proveedores y productos.
- `services/orders-service/` — armado y envío de pedidos (le pide datos a `catalog-service` por HTTP interno).

Arquitectura de microservicios desplegada en k3s con GitHub Actions + ArgoCD. Diagrama y puertos: [`architecture.md`](architecture.md).

## CI/CD

Cada servicio tiene su workflow en `.github/workflows/` y se dispara solo cuando cambia su carpeta (`services/<servicio>/**`, o `client/**` para el frontend). También se puede lanzar a mano con `workflow_dispatch`.

1. Se autentica en AWS con OIDC (sin access keys guardadas).
2. Construye la imagen y la sube a ECR con el SHA del commit como tag.
3. Actualiza `image.tag` en el repo [`retail-inventory-gitops`](https://github.com/AgustinLandriel/retail-inventory-gitops), y ArgoCD sincroniza el cluster.

Los tags de ECR son inmutables: un build de un mismo commit no se puede repetir. Para reintentar un job que falló después del push de la imagen, usar *Re-run failed jobs* o hacer un commit nuevo.

La app se publica en `repone.landriel.site`. El frontend (nginx) es la única entrada: proxea `/api/*` a los backends por DNS interno del cluster, por lo que los backends no se exponen.

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
