# Vitrinova App (Expo)

Configurado para ejecutarse **en consola local** con **Node.js 24**.

## 1) Requisitos

- Node.js `24.x`
- npm (incluido con Node)
- (Opcional) Expo Go en teléfono Android/iOS
- (Opcional) Android Studio / Xcode para emuladores

## 2) Verificar versión de Node

```bash
node -v
```

Debe mostrar `v24.x.x`.

Si usas `nvm`:

```bash
nvm use
```

> Este proyecto incluye `.nvmrc` con versión `24`.

## 3) Instalar dependencias

```bash
npm install
```

## 4) Validar entorno Expo

```bash
npm run doctor
```

## 5) Levantar la app

### Opción A: modo desarrollo general

```bash
npm run start
```

### Opción B: limpiar caché (si algo no carga)

```bash
npm run start:clear
```

## 6) Cómo verla

- En teléfono (Expo Go): escanea el QR mostrado en consola.
- En navegador:

```bash
npm run web
```

- En emulador Android:

```bash
npm run android
```

- En simulador iOS (macOS):

```bash
npm run ios
```

## 7) Problemas comunes

### La app no abre en Expo Go

1. Ejecuta `npm run start:clear`
2. Asegura que Expo Go esté actualizado
3. Reintenta escaneo del QR

### Pantalla en blanco en Web

1. Ejecuta `npm run start:clear`
2. Revisa errores en consola de navegador
3. Reinstala dependencias:

```bash
rm -rf node_modules package-lock.json
npm install
npm run web
```

---

## Flujo de trabajo contigo

1. Yo implemento la siguiente iteración visual.
2. Tú la ejecutas en consola con Node 24.
3. Ajustamos estilos hasta que quede como necesitas.
4. Luego integramos contratos JSON.
