# Vitrinova App (Expo)

Configurado para ejecutarse en consola local con **Node.js 24** y **Expo SDK 54** (compatible con Expo Go actual).

## Error reportado: `getLoadedFont is not a function`

Ese error suele aparecer cuando hay **desfase de SDK/dependencias** entre el proyecto y Expo Go.

En este repo ya se actualizó a **SDK 54** para evitar ese problema.

## 1) Requisitos

- Node.js `24.x`
- npm
- Expo Go actualizado (SDK 54)

## 2) Preparar entorno

```bash
node -v
nvm use
```

> `.nvmrc` está en `24`.

## 3) Instalación limpia recomendada

```bash
rm -rf node_modules package-lock.json
npm install
```

## 4) Verificar compatibilidad Expo

```bash
npm run doctor
npx expo install --check
```

## 5) Ejecutar

```bash
npm run start:clear
```

Luego abre:
- Expo Go (QR)
- o web con:

```bash
npm run web
```

## 6) Si persiste el error

1. Actualiza Expo Go desde la tienda.
2. Cierra Metro y reinicia con `npm run start:clear`.
3. Confirma que `expo`, `react`, `react-native` y `expo-*` estén alineados a SDK 54 (este repo ya lo deja así).
