// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "vue-frontend",
      // El ejecutable que se inicia.
      script: "npm", 
      // Los argumentos que se pasan al script ('npm run serve-vps')
      args: "run serve", 
      // Forzar el modo de producción (aunque ya lo hace tu script si lo usas)
      env: {
        NODE_ENV: "production",
      },
      // Definir la variable de entorno que necesitas dentro de PM2
      env_production: { 
        VUE_APP_API_URL: "https://agenda.mediwork.com.mx:4000"
      },
      watch: false, // Desactiva si es producción
    },
    // Aquí puedes añadir tu backend si usas Node.js (ejemplo)
    // {
    //   name: "node-backend",
    //   script: "server.js",
    //   env_production: {
    //     NODE_ENV: "production",
    //     PORT: 4000
    //   }
    // }
  ],
};