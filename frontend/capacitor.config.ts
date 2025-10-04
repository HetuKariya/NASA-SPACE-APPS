import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mycompany.myapp',
  appName: 'MyApp',
  webDir: 'build', // or 'dist' depending on your setup
  server: {
    // For development - point to your dev server
    // url: 'http://192.168.1.100:3000',
    // cleartext: true
  }
};

export default config;