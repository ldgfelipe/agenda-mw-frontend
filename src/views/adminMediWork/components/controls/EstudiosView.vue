<template>
  <div class="estudios-container">
    <div class="card shadow-sm">
      <div class="card-header bg-green">
        <i class="fas fa-file-medical"></i> Estudios y Adjuntos
      </div>

      <div class="card-body">
        <div v-if="!consulta" class="alert-warning">
          Primero carga una consulta activa para trabajar con estudios.
        </div>

        <template v-else>
          <form class="study-form" @submit.prevent="agregarEstudio">
            <div class="grid-2">
              <div class="field">
                <label>Nombre *</label>
                <input v-model="form.nombre" type="text" required>
              </div>
              <div class="field">
                <label>Tipo *</label>
                <select v-model="form.tipo" required>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Imagen">Imagen</option>
                  <option value="PDF">PDF</option>
                  <option value="Audio">Audio</option>
                  <option value="Video">Video</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div class="field">
                <label>Prioridad</label>
                <select v-model="form.prioridad">
                  <option value="Normal">Normal</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div class="field">
                <label>Origen</label>
                <select v-model="form.origen">
                  <option value="archivo">Archivo</option>
                  <option value="link">Enlace externo</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label>Descripcion</label>
              <textarea v-model="form.descripcion" rows="3"></textarea>
            </div>

            <div class="field">
              <label>Indicaciones</label>
              <textarea v-model="form.indicaciones" rows="3"></textarea>
            </div>

            <div class="field" v-if="form.origen === 'archivo'">
              <label>Archivo</label>
              <input type="file" @change="onFileChange" accept="image/*,application/pdf,audio/*,video/*">
            </div>

            <div class="field" v-else>
              <label>Enlace externo</label>
              <input v-model="form.enlaceExterno" type="url" placeholder="https://...">
            </div>

            <div class="actions">
              <button class="btn-save" type="submit" :disabled="subiendo">
                {{ subiendo ? 'Guardando...' : 'Agregar Estudio' }}
              </button>
            </div>
          </form>

          <div class="lista-archivos">
            <div v-for="estudio in estudios" :key="estudio._id" class="estudio-item">
              <div>
                <strong>{{ estudio.nombre }}</strong>
                <p>{{ estudio.tipo }} | {{ estudio.estado }} | {{ estudio.origen }}</p>
                <p v-if="estudio.descripcion">{{ estudio.descripcion }}</p>
                <a
                  v-if="estudio.urlResultado"
                  :href="resolverUrl(estudio.urlResultado)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir archivo
                </a>
                <a
                  v-else-if="estudio.enlaceExterno"
                  :href="estudio.enlaceExterno"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir enlace
                </a>
              </div>
              <button class="btn-delete" @click="eliminarEstudio(estudio._id)">Eliminar</button>
            </div>
            <div v-if="estudios.length === 0" class="estudio-item">
              <span>No hay estudios registrados para esta consulta.</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import api from '@/plugins/axios';

const props = defineProps({
  consulta: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['consulta-actualizada']);

const archivo = ref(null);
const subiendo = ref(false);
const estudios = ref([]);
const form = ref({
  nombre: '',
  tipo: 'Laboratorio',
  prioridad: 'Normal',
  origen: 'archivo',
  descripcion: '',
  indicaciones: '',
  enlaceExterno: ''
});

const consultaId = computed(() => props.consulta?._id || null);

const resetForm = () => {
  archivo.value = null;
  form.value = {
    nombre: '',
    tipo: 'Laboratorio',
    prioridad: 'Normal',
    origen: 'archivo',
    descripcion: '',
    indicaciones: '',
    enlaceExterno: ''
  };
};

const resolverUrl = (url) => {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  const base = (process.env.VUE_APP_API_URL || '').replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const syncConsulta = (consulta) => {
  estudios.value = consulta?.estudios || [];
};

const onFileChange = (e) => {
  archivo.value = e.target.files[0] || null;
};

const agregarEstudio = async () => {
  if (!consultaId.value) return;

  const formData = new FormData();
  formData.append('nombre', form.value.nombre);
  formData.append('tipo', form.value.tipo);
  formData.append('prioridad', form.value.prioridad);
  formData.append('descripcion', form.value.descripcion);
  formData.append('indicaciones', form.value.indicaciones);

  if (form.value.origen === 'archivo') {
    if (!archivo.value) return alert('Selecciona un archivo');
    formData.append('archivo', archivo.value);
  } else {
    if (!form.value.enlaceExterno) return alert('Ingresa un enlace externo');
    formData.append('enlaceExterno', form.value.enlaceExterno);
  }

  subiendo.value = true;
  try {
    const res = await api.post(`/consultas/${consultaId.value}/estudios`, formData);
    syncConsulta(res.data.data);
    emit('consulta-actualizada', res.data.data);
    resetForm();
  } catch (error) {
    alert(error.response?.data?.message || 'No se pudo agregar el estudio');
  } finally {
    subiendo.value = false;
  }
};

const eliminarEstudio = async (estudioId) => {
  try {
    const res = await api.delete(`/consultas/${consultaId.value}/estudios/${estudioId}`);
    syncConsulta(res.data.data);
    emit('consulta-actualizada', res.data.data);
  } catch (error) {
    alert(error.response?.data?.message || 'No se pudo eliminar el estudio');
  }
};

watch(() => props.consulta, syncConsulta, { immediate: true, deep: true });
</script>

<style scoped>
.alert-warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.study-form { margin-bottom: 20px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.field input, .field textarea, .field select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.lista-archivos { display: grid; gap: 12px; }
.estudio-item { display: flex; justify-content: space-between; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: white; }
.actions { display: flex; justify-content: flex-end; }
.btn-save { background: #2456a6; color: white; border: none; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
.btn-delete { background: #b42318; color: white; border: none; padding: 10px 12px; border-radius: 6px; cursor: pointer; height: fit-content; }
</style>
