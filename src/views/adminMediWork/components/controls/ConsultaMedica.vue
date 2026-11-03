<template>
  <div v-if="consultaLocal" class="consulta-container">
    <div class="consulta-header shadow-sm">
      <div class="header-content">
        <i class="fas fa-notes-medical icon-title"></i>
        <div>
          <h2>Consulta Activa: <span class="text-blue">{{ nombrePaciente }}</span></h2>
          <p class="fecha-badge"><i class="far fa-calendar-alt"></i> {{ fechaConsulta }}</p>
        </div>
      </div>
      <div class="estado-badge">Estado: {{ consultaLocal.estado }}</div>
    </div>

    <section v-if="mostrarSoap" class="card signos-vitales shadow-sm mb-4">
      <div class="card-header bg-dark-blue">
        <i class="fas fa-heartbeat"></i> Signos Vitales y Somatometria
      </div>
      <div class="card-body signs-grid">
        <div class="sign-field"><label>Peso (kg)</label><input v-model="formSoap.signos.peso" type="number" step="0.1" @input="calcularIMC"></div>
        <div class="sign-field"><label>Talla (m)</label><input v-model="formSoap.signos.talla" type="number" step="0.01" @input="calcularIMC"></div>
        <div class="sign-field"><label>IMC</label><input v-model="formSoap.signos.imc" type="text" readonly tabindex="-1" class="read-only-input"></div>
        <div class="sign-field"><label>Presion Art.</label><input v-model="formSoap.signos.presion" type="text"></div>
        <div class="sign-field"><label>Temp. (C)</label><input v-model="formSoap.signos.temperatura" type="number" step="0.1"></div>
        <div class="sign-field"><label>FC (lpm)</label><input v-model="formSoap.signos.frecuencia" type="number"></div>
        <div class="sign-field"><label>Oxigeno (%)</label><input v-model="formSoap.signos.saturacion" type="number"></div>
      </div>
    </section>

    <div :class="contenedorClass">
      <section v-if="mostrarSoap" class="card nota-medica shadow-sm">
        <div class="card-header bg-blue">
          <i class="fas fa-stethoscope"></i> SOAP / Diagnostico
        </div>
        <div class="card-body">
          <div class="soap-grid">
            <textarea v-model="formSoap.detallesSOAP.subjetivo" placeholder="Subjetivo (S)"></textarea>
            <textarea v-model="formSoap.detallesSOAP.objetivo" placeholder="Objetivo (O)"></textarea>
            <textarea v-model="formSoap.detallesSOAP.analisis" placeholder="Analisis (A)"></textarea>
            <textarea v-model="formSoap.detallesSOAP.plan" placeholder="Plan (P)"></textarea>
          </div>
          <textarea
            v-model="formSoap.detallesConsulta"
            rows="4"
            class="custom-textarea"
            placeholder="Detalles de la consulta, padecimiento actual, antecedentes relevantes o evolucion..."
          ></textarea>
          <textarea v-model="formSoap.nota" rows="6" class="custom-textarea" placeholder="Nota medica o evolucion clinica..."></textarea>
          <textarea v-model="formSoap.diagnostico" rows="3" class="custom-textarea" placeholder="Diagnostico"></textarea>
          <div class="form-actions">
            <button @click="guardarSoap" class="btn-save shadow" :disabled="guardandoSoap">
              {{ guardandoSoap ? 'Guardando...' : 'Guardar SOAP' }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="mostrarRecetas" class="card recetario-medico shadow-sm">
        <div class="card-header bg-green">
          <i class="fas fa-prescription-bottle-alt"></i> Recetas Asociadas a la Consulta
        </div>

        <div class="card-body receta-grid">
          <div class="receta-notas-panel">
            <h4 class="lista-titulo">Notas de la receta</h4>
            <div class="field">
              <label>Notas de la receta</label>
              <textarea v-model="notaGeneralReceta" class="input-modern receta-notas-area" placeholder="Indicaciones generales, recomendaciones u observaciones para la receta completa..."></textarea>
            </div>
            <div class="field">
              <label>Estado de la receta</label>
              <p class="ayuda-panel">
                {{ editandoItemIndex >= 0 ? 'Estas editando un medicamento del borrador.' : 'Agrega medicamentos al borrador y luego guarda la receta completa.' }}
              </p>
            </div>
            <div class="receta-actions">
              <button type="button" @click="guardarRecetaCompleta" class="btn-add" :disabled="guardandoReceta || recetaBorrador.length === 0">
                {{ guardandoReceta ? 'Guardando...' : 'Guardar Receta' }}
              </button>
              <button type="button" @click="nuevaReceta" class="btn-cancel-receta" :disabled="guardandoReceta || imprimiendoReceta">
                Nueva Receta
              </button>
              <button v-if="editandoItemIndex >= 0" type="button" @click="cancelarEdicionMedicamento" class="btn-cancel-receta" :disabled="guardandoReceta || imprimiendoReceta">
                Cancelar Edicion
              </button>
              <button v-if="recetaGuardada" type="button" @click="imprimirRecetaGuardada" class="btn-print" :disabled="imprimiendoReceta">
                {{ imprimiendoReceta ? 'Generando PDF...' : 'Imprimir Receta' }}
              </button>
            </div>
          </div>

          <div class="medicamentos-panel">
            <h4 class="lista-titulo">Medicamentos</h4>
            <div class="med-selector">
              <div class="field search-container">
                <label><i class="fas fa-search"></i> Seleccionar Medicamento</label>
                <input type="text" v-model="busquedaMed" class="input-modern" placeholder="Ej: Paracetamol, Amoxicilina..." @input="buscarMedicamentosAPI" @focus="abrirBuscadorMedicamentos">
                <ul v-if="mostrarSugerencias && resultadosBusqueda.length > 0" class="sugerencias-list">
                  <li v-for="m in resultadosBusqueda" :key="m._id" @click="seleccionarMedicamento(m)">
                    <div class="suggest-item">
                      <strong>{{ m.nombre }}</strong>
                      <small>{{ m.descripcion }}</small>
                    </div>
                  </li>
                </ul>
              </div>

              <div class="field animate-fade" v-if="medSeleccionado">
                <label class="label-accent">Tratamientos Sugeridos</label>
                <select v-model="tratamientoSeleccionado" class="select-modern">
                  <option value="">-- Seleccione una dosis sugerida --</option>
                  <option v-for="(t, i) in medSeleccionado.tratamientos" :key="i" :value="t.sugerencia">
                    {{ t.sugerencia }}
                  </option>
                  <option value="manual">Escribir instrucciones manualmente...</option>
                </select>
                <button
                  type="button"
                  class="btn-add-inline secondary"
                  :disabled="!tratamientoSeleccionado || tratamientoSeleccionado === 'manual'"
                  @click="agregarTratamientoAConsumo"
                >
                  Agregar a Instrucciones
                </button>
              </div>

              <div class="field">
                <label>Instrucciones de consumo final</label>
                <textarea v-model="consumoMedicamento" class="input-modern" placeholder="Frecuencia, via de administracion y duracion..."></textarea>
              </div>

              <div class="field">
                <label>Nota del medicamento</label>
                <textarea v-model="notaMedicamento" class="input-modern" placeholder="Observacion especifica para este medicamento..."></textarea>
              </div>

              <button type="button" @click="agregarMedicamentoAlBorrador" class="btn-add-inline">
                {{ editandoItemIndex >= 0 ? 'Actualizar en borrador' : 'Agregar medicamento' }}
              </button>
            </div>

            <div class="receta-lista">
              <h4 class="lista-titulo">Lista de Medicamentos</h4>
              <div v-if="recetaBorrador.length === 0" class="empty-list">
                No hay medicamentos agregados aun.
              </div>
              <ul class="scroll-lista">
                <li v-for="(item, index) in recetaBorrador" :key="item._id || index" class="receta-item animate-slide">
                  <div class="med-info">
                    <span class="med-name">{{ item.nombre }}</span>
                    <span class="med-indicaciones"><strong>Consumo:</strong> {{ item.indicaciones }}</span>
                    <span v-if="item.notas" class="med-notas">{{ item.notas }}</span>
                  </div>
                  <div class="receta-item-actions">
                    <button @click="editarMedicamentoBorrador(index)" class="btn-edit" title="Editar">
                      Editar
                    </button>
                    <button @click="eliminarMedicamentoBorrador(index)" class="btn-del" title="Quitar">
                      Eliminar
                    </button>
                  </div>
                </li>
              </ul>
              <p class="ayuda-texto">Desde este listado puedes editar el consumo o eliminar cualquier medicamento antes de guardar la receta.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import api from '@/plugins/axios';

const props = defineProps({
  paciente: { type: Object, required: true },
  consulta: { type: Object, required: true },
  seccion: { type: String, default: 'completa' }
});

const emit = defineEmits(['consulta-actualizada']);
const nombrePaciente = computed(() => `${props.paciente?.nombre || ''} ${props.paciente?.primerApellido || ''}`.trim());
const fechaConsulta = computed(() => new Date(props.consulta?.updatedAt || props.consulta?.createdAt || Date.now()).toLocaleString('es-MX', { timeZone: 'UTC' }));
const mostrarSoap = computed(() => props.seccion === 'completa' || props.seccion === 'soap');
const mostrarRecetas = computed(() => props.seccion === 'completa' || props.seccion === 'recetas');
const contenedorClass = computed(() => (props.seccion === 'completa' ? 'grid-consulta' : 'single-section'));

const consultaLocal = ref(null);
const formSoap = ref({
  signos: {},
  nota: '',
  detallesConsulta: '',
  detallesSOAP: { subjetivo: '', objetivo: '', analisis: '', plan: '' },
  diagnostico: ''
});
const busquedaMed = ref('');
const consumoMedicamento = ref('');
const notaMedicamento = ref('');
const notaGeneralReceta = ref('');
const tratamientoSeleccionado = ref('');
const editandoItemIndex = ref(-1);
const recetaBorrador = ref([]);
const resultadosBusqueda = ref([]);
const catalogoMedicamentos = ref([]);
const mostrarSugerencias = ref(false);
const medSeleccionado = ref(null);
const guardandoSoap = ref(false);
const guardandoReceta = ref(false);
const imprimiendoReceta = ref(false);
const recetaGuardada = ref(false);
const recetaHistorialIdActual = ref('');
const preservarRecetaLocal = ref(false);

const normalizarMedicamentos = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.medicamentos)) return payload.medicamentos;
  return [];
};

