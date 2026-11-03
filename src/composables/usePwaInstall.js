// src/composables/usePwaInstall.js

import { ref, onMounted } from 'vue';

const deferredPrompt = ref(null);
const isInstallable = ref(false);

const beforeInstallHandler = (e) => {
  // Previene que el prompt se muestre automáticamente
  e.preventDefault(); 
  
  // Almacena el evento
  deferredPrompt.value = e;
  isInstallable.value = true;
  
  console.log('Evento beforeinstallprompt capturado.');
};

export function usePwaInstall() {
  onMounted(() => {
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);
  });
  
  // Función para disparar la instalación al hacer clic en el botón
  const installApp = async () => {
    if (deferredPrompt.value) {
      // Muestra el prompt nativo del navegador
      deferredPrompt.value.prompt();
      
      const { outcome } = await deferredPrompt.value.userChoice;
      
      console.log(`Resultado del prompt: ${outcome}`);
      
      // El prompt ya se usó, no se puede volver a usar
      if (outcome === 'accepted') {
        isInstallable.value = false;
      }
      deferredPrompt.value = null;
    }
  };
  
  return {
    isInstallable, // true si se puede instalar
    installApp,    // función para ejecutar la instalación
  };
}