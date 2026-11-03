<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col cols="12">
        <h2>Solicitudes de Cancelación</h2>
      </v-col>
      <v-col cols="12" class="text-right">
        <v-btn size="small" color="primary" @click="verArchivadas = !verArchivadas; cargarSolicitudes();"><v-icon start>{{ verArchivadas ? 'mdi-archive' : 'mdi-archive-off-outline' }}</v-icon>{{ verArchivadas ? 'Activas' : 'Archivadas' }}</v-btn>
        <v-btn v-if="!verArchivadas" size="small" color="error" @click="limpiarArchivadas"><v-icon start>mdi-broom</v-icon>Limpiar +10 días</v-btn>
      </v-col>
    </v-row>
    <v-data-table
      :headers="headers"
      :items="solicitudes"
      :loading="cargando"
      class="elevation-1"
    >
      <template v-slot:item.estado="{ item }">
        <v-chip :color="item.estado === 'pendiente' ? 'red' : item.estado === 'aprobada' ? 'grey' : 'grey'" small text-color="white">
          {{ item.estado.toUpperCase() }}
        </v-chip>
      </template>
      <template v-slot:item.medicoId="{ item }">
        <span>{{ item.medicoId?.nombre || 'N/A' }}</span>
      </template>
      <template v-slot:item.consultorio="{ item }">
        <span>{{ item.cita?.consultorio?.nombre || 'N/A' }}</span>
      </template>
      <template v-slot:item.cita="{ item }">
        <span>{{ item.cita?.paciente?.nombre || 'N/A' }} - {{ item.cita?.fechaHoraInicio ? new Date(item.cita.fechaHoraInicio).toLocaleString('es-MX', { timeZone: 'UTC' }) : 'N/A' }}</span>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn v-if="item.estado === 'pendiente' || item.estado === 'revertida'" color="success" small @click="aprobar(item._id)">Aprobar</v-btn>
        <v-btn v-if="item.estado === 'pendiente' || item.estado === 'revertida'" color="error" small @click="rechazar(item._id)">Rechazar</v-btn>
        <v-btn v-if="item.estado === 'aprobada' || item.estado === 'rechazada'" color="warning" small @click="revertir(item._id)">Revertir</v-btn>
        <v-btn v-if="item.estado === 'pendiente' || item.estado === 'revertida'" color="grey" small @click="archivar(item._id)">Archivar</v-btn>
        <v-btn v-if="item.estado === 'archivada'" color="red" small @click="eliminar(item._id)">Eliminar</v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '@/plugins/axios';
import io from 'socket.io-client';

const cargando = ref(false);
const solicitudes = ref([]);
const verArchivadas = ref(false);

const conexionServer = process.env.VUE_APP_API_URL;
const socket = io(conexionServer);

const headers = [
  { text: 'Estado', value: 'estado' },
  { text: 'Consultorio', value: 'consultorio' },
  { text: 'Cita / Paciente', value: 'cita' },
  { text: 'Médico', value: 'medicoId' },
  { text: 'Motivo (médico)', value: 'motivo' },
  { text: 'Notas Admin', value: 'notasAdmin' },
  { text: 'Solicitada', value: 'createdAt' },
  { text: 'Acciones', value: 'actions', sortable: false }
];

const cargarSolicitudes = async () => {
  cargando.value = true;
  try {
    const { data } = await api.get('/citas/solicitudes', { params: { archivadas: verArchivadas.value } });
    solicitudes.value = data.data || [];
  } catch (e) {
    console.error('Error cargando solicitudes', e);
  } finally {
    cargando.value = false;
  }
};

const aprobar = async (id) => {
  if (!confirm('¿Seguro de aprobar esta cancelación?')) return;
  try {
    await api.put(`/citas/solicitudes/${id}/aprobar`);
    cargarSolicitudes();
  } catch (e) {
    alert('Error al aprobar');
  }
};

const revertir = async (id) => {
  if (!confirm('¿Revertir esta cancelación?')) return;
  try {
    await api.put(`/citas/solicitudes/${id}/revertir`, { notas: 'Revertida por administrador' });
    cargarSolicitudes();
  } catch (e) {
    alert('Error al revertir');
  }
};

const limpiarArchivadas = async () => {
  if (!confirm('¿Eliminar todas las solicitudes archivadas con más de 10 días?')) return;
  try {
    const res = await api.delete('/citas/solicitudes-limpiar');
    alert(res.data.message || 'Limpieza completada');
    cargarSolicitudes();
  } catch (e) {
    alert('Error al limpiar archivadas');
  }
};

const archivar = async (id) => {
  if (!confirm('¿Archivar esta solicitud?')) return;
  try {
    await api.put(`/citas/solicitudes/${id}/archivar`);
    cargarSolicitudes();
  } catch (e) {
    alert('Error al archivar');
  }
};

const eliminar = async (id) => {
  if (!confirm('¿Eliminar permanentemente?')) return;
  try {
    await api.delete(`/citas/solicitudes/${id}`);
    cargarSolicitudes();
  } catch (e) {
    alert('Error al eliminar');
  }
};

const rechazar = async (id) => {
  if (!confirm('¿Seguro de rechazar esta cancelación?')) return;
  try {
    await api.put(`/citas/solicitudes/${id}/rechazar`, { notas: 'Rechazada por administrador' });
    cargarSolicitudes();
  } catch (e) {
    alert('Error al rechazar');
  }
};

onMounted(() => {
  cargarSolicitudes();
  socket.on('cancelacion:solicitada', () => {
    console.log('Nueva solicitud de cancelación recibida');
    cargarSolicitudes();
  });
});

onUnmounted(() => {
  socket.off('cancelacion:solicitada');
  socket.disconnect();
});
</script>