const syncConsulta = (consulta) => {
  if (!consulta) return;
  consultaLocal.value = JSON.parse(JSON.stringify(consulta));
  if (preservarRecetaLocal.value) {
    preservarRecetaLocal.value = false;
  } else {
    recetaBorrador.value = (consulta.receta || []).map((item) => ({
      _id: item._id,
      nombre: item.nombre || '',
      indicaciones: item.indicaciones || '',
      notas: item.notas || '',
      createdAt: item.createdAt || null,
      creadoPor: item.creadoPor || null
    }));
    notaGeneralReceta.value = consulta.notaReceta || '';
    recetaGuardada.value = false;
    recetaHistorialIdActual.value = '';
  }
  formSoap.value = {
    signos: {
      peso: consulta.signos?.peso || '',
      talla: consulta.signos?.talla || '',
      imc: consulta.signos?.imc || '',
      presion: consulta.signos?.presion || '',
      frecuencia: consulta.signos?.frecuencia || '',
      temperatura: consulta.signos?.temperatura || '',
      saturacion: consulta.signos?.saturacion || ''
    },
    nota: consulta.nota || '',
    detallesConsulta: consulta.detallesConsulta || '',
    detallesSOAP: {
      subjetivo: consulta.detallesSOAP?.subjetivo || '',
      objetivo: consulta.detallesSOAP?.objetivo || '',
      analisis: consulta.detallesSOAP?.analisis || '',
      plan: consulta.detallesSOAP?.plan || ''
    },
    diagnostico: consulta.diagnostico || ''
  };
};

