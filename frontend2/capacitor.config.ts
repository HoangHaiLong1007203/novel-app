import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.novel.app',
  appName: 'Novel App',
  webDir: '.next',
  server: {
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  },
};

export default config;
