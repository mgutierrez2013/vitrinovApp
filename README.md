# Vitrinova App (Expo)

## ¿Cómo ver la parte visual que voy generando?

Puedes ver los cambios de UI en tiempo real con Expo.

### 1) Instalar dependencias

```bash
npm install
```

> Si `npm install` falla por políticas del entorno (por ejemplo `403 Forbidden`), ejecútalo en tu máquina local con acceso normal a npm.

### 2) Levantar el proyecto

```bash
npm run start
```

Expo abrirá un panel con QR y opciones.

### 3) Ver en dispositivo o emulador

- **Android real**
  1. Instala **Expo Go** desde Play Store.
  2. Escanea el QR mostrado por Expo.
- **iPhone real**
  1. Instala **Expo Go** desde App Store.
  2. Escanea el QR (desde cámara o app Expo Go).
- **Emulador Android**
  - Con el emulador abierto, usa:

```bash
npm run android
```

- **iOS Simulator (macOS)**

```bash
npm run ios
```

### 4) Ver en navegador (rápido para revisar layout)

```bash
npm run web
```

Esto te abre la UI en navegador para validar estructura visual y estilos.

---

## ¿Se puede correr con Docker?

Sí, se puede. Te dejé una configuración lista con `Dockerfile` y `docker-compose.yml`.

### Opción recomendada (docker compose)

```bash
docker compose up --build
```

Esto levanta Expo dentro del contenedor y expone puertos:
- `8081` (Metro)
- `19000` / `19001` / `19002` (Expo)

Luego abre en tu navegador:
- `http://localhost:19002` (Expo DevTools, si aplica según versión)

### Detener contenedor

```bash
docker compose down
```

### Notas importantes para Docker + Expo

- En algunos entornos corporativos/redes restringidas, Expo Go puede no detectar bien el QR desde contenedor.
- Si tienes problemas para conectar el teléfono físico, prueba primero con `npm run web` fuera de Docker para validar UI.
- En Linux, si quieres mejor descubrimiento en red local, puedes usar `network_mode: host` (ajuste opcional).

---

## Flujo de trabajo recomendado contigo

1. Yo te paso una versión de pantalla.
2. Tú la levantas con Expo y me compartes feedback visual.
3. Ajusto spacing, tamaños, tipografía y estados hasta dejarla igual/superior.
4. Cuando me pases el contrato JSON, conectamos datos y reglas reales.
