# Vitrinova App (Expo)

## ¿Cómo ver la parte visual?

## Local (sin Docker)

1. Instala dependencias:

```bash
npm install
```

2. Inicia Expo:

```bash
npm run start
```

3. Abre la app:
- En teléfono: escanea el QR con **Expo Go**.
- En navegador (vista web):

```bash
npm run web
```

---

## Docker (recomendado para tu caso)

### Levantar

```bash
docker compose up --build
```

### Qué cambió para que funcione mejor

- El contenedor ahora arranca Expo en modo **`tunnel`** por defecto (`EXPO_HOST=tunnel`), que suele funcionar mejor con Expo Go cuando Docker/LAN da problemas.
- Se agregó script de arranque `docker/start-expo.sh` para controlar modo nativo/web por variables.
- Se expone también el puerto `19006` para web.

### Importante sobre `http://localhost:19002`

`19002` **no es la app renderizada**. Ese puerto es para herramientas de Expo y puede verse en blanco según versión.

Para ver la UI:
- Usa el **QR** de Expo Go (ahora en modo tunnel), o
- Ejecuta Expo Web y abre el puerto web.

### Ver la app en navegador con Docker

Cambia temporalmente a modo web en `docker-compose.yml`:

```yaml
environment:
  - EXPO_MODE=web
```

Luego levanta de nuevo:

```bash
docker compose up --build
```

Y abre:
- `http://localhost:8081` (o `http://localhost:19006`, según salida de Expo)

### Si QR aún no abre en Expo Go

1. Borra cache:

```bash
docker compose down -v
docker compose up --build
```

2. Asegura que el celular tenga internet (tunnel) y Expo Go actualizado.
3. Copia manualmente la URL `exp://...` de la consola y ábrela desde Expo Go.

---

## Flujo de trabajo

1. Yo te paso la siguiente iteración visual.
2. Tú validas desde Expo Go o Web.
3. Ajustamos estilo.
4. Luego conectamos el contrato JSON.
