<template>
  <img alt="MediWork logo" src="./assets/logo-mw.png" width="100px" />
 <!-- Barra de navegación De Agenda Medica-->
     <nav class="navbar" v-if="$route.fullPath !== '/adminMedicWork'"> 
      
      <div class="logo">Agenda MW</div>
      <ul class="nav-links"  >
        <li>{{ userStore.accesoAdmin }}</li>
       <li v-if="userStore.isAuth && userStore.puedeAdministrar">
        <v-btn to="/adminMedicWork" class="logout-btn" >Administrador Medico</v-btn>
      </li>
        <li><v-btn to="/" v-if="!userStore.token" class="logout-btn" >Inicio</v-btn></li>
        <li v-if="!userStore.token"><v-btn to="/LoginArea" class="logout-btn">Login</v-btn></li>
        <li v-if="userStore.token"><v-btn to="/Dashboard" class="logout-btn" >Dashboard</v-btn></li>
        <li v-if="userStore.token"><v-btn to="/perfil" class="logout-btn" >Perfil</v-btn></li>
        <li v-if="userStore.token">
          <v-btn  class="logout-btn" @click="logout" v-if="userStore.token">Logout</v-btn>
        </li>
      </ul>
    </nav>
<!----Barra de Navegacion de Administrador Medica--->

   <nav class="navbar" v-if="$route.fullPath === '/adminMedicWork'"> 
      
      <div class="logo">Agenda MW</div>
      <ul class="nav-links"  >
        <li><v-btn to="/" v-if="!userStore.token" >Inicio</v-btn></li>
        <li v-if="!userStore.token"><v-btn to="/LoginArea" class="logout-btn">Login</v-btn></li>
        <li v-if="userStore.token"><v-btn to="/Dashboard" class="logout-btn" >Agenda</v-btn></li>
        <li v-if="userStore.token"><v-btn to="/perfil" class="logout-btn" >Perfil</v-btn></li>
        <li v-if="userStore.token">
          <v-btn class="logout-btn" @click="logout" v-if="userStore.token">Logout</v-btn>
        </li>
      </ul>
    </nav>



    <!-- Contenido dinámico -->
    <main>
      <router-view />
      <v-container class="text-center">
      <v-btn v-if="isInstallable && $route.fullPath !== '/adminMedicWork'" color="primary" @click="installApp">
      Instalar Aplicación
    </v-btn>
    </v-container>
    </main>
</template>

<script setup>
import { useUserStore } from './stores/user'

import { useRouter } from 'vue-router'
import { usePwaInstall } from '@/composables/usePwaInstall'; 

// 🔑 Usa el composable
const { isInstallable, installApp } = usePwaInstall();
const userStore = useUserStore()
const route = useRouter()



const logout = () => {
  userStore.logout()
  route.push('/') // redirige al login
}
</script>
<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1976d2;
  padding: 0.8rem 1.5rem;
  color: white;
}

.logo {
  font-weight: bold;
  font-size: 1.2rem;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 1rem;
}

.nav-links a {
  color: white;
  text-decoration: none;
}

.logout-btn {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
  border-radius: 4px;
}

.logout-btn:hover {
  background: white;
  color: #1976d2;
}

/* Esto evita que el scroll aparezca y desaparezca bruscamente al abrir modales */
html {
  overflow-y: auto !important;
}

.v-overlay-scroll-blocked {
  padding-inline-end: 0 !important;
}
</style>