const calcularIMC = () => {
  if (formSoap.value.signos.peso && formSoap.value.signos.talla) {
    const p = parseFloat(formSoap.value.signos.peso);
    const t = parseFloat(formSoap.value.signos.talla);
    if (t > 0) formSoap.value.signos.imc = (p / (t * t)).toFixed(2);
  }
};

const guardarSoap = async () => {
  guardandoSoap.value = true;
  try {
    const res = await api.put(`/consultas/${consultaLocal.value._id}/soap`, formSoap.value);
    syncConsulta(res.data.data);
    emit('consulta-actualizada', res.data.data);
  } catch (error) {
    alert(error.response?.data?.message || 'No se pudo guardar el SOAP');
  } finally {
    guardandoSoap.value = false;
  }
};

const cargarCatalogoMedicamentos = async () => {
  try {
    const res = await api.get('/medicamentos');
    catalogoMedicamentos.value = normalizarMedicamentos(res.data);
  } catch (error) {
    catalogoMedicamentos.value = [];
  }
};

const aplicarFiltroMedicamentos = (termino) => {
  const texto = termino.trim().toLowerCase();
  const origen = catalogoMedicamentos.value;

  if (!texto) {
    resultadosBusqueda.value = origen.slice(0, 20);
    return;
  }

  resultadosBusqueda.value = origen
    .filter((medicamento) =>
      medicamento.nombre?.toLowerCase().includes(texto) ||
      medicamento.descripcion?.toLowerCase().includes(texto)
    )
    .slice(0, 20);
};

