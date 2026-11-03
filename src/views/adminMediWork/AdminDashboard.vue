<template>

    <v-container>
     <v-layout>
        <v-navigation-drawer v-model="drawer" temporary>
            <v-btn @click="drawer=false" variant="plain"  ><v-icon>mdi-close</v-icon></v-btn>
            MENÚ
            <v-list>
                <v-list-item>
                    <v-btn @click="cambioseccion(Pacientes)" variant="plain"  >Pacientes</v-btn>
                </v-list-item>
                  <v-list-item v-if="esAdmin">
                
                    <v-btn @click="cambioseccion(Medicamentos)"  variant="plain"  >Medicamentos</v-btn>
                </v-list-item>
                <v-list-item>
                    <v-btn @click="cambioseccion(Expediente)" variant="plain"  >Expediente</v-btn>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
     </v-layout>   

     <v-btn class="red " @click="drawer=true"> <v-icon >mdi-menu</v-icon></v-btn>
        <component :is="componenteActual" @navegacion="nav" :params="params"></component>
    </v-container>
</template>
<script setup>
import { computed, ref,shallowRef } from 'vue'
import Pacientes from '@/views/adminMediWork/components/Pacientes.vue'
import Medicamentos from '@/views/adminMediWork/components/Medicamentos.vue'
import Expediente from '@/views/adminMediWork/components/Expediente.vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const esAdmin = computed(() => userStore.usuario?.rol === 'admin')
const drawer = ref(false)
const componenteActual = shallowRef(Pacientes)
const params=ref({})
const arraycomponents={
   Expediente,
   Medicamentos,
   Pacientes
}
const cambioseccion = (secc) => {
    componenteActual.value=secc
}
function nav(p){
    params.value=p.params
    cambioseccion(arraycomponents[p.to])
}
</script>
