const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  devServer: {
    allowedHosts: 'all',
    // 🛠️ SOLUCIÓN AL ERROR DE RESIZEOBSERVER
    client: {
      overlay: {
        // Esta función decide qué errores mostrar en la pantalla (overlay)
        runtimeErrors: (error) => {
          const ignoreErrors = [
            "ResizeObserver loop completed with undelivered notifications.",
            "ResizeObserver loop limit exceeded",
          ];
          // Si el mensaje del error está en nuestra lista de ignorados, devolvemos false (no mostrar)
          if (ignoreErrors.includes(error.message)) {
            return false;
          }
          return true; // Para cualquier otro error real, mostrar el overlay
        },
      },
    },
  },

  // Configuración del plugin PWA
  pwa: {
    name: 'Agenda MW',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      exclude: [/\.map$/, /_redirects/],
    }
  },

  // Configuración para el linter
  // 💡 Sugerencia: Puedes cambiarlo a 'warning' si no quieres que los errores de 
  // variables no usadas detengan la compilación por completo.
  lintOnSave: true, 

  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = {
          ...options.compilerOptions,
          directives: {}
        }
        return options
      });
  },
  
  configureWebpack: {
    // Aquí puedes añadir configuraciones adicionales de Webpack si las necesitas
  }
})