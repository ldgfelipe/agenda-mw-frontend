<script setup >
import {ref, onBeforeMount, onMounted } from 'vue'

import { useUserStore } from '../stores/user.js'
import { useRouter } from 'vue-router' 
import api from '@/plugins/axios'; 
const router = useRouter()


const tab = ref('login')
const email = ref('')
const password = ref('')
const nombre = ref('')
const telefono = ref('')
const rol = ref('')
const error = ref('')
const success = ref('')
const userStore = useUserStore()

onBeforeMount(()=>{

})

onMounted(()=>{

})

//login
const login  = async () =>{
    try {
        const res = await api.post('/login',{
            email:email.value,
            password: password.value
        })  
   
            // tras login exitoso
      userStore.setSession({
        token: res.data.token,
        usuario: { email: email.value, rol: res.data.rol, nombre: res.data.nombre, id: res.data.id, accesoAdmin:res.data.accesoAdmin } // o decodificar el JWT si envías solo el token
      })
       router.push('/dashboard')

    }catch(err){
      console.log(err)
        error.value = err.response?.data?.error || 'Error en login'
        success.value = ''
    }
}
//Registro
const register = async () => {
    try{
        const res = await api.post('/register',{
            nombre: nombre.value,
            email: email.value,
            password: password.value,
            rol: rol.value,
            telefono: telefono.value || undefined
        })
        success.value = res.data.message
        error.value = ''
        tab.value = 'login' // Cambia a login después de registrarse

    }catch(err){
        error.value = err.response?.data?.error || 'Error en registro'
        success.value = ''
    }

}

</script>
<template>
  <v-container>
    <v-card class="pa-4" max-width="400">
      <v-tabs v-model="tab">
        <v-tab value="login">Login</v-tab>
        <v-tab value="register">Registro</v-tab>
      </v-tabs>

      <v-window v-model="tab">
  
        <!-- LOGIN -->
        <v-window-item value="login">
          <v-form @submit.prevent="login">
            <v-text-field v-model="email" label="Email" type="email" required />
            <v-text-field v-model="password" label="Contraseña" type="password" required />
            <v-btn type="submit" color="primary" block>Ingresar</v-btn>
          </v-form>
        </v-window-item>

        <!-- REGISTRO -->
        <v-window-item value="register">
          <v-form @submit.prevent="register">
            <v-text-field v-model="nombre" label="Nombre" required />
            <v-text-field v-model="email" label="Email" type="email" required />
            <v-text-field v-model="password" label="Contraseña" type="password" required />
         <v-select v-model="rol" :items="['medico']" label="Rol" required />
            <v-text-field v-model="telefono" label="Teléfono" type="tel" />
            <v-btn type="submit" color="success" block>Registrar</v-btn>
          </v-form>
        </v-window-item>
      </v-window>

      <v-alert v-if="error" type="error" class="mt-2">{{ error }}</v-alert>
      <v-alert v-if="success" type="success" class="mt-2">{{ success }}</v-alert>
    </v-card>
  </v-container>
</template>