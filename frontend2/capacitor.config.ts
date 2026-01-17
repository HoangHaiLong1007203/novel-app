import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novel.app',
  appName: 'Novel App',
  webDir: '.next',
  server: {
    url: 'https://10.0.2.2:3000',
    cleartext: false,
  },
};

export default config;
