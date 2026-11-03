<template>
  <div class="expediente-view-container">
    <header class="header-paciente">
      <h2>Expediente: {{ paciente.nombre }} {{ paciente.primerApellido }}</h2>
      <p>ID: {{ paciente._id }} | DNI: {{ paciente.documento }}</p>
      <p v-if="consultaActiva" class="consulta-label">
        Consulta activa: {{ formatearFecha(consultaActiva.updatedAt || consultaActiva.createdAt) }}
      </p>
    </header>

    <nav class="med-tabs">
      <button v-for="t in tabs" :key="t.id" :class="{ active: tabActual === t.id }" @click="tabActual = t.id">
        {{ t.label }}
      </button>
    </nav>

    <div class="tab-content">
      <section v-if="tabActual === 'consulta'">
        <p v-if="cargandoConsulta">Cargando consulta activa...</p>
        <ConsultaMedica
          v-else-if="consultaActiva"
          :paciente="paciente"
          :consulta="consultaActiva"
          seccion="soap"
          @consulta-actualizada="manejarConsultaActualizada"
        />
      </section>

      <section v-if="tabActual === 'recetas'">
        <p v-if="cargandoConsulta">Cargando recetas de la consulta...</p>
        <ConsultaMedica
          v-else-if="consultaActiva"
          :paciente="paciente"
          :consulta="consultaActiva"
          seccion="recetas"
          @consulta-actualizada="manejarConsultaActualizada"
        />
      </section>

      <section v-if="tabActual === 'estudios'">
        <EstudiosView
          :consulta="consultaActiva"
          @consulta-actualizada="manejarConsultaActualizada"
        />
      </section>

      <section v-if="tabActual === 'historial'">
        <h3>Historial de Consultas</h3>
        <p v-if="cargandoHistorial">Cargando historial...</p>
        <p v-else-if="historial.length === 0">Aun no hay consultas registradas para este paciente.</p>
        <div v-else class="historial-lista">
          <article v-for="consulta in historial" :key="consulta._id" class="historial-item">
            <div class="historial-head">
              <div>
                <strong>{{ formatearFecha(consulta.fecha || consulta.createdAt) }}</strong>
                <p class="historial-subtitle">Consulta del paciente</p>
              </div>
              <span class="estado-chip">{{ consulta.estado }}</span>
            </div>
            <div class="historial-sections">
              <section class="historial-panel">
                <h4>Resumen clinico</h4>
                <p><strong>Nota:</strong> {{ consulta.nota || 'Sin nota registrada' }}</p>
                <p><strong>Detalles:</strong> {{ consulta.detallesConsulta || 'Sin detalles registrados' }}</p>
              </section>

              <section class="historial-panel" v-if="consulta.detallesSOAP">
                <h4>SOAP</h4>
                <div class="soap-block">
                  <p><strong>S:</strong> {{ consulta.detallesSOAP.subjetivo || '-' }}</p>
                  <p><strong>O:</strong> {{ consulta.detallesSOAP.objetivo || '-' }}</p>
                  <p><strong>A:</strong> {{ consulta.detallesSOAP.analisis || '-' }}</p>
                  <p><strong>P:</strong> {{ consulta.detallesSOAP.plan || '-' }}</p>
                </div>
              </section>
            </div>

            <div class="historial-columns">
              <section class="historial-panel">
                <h4>Recetas guardadas</h4>
                <div v-if="!consulta.recetasGuardadas || consulta.recetasGuardadas.length === 0" class="historial-empty">
                  No hay recetas guardadas.
                </div>
                <article v-for="receta in consulta.recetasGuardadas || []" :key="receta._id" class="receta-historial-item">
                  <div class="receta-historial-head">
                    <strong>{{ formatearFecha(receta.createdAt) }}</strong>
                    <button class="btn-print-small" @click="imprimirRecetaHistorial(consulta._id, receta._id)">Imprimir</button>
                  </div>
                  <p><strong>Nota:</strong> {{ receta.notaReceta || 'Sin nota general' }}</p>
                  <ul>
                    <li v-for="item in receta.items || []" :key="item._id || `${item.nombre}-${item.indicaciones}`">
                      {{ item.nombre }} - {{ item.indicaciones }}
                    </li>
                  </ul>
                </article>
              </section>

              <section class="historial-panel">
                <h4>Estudios</h4>
                <ul>
                  <li v-for="estudio in consulta.estudios || []" :key="estudio._id || `${estudio.nombre}-${estudio.urlResultado}`">
                    <a v-if="estudio.urlResultado" :href="resolverUrl(estudio.urlResultado)" target="_blank" rel="noopener noreferrer">
                      {{ estudio.nombre }}
                    </a>
                    <a v-else-if="estudio.enlaceExterno" :href="estudio.enlaceExterno" target="_blank" rel="noopener noreferrer">
                      {{ estudio.nombre }}
                    </a>
                    <span v-else>{{ estudio.nombre }}</span>
                  </li>
                  <li v-if="!consulta.estudios || consulta.estudios.length === 0">Sin estudios</li>
                </ul>
              </section>
            </div>
            <button
              v-if="consulta.estado === 'abierta'"
              class="btn-usar"
              @click="usarConsulta(consulta)"
            >
              Usar como consulta activa
            </button>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import api from '@/plugins/axios';
