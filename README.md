# Vitrinova App (Expo)

## Problema que reportaste

Si abres `172.23.0.2:9006` y no renderiza, es normal en muchos casos:

- `172.23.0.2` es la IP **interna** de la red Docker.
- Desde tu host debes usar el **puerto publicado** en `localhost`.

## Forma correcta de abrir en navegador

1. Levanta el contenedor:

```bash
docker compose up --build
```

2. Abre una de estas URLs en tu navegador del host:

- `http://localhost:19006`
- `http://localhost:9006`

> Ambas funcionan porque `9006` está mapeado a `19006` dentro del contenedor.

---

## Modos de ejecución en Docker

### A) Web (por defecto)

El `docker-compose.yml` ahora arranca en `EXPO_MODE=web`, ideal para validar UI rápido en navegador.

### B) Nativo (Expo Go con QR)

Si quieres volver a QR + Expo Go, cambia en `docker-compose.yml`:

```yaml
environment:
  - EXPO_MODE=native
  - EXPO_HOST=tunnel
```

Luego reinicia:

```bash
docker compose down
docker compose up --build
```

---

## Si sigue en blanco

1. Fuerza rebuild limpio:

```bash
docker compose down -v
docker compose up --build
```

2. Revisa logs del contenedor y confirma la URL que imprime Expo.
3. Prueba ambas URLs: `localhost:19006` y `localhost:9006`.

---

## Flujo de trabajo

1. Yo te paso la siguiente iteración visual.
2. Tú validas en navegador (`localhost:19006`/`9006`) o Expo Go.
3. Ajustamos estilo.
4. Luego conectamos el contrato JSON.
