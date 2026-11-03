<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="8">
        <h2>Dashboard</h2>
        <p>Bienvenido, {{ user?.email }} (rol: {{ user?.rol }})</p>
      </v-col>
      <v-col cols="12" md="12" class="text-md-right">
        <v-btn v-if="isAdmin" color="primary" :to="{ name: 'admin-consultorios' }">Consultorio</v-btn>
    
        <v-btn v-if="isAdmin" color="primary" :to="{ name: 'admin-usuarios' }">Usuarios</v-btn>
        <v-btn v-if="isAdmin" color="warning" :to="{ name: 'admin-solicitudes' }">Cancelaciones ({{ solicitudesPendientes }})</v-btn>

  
  <v-btn v-if="isAdmin"  color="error" variant="tonal" @click="descargarPDF">
    <v-icon start>mdi-file-pdf-box</v-icon> PDF
  </v-btn>


      </v-col>
    </v-row>
    <v-divider />
    <v-row v-if="solicitudesPendientes > 0">
      <v-col>
        <v-alert type="warning" density="compact" prominent border>
          ⚠️ Hay <strong>{{ solicitudesPendientes }}</strong> cancelación(es) pendiente(s) por revisar. <v-btn text color="warning" :to="{ name: 'admin-solicitudes' }">Ver</v-btn>
        </v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <CalendarioCitas></CalendarioCitas>
        <!-- contenido general del dashboard -->
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useUserStore } from '../stores/user'
import CalendarioCitas from '@/components/CalendarioCitas.vue'
import api from '@/plugins/axios';

const mesActual = ref(new Date());
const store = useUserStore()
const user = computed(() => store.usuario)
const isAdmin = computed(() => store.role === 'admin' || store.role === 'administrador')
const solicitudesPendientes = ref(0);

const cargarPendientes = async () => {
    if (!isAdmin.value) {
      // Solo admin debería acceder a /citas/solicitudes
      solicitudesPendientes.value = 0;
      return;
    }
    try {
      const res = await api.get('/citas/solicitudes');
      solicitudesPendientes.value = (res.data?.data || []).filter(s => s.estado === 'pendiente').length;
    } catch (e) {
      console.error('Error cargando solicitudes', e);
      solicitudesPendientes.value = 0;
    }
  };

onMounted(async () => {
  await cargarPendientes();
  setInterval(cargarPendientes, 15000);
});

const descargarPDF = async () => {
  var mesSelect = mesActual.value.getMonth() + 1;
  var anoSelect = mesActual.value.getFullYear();

  try {
    const response = await api.get('/citas/exportar-pdf', {
      params: { year: anoSelect, month: mesSelect },
      responseType: 'blob' 
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Citas_${mesSelect}_${anoSelect}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al descargar el PDF", error);
  }
};



</script>