const buscarMedicamentosAPI = async () => {
  if (busquedaMed.value.length < 2) {
    aplicarFiltroMedicamentos(busquedaMed.value);
    return;
  }
  try {
    const res = await api.get(`/medicamentos?q=${encodeURIComponent(busquedaMed.value)}`);
    resultadosBusqueda.value = normalizarMedicamentos(res.data);
    mostrarSugerencias.value = true;
  } catch (err) {
    aplicarFiltroMedicamentos(busquedaMed.value);
  }
};

const abrirBuscadorMedicamentos = async () => {
  if (catalogoMedicamentos.value.length === 0) {
    await cargarCatalogoMedicamentos();
  }
  aplicarFiltroMedicamentos(busquedaMed.value);
  mostrarSugerencias.value = true;
};

const seleccionarMedicamento = (med) => {
  medSeleccionado.value = med;
  busquedaMed.value = med.nombre;
  mostrarSugerencias.value = false;
};

const agregarTratamientoAConsumo = () => {
  if (!tratamientoSeleccionado.value || tratamientoSeleccionado.value === 'manual') return;
  consumoMedicamento.value = tratamientoSeleccionado.value;
};

const limpiarCapturaMedicamento = () => {
  busquedaMed.value = '';
  consumoMedicamento.value = '';
  notaMedicamento.value = '';
  tratamientoSeleccionado.value = '';
  medSeleccionado.value = null;
  mostrarSugerencias.value = false;
  resultadosBusqueda.value = [];
  editandoItemIndex.value = -1;
};

const agregarMedicamentoAlBorrador = () => {
  const nombre = medSeleccionado.value ? medSeleccionado.value.nombre : busquedaMed.value.trim();
  const indicaciones = consumoMedicamento.value.trim();
  const notas = notaMedicamento.value.trim();

  if (!nombre || !indicaciones) {
    alert('Debes seleccionar un medicamento y capturar el consumo.');
    return;
  }

  const item = {
    _id: editandoItemIndex.value >= 0 ? recetaBorrador.value[editandoItemIndex.value]?._id : undefined,
    nombre,
    indicaciones,
    notas
  };

  if (editandoItemIndex.value >= 0) {
    recetaBorrador.value.splice(editandoItemIndex.value, 1, item);
  } else {
    recetaBorrador.value.push(item);
  }

  recetaGuardada.value = false;
  limpiarCapturaMedicamento();
};

