import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chhapola.agriculture',
  appName: 'Chhapola',
  webDir: 'www',
  server: {
    url: 'https://chhapolaagriculture.com/',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#2e7d32',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    },
    webContentsDebuggingEnabled: false,
    overrideUserAgent: undefined,
    appendUserAgent: undefined
  },
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2e7d32'
    }
  }
};

export default config;
