# 🍳 CookMe Mobile - Nova Arquitetura 2026

## 📱 Stack Tecnológico

- **React Native 0.76+** - New Architecture (Fabric + TurboModules)
- **Expo 52** - Managed workflow
- **Expo Router v2** - File-based routing (como Next.js)
- **React Navigation v7** - Drawer + Bottom tabs
- **TypeScript** - Type-safe development
- **Axios** - HTTP client
- **Expo Secure Store** - Token storage seguro

## 🚀 Começar

1. Instalar dependências

   ```bash
   npm install
   ```

2. Configurar variáveis de ambiente

   ```bash
   echo "EXPO_PUBLIC_API_URL=http://192.168.86.9:3000/api" > .env.local
   ```

3. Iniciar app

   ```bash
   npx expo start
   ```

Pressione `i` (iOS), `a` (Android), ou `w` (Web)

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