const editarMedicamentoBorrador = (index) => {
  const item = recetaBorrador.value[index];
  if (!item) return;

  editandoItemIndex.value = index;
  busquedaMed.value = item.nombre || '';
  consumoMedicamento.value = item.indicaciones || '';
  notaMedicamento.value = item.notas || '';
  medSeleccionado.value = null;
  mostrarSugerencias.value = false;
};

const eliminarMedicamentoBorrador = (index) => {
  recetaBorrador.value.splice(index, 1);
  recetaGuardada.value = false;

  if (editandoItemIndex.value === index) {
    limpiarCapturaMedicamento();
  } else if (editandoItemIndex.value > index) {
    editandoItemIndex.value -= 1;
  }
};

const guardarRecetaCompleta = async () => {
  if (recetaBorrador.value.length === 0) {
    alert('Debes agregar al menos un medicamento antes de guardar la receta.');
    return;
  }

  if (editandoItemIndex.value >= 0 || busquedaMed.value.trim() || consumoMedicamento.value.trim() || notaMedicamento.value.trim()) {
    alert('Primero agrega o cancela el medicamento que estas capturando.');
    return;
  }

  guardandoReceta.value = true;
  try {
    const res = await api.put(`/consultas/${consultaLocal.value._id}/receta`, {
      notaReceta: notaGeneralReceta.value,
      receta: recetaBorrador.value
    });
    const recetasGuardadas = res.data.data?.recetasGuardadas || [];
    const ultimaReceta = recetasGuardadas[recetasGuardadas.length - 1];
    preservarRecetaLocal.value = true;
    syncConsulta(res.data.data);
    emit('consulta-actualizada', res.data.data);
    recetaGuardada.value = true;
    recetaHistorialIdActual.value = ultimaReceta?._id || '';
  } catch (error) {
    alert(error.response?.data?.message || 'No se pudo guardar la receta completa');
  } finally {
    guardandoReceta.value = false;
  }
};

