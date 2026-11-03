window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
      e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
});

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import '@mdi/font/css/materialdesignicons.css'; // 🔑 Asegúrate de que esta línea exista
//import Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './registerServiceWorker'

const vuetify = createVuetify(
    {
        components,
        directives,
        theme: {
    // Tu configuración de tema...
  },
  // 🔑 DEFINICIÓN DEL SET DE ICONOS (Muy importante)
  icons: {
    defaultSet: 'mdi', // Usa MDI como set por defecto
  },
    }
)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