import { useExpedienteStore } from '@/stores/expediente';
import ConsultaMedica from '@/views/adminMediWork/components/controls/ConsultaMedica.vue';
import EstudiosView from '@/views/adminMediWork/components/controls/EstudiosView.vue';

const props = defineProps({
  paciente: { type: Object, required: true }
});

const expedienteStore = useExpedienteStore();

const tabActual = ref('recetas');
const tabs = [
  { id: 'recetas', label: 'Recetas' },
  { id: 'consulta', label: 'SOAP' },
  { id: 'estudios', label: 'Estudios' },
  { id: 'historial', label: 'Historial' }
];

const historial = ref([]);
const cargandoHistorial = ref(false);
const cargandoConsulta = ref(false);

const consultaActiva = computed(() => expedienteStore.consultaActiva);

const resolverUrl = (url) => {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.VUE_APP_API_URL || '').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const cargarHistorial = async () => {
  if (!props.paciente?._id) return;

  cargandoHistorial.value = true;
  try {
    const res = await api.get(`/consultas/paciente/${props.paciente._id}`);
    historial.value = res.data.data || [];
  } catch (error) {
    historial.value = [];
  } finally {
    cargandoHistorial.value = false;
  }
};

const asegurarConsultaActiva = async () => {
  if (!props.paciente?._id) return;

  cargandoConsulta.value = true;
  try {
    const activaRes = await api.get(`/consultas/paciente/${props.paciente._id}/activa`);
    let consulta = activaRes.data.data;

    if (!consulta) {
      const nuevaRes = await api.post(`/consultas/paciente/${props.paciente._id}/activa`, {});
      consulta = nuevaRes.data.data;
    }

    expedienteStore.setConsultaActiva(consulta);
  } catch (error) {
    expedienteStore.setConsultaActiva(null);
  } finally {
    cargandoConsulta.value = false;
  }
};

const manejarConsultaActualizada = async (consulta) => {
  if (consulta) {
    expedienteStore.setConsultaActiva(consulta);
  } else if (expedienteStore.consultaActivaId) {
    const res = await api.get(`/consultas/${expedienteStore.consultaActivaId}`);
    expedienteStore.setConsultaActiva(res.data.data);
  }

  await cargarHistorial();
};

const imprimirRecetaHistorial = async (consultaId, historialId) => {
  const res = await api.get(`/consultas/${consultaId}/receta-pdf?historialId=${historialId}`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => window.URL.revokeObjectURL(url), 60000);
};

const usarConsulta = async (consulta) => {
  const res = await api.get(`/consultas/${consulta._id}`);
  expedienteStore.setConsultaActiva(res.data.data);
  tabActual.value = 'consulta';
};

const formatearFecha = (fecha) => new Date(fecha).toLocaleString('es-MX', { timeZone: 'UTC' });

watch(
  () => props.paciente,
  async (paciente) => {
    expedienteStore.setExpediente(paciente);
    expedienteStore.setConsultaActiva(null);
    await asegurarConsultaActiva();
    await cargarHistorial();
  },
  { immediate: true }
);
</script>

<style scoped>
.med-tabs { display: flex; gap: 10px; border-bottom: 2px solid #ddd; margin: 20px 0; }
.med-tabs button { padding: 10px 15px; border: none; background: none; cursor: pointer; }
.med-tabs button.active { border-bottom: 3px solid #4A90E2; color: #4A90E2; font-weight: bold; }
.historial-lista { display: grid; gap: 12px; }
.historial-item { border: 1px solid #dbe6f3; border-radius: 16px; padding: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); box-shadow: 0 8px 24px rgba(36, 86, 166, 0.08); }
.historial-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.historial-subtitle { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.estado-chip { text-transform: capitalize; background: #edf4ff; color: #2456a6; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
.historial-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.historial-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.historial-panel { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
.historial-panel h4 { margin: 0 0 10px; color: #1e3a5f; }
.historial-empty { color: #64748b; font-size: 14px; }
.receta-historial-item { border-top: 1px dashed #d7e3f4; padding-top: 10px; margin-top: 10px; }
.receta-historial-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.btn-print-small { border: none; background: #2456a6; color: white; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
.consulta-label { color: #2456a6; font-weight: 600; }
.btn-usar { margin-top: 10px; border: none; background: #2456a6; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.soap-block p { margin: 4px 0; }
@media (max-width: 960px) {
  .historial-columns, .historial-sections { grid-template-columns: 1fr; }
}
</style>