const imprimirReceta = async () => {
  if (!consultaLocal.value?._id) return;

  imprimiendoReceta.value = true;
  try {
    const res = await api.get(`/consultas/${consultaLocal.value._id}/receta-pdf`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  } catch (error) {
    alert(error.response?.data?.message || 'No se pudo generar la receta PDF');
  } finally {
    imprimiendoReceta.value = false;
  }
};

const imprimirRecetaGuardada = async () => {
  if (!recetaGuardada.value) {
    alert('Debes guardar la receta antes de imprimirla.');
    return;
  }

  if (recetaBorrador.value.length === 0) {
    alert('No hay medicamentos guardados para imprimir.');
    return;
  }

  if (recetaHistorialIdActual.value) {
    imprimiendoReceta.value = true;
    try {
      const res = await api.get(`/consultas/${consultaLocal.value._id}/receta-pdf?historialId=${recetaHistorialIdActual.value}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo generar la receta PDF');
    } finally {
      imprimiendoReceta.value = false;
    }
    return;
  }

  await imprimirReceta();
};

const cancelarEdicionMedicamento = () => {
  limpiarCapturaMedicamento();
};

const nuevaReceta = () => {
  recetaBorrador.value = [];
  notaGeneralReceta.value = '';
  recetaGuardada.value = false;
  recetaHistorialIdActual.value = '';
  limpiarCapturaMedicamento();
};

watch(() => props.consulta, syncConsulta, { immediate: true, deep: true });
onMounted(cargarCatalogoMedicamentos);
</script>

<style scoped>
.consulta-container { max-width: 1200px; margin: 0 auto; padding: 20px; background: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
.consulta-header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 20px 30px; border-radius: 12px; margin-bottom: 25px; border-bottom: 3px solid #3498db; }
.header-content { display: flex; align-items: center; gap: 15px; }
.icon-title { font-size: 2.5rem; color: #3498db; }
.text-blue { color: #2980b9; font-weight: bold; }
.fecha-badge { font-size: 0.9rem; color: #7f8c8d; margin-top: 5px; }
.estado-badge { background: #edf4ff; color: #2456a6; padding: 6px 12px; border-radius: 999px; text-transform: capitalize; }
.bg-dark-blue { background: #2c3e50; }
.mb-4 { margin-bottom: 25px; }
.signs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; background: #fdfdfd; }
.sign-field { display: flex; flex-direction: column; gap: 5px; }
.sign-field label { font-size: 0.75rem; text-transform: uppercase; color: #7f8c8d; font-weight: bold; letter-spacing: 0.5px; }
.sign-field input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-weight: 600; color: #2c3e50; text-align: center; }
.read-only-input { background: #f1f5f9; border-color: #cbd5e1 !important; color: #64748b !important; }
.grid-consulta { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
.single-section { display: block; }
.card { background: white; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; height: 100%; border: 1px solid #e2e8f0; }
.card-header { padding: 12px 20px; color: white; font-weight: 600; display: flex; align-items: center; gap: 10px; }
.bg-blue { background: #3498db; }
.bg-green { background: #27ae60; }
.card-body { padding: 20px; flex-grow: 1; }
.receta-grid { display: grid; grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr); gap: 24px; align-items: start; }
.soap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
.soap-grid textarea, .custom-textarea { width: 100%; border: 1px solid #dcdfe6; border-radius: 8px; padding: 15px; resize: none; outline: none; transition: 0.3s; margin-bottom: 10px; }
.input-modern, .select-modern { width: 100%; padding: 12px; border: 1px solid #dcdfe6; border-radius: 8px; outline: none; margin-bottom: 10px; }
.receta-notas-panel, .medicamentos-panel { display: flex; flex-direction: column; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; min-height: 100%; }
.receta-notas-area { min-height: 220px; }
.receta-actions { display: grid; gap: 12px; }
.btn-add-inline { width: 100%; background: #1f7a4d; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: 600; margin-top: 8px; }
.btn-add-inline.secondary { background: #2456a6; }
.ayuda-panel { margin: 0; color: #64748b; font-size: 0.9rem; line-height: 1.5; }
.field label { display: block; margin-bottom: 6px; font-weight: 600; color: #4a5568; font-size: 0.9rem; }
.label-accent { color: #27ae60 !important; }
.search-container { position: relative; }
.sugerencias-list { position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 100; max-height: 250px; overflow-y: auto; list-style: none; padding: 0; border: 1px solid #e2e8f0; }
.sugerencias-list li { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: 0.2s; }
.sugerencias-list li:hover { background: #edf2f7; }
.suggest-item strong { display: block; color: #2d3748; }
.suggest-item small { color: #718096; font-size: 0.75rem; }
.receta-lista { margin-top: 20px; border-top: 2px dashed #e2e8f0; padding-top: 15px; }
.receta-grid .receta-lista { margin-top: 0; border-top: none; padding-top: 0; }
.lista-titulo { color: #2d3748; font-size: 1rem; margin-bottom: 10px; }
.scroll-lista { max-height: 250px; overflow-y: auto; list-style: none; padding: 0; }
.receta-item { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 12px 15px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #27ae60; }
.receta-item-actions { display: flex; align-items: center; gap: 8px; }
.med-name { font-weight: bold; color: #2c3e50; display: block; }
.med-indicaciones { font-size: 0.85rem; color: #4a5568; }
.med-notas { font-size: 0.8rem; color: #6b7280; margin-top: 4px; display: block; white-space: pre-line; }
.btn-add { width: 100%; background: #34495e; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: 600; }
.btn-cancel-receta { width: 100%; background: white; color: #475569; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: 600; }
.btn-print { width: 100%; background: #2456a6; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: 600; }
.btn-edit { color: white; border: none; background: #2456a6; font-size: 0.85rem; cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: 0.2s; }
.btn-del { color: white; border: none; background: #dc2626; font-size: 0.85rem; cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: 0.2s; }
.form-actions { display: flex; gap: 15px; justify-content: flex-end; }
.btn-save { background: #3498db; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.shadow-sm { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
.shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
.ayuda-texto { color: #6b7280; font-size: 12px; margin-top: 8px; }
@media (max-width: 960px) {
  .receta-grid { grid-template-columns: 1fr; }
}
</style>
