<template>
  <div class="admin-medicamentos">
    <div class="header-section">
      <div class="title-info">
        <h2><i class="fas fa-pills"></i> Catalogo de Medicamentos</h2>
        <p>Gestiona el inventario y tratamientos sugeridos para el recetario.</p>
      </div>
      <div class="import-export-btns">
        <button @click="vaciarBaseDeDatos" class="btn-danger-outline" title="Eliminar todos los registros">
          <i class="fas fa-trash-alt"></i> Vaciar Base
        </button>
        <button @click="exportarExcel" class="btn-export">
          <i class="fas fa-download"></i> Exportar
        </button>
        <label class="btn-import">
          <i class="fas fa-upload"></i> Importar / Actualizar
          <input type="file" @change="importarArchivo" hidden accept=".csv, .xlsx">
        </label>
      </div>
    </div>

    <div class="grid-layout">
      <section class="card form-card">
        <div class="card-header">
          <h3>{{ editando ? 'Editar' : 'Registrar' }} Medicamento</h3>
          <button v-if="editando" @click="cancelarEdicion" class="btn-cancel">Cancelar</button>
        </div>

        <div class="form-body">
          <div class="field">
            <label>Nombre del Medicamento *</label>
            <input v-model="nuevoMed.nombre" type="text" placeholder="Ej: Paracetamol 500mg">
          </div>

          <div class="field">
            <label>Descripcion / Sustancia Activa</label>
            <textarea v-model="nuevoMed.descripcion" rows="2" placeholder="Informacion relevante del farmaco"></textarea>
          </div>

          <div class="tratamientos-section">
            <label>Tratamientos Sugeridos (Dosis)</label>
            <div v-for="(t, index) in nuevoMed.tratamientos" :key="index" class="tratamiento-item">
              <div class="input-group">
                <span class="index-badge">{{ index + 1 }}</span>
                <input v-model="t.sugerencia" placeholder="Instrucciones de consumo...">
                <button @click="eliminarTratamiento(index)" class="btn-remove" title="Eliminar">&times;</button>
              </div>
            </div>
            <button @click="agregarTratamiento" class="btn-add-t">
              <i class="fas fa-plus"></i> Anadir otra opcion de dosis
            </button>
          </div>

          <button @click="guardarMedicamento" class="btn-save-main" :disabled="loading">
            <i class="fas fa-save"></i> {{ loading ? 'Guardando...' : (editando ? 'Actualizar' : 'Guardar en Catalogo') }}
          </button>
        </div>
      </section>

      <section class="card list-card">
        <div class="list-controls">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" v-model="filtro" @input="paginaActual = 1" placeholder="Buscar por nombre o descripcion...">
          </div>

          <div class="filter-group">
            <select v-model="porPagina" @change="paginaActual = 1" class="select-pagination">
              <option :value="10">10 por pag.</option>
              <option :value="20">20 por pag.</option>
              <option :value="50">50 por pag.</option>
            </select>
          </div>
          <div class="stats-badge">Total: {{ medsFiltrados.length }}</div>
        </div>

        <div class="med-table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosis Sugeridas</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="med in medsPaginados" :key="med._id">
                <td class="med-info-td">
                  <span class="med-name">{{ med.nombre }}</span>
                  <small class="med-desc">{{ med.descripcion }}</small>
                </td>
                <td>
                  <div class="treatment-chips">
                    <span v-for="(t, i) in med.tratamientos" :key="i" class="chip">
                      {{ t.sugerencia }}
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <div class="action-row">
                    <button @click="prepararEdicion(med)" class="btn-icon-edit" title="Editar">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="eliminarMedicamento(med._id)" class="btn-icon-delete" title="Eliminar">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="medsFiltrados.length === 0">
                <td colspan="3" class="empty-state">No se encontraron medicamentos.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-footer" v-if="totalPaginas > 1">
          <button @click="paginaActual--" :disabled="paginaActual === 1" class="btn-page">
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Pagina <strong>{{ paginaActual }}</strong> de {{ totalPaginas }}</span>
          <button @click="paginaActual++" :disabled="paginaActual === totalPaginas" class="btn-page">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/plugins/axios';
import * as XLSX from 'xlsx';

const filtro = ref('');
const loading = ref(false);
const editando = ref(false);
const listaMedicamentos = ref([]);
const API_URL = '/medicamentos';

const paginaActual = ref(1);
const porPagina = ref(10);

const nuevoMed = ref({
  nombre: '',
  descripcion: '',
  tratamientos: [{ sugerencia: '' }]
});

onMounted(() => {
  obtenerMedicamentos();
});

const obtenerMedicamentos = async () => {
  try {
    loading.value = true;
    const res = await api.get(API_URL);

    if (Array.isArray(res.data)) {
      listaMedicamentos.value = res.data;
    } else if (Array.isArray(res.data?.data)) {
      listaMedicamentos.value = res.data.data;
    } else {
      listaMedicamentos.value = [];
    }
  } catch (err) {
    alert('Error de conexion: ' + (err.response?.data?.mensaje || 'No se pudo cargar el catalogo'));
  } finally {
    loading.value = false;
  }
};

const guardarMedicamento = async () => {
  if (!nuevoMed.value.nombre) return alert('El nombre es obligatorio');

  loading.value = true;
  try {
    if (editando.value) {
      await api.put(`${API_URL}/${nuevoMed.value._id}`, nuevoMed.value);
    } else {
      await api.post(API_URL, nuevoMed.value);
    }
    await obtenerMedicamentos();
    cancelarEdicion();
    alert('Guardado correctamente');
  } catch (err) {
    alert(err.response?.data?.mensaje || 'Error al guardar el medicamento');
  } finally {
    loading.value = false;
  }
};

const eliminarMedicamento = async (id) => {
  if (!confirm('Seguro que desea eliminar este medicamento?')) return;
  try {
    await api.delete(`${API_URL}/${id}`);
    await obtenerMedicamentos();
  } catch (err) {
    alert('Error al eliminar');
  }
};

const vaciarBaseDeDatos = async () => {
  const confirmar1 = confirm('Estas seguro? Se eliminaran TODOS los medicamentos del sistema.');
  if (!confirmar1) return;
  const confirmar2 = confirm('Esta accion es irreversible. Realmente deseas vaciar la base de datos?');
  if (!confirmar2) return;

  try {
    loading.value = true;
    await api.delete(API_URL);
    alert('Base de datos vaciada con exito.');
    await obtenerMedicamentos();
  } catch (err) {
    alert('Error al vaciar la base de datos.');
  } finally {
    loading.value = false;
  }
};

const agregarTratamiento = () => {
  nuevoMed.value.tratamientos.push({ sugerencia: '' });
};

const eliminarTratamiento = (index) => {
  if (nuevoMed.value.tratamientos.length > 1) {
    nuevoMed.value.tratamientos.splice(index, 1);
  }
};

const prepararEdicion = (med) => {
  editando.value = true;
  nuevoMed.value = JSON.parse(JSON.stringify(med));
};

const cancelarEdicion = () => {
  editando.value = false;
  nuevoMed.value = { nombre: '', descripcion: '', tratamientos: [{ sugerencia: '' }] };
};

const importarArchivo = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const procesados = json
      .map(item => ({
        nombre: (item.Nombre || item.nombre || '').toString().trim(),
        descripcion: (item.Descripcion || item.descripcion || '').toString().trim(),
        tratamientos: (item.Tratamientos || item.tratamientos)
          ? (item.Tratamientos || item.tratamientos).toString().split('|').map(s => ({ sugerencia: s.trim() })).filter(t => t.sugerencia)
          : [{ sugerencia: (item.Tratamiento || item.tratamiento || '').toString().trim() }].filter(t => t.sugerencia)
      }))
      .filter(item => item.nombre);
    try {
      loading.value = true;
      await api.post(`${API_URL}/importar-masivo`, procesados);
      await obtenerMedicamentos();
      alert('Proceso completado correctamente.');
    } catch (err) {
      alert(err.response?.data?.mensaje || err.response?.data?.error || 'Error al importar el archivo');
    } finally {
      loading.value = false;
      event.target.value = '';
    }
  };
  reader.readAsArrayBuffer(file);
};

const exportarExcel = () => {
  const dataParaExcel = listaMedicamentos.value.map(m => ({
    Nombre: m.nombre,
    Descripcion: m.descripcion,
    Tratamientos: m.tratamientos.map(t => t.sugerencia).join(' | ')
  }));
  const ws = XLSX.utils.json_to_sheet(dataParaExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catalogo');
  XLSX.writeFile(wb, 'Medicamentos_Mediwork.xlsx');
};

const medsFiltrados = computed(() => {
  const query = filtro.value.toLowerCase();
  return listaMedicamentos.value.filter(m =>
    m.nombre.toLowerCase().includes(query) ||
    (m.descripcion && m.descripcion.toLowerCase().includes(query))
  );
});

const totalPaginas = computed(() => Math.ceil(medsFiltrados.value.length / porPagina.value));

const medsPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value;
  const fin = inicio + porPagina.value;
  return medsFiltrados.value.slice(inicio, fin);
});
</script>

<style scoped>
.admin-medicamentos { padding: 25px; background: #f4f7f9; min-height: 100vh; }
.header-section {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 25px; background: white; padding: 20px; border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.title-info h2 { margin: 0; color: #2c3e50; font-size: 1.5rem; }
.title-info p { margin: 5px 0 0; color: #7f8c8d; font-size: 0.9rem; }
.grid-layout { display: grid; grid-template-columns: 380px 1fr; gap: 25px; }
.select-pagination {
  padding: 8px; border-radius: 6px; border: 1px solid #dcdfe6; background: white; outline: none;
}
.pagination-footer {
  padding: 15px 20px; border-top: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: center; gap: 20px; background: #fafafa;
}
.btn-page {
  background: white; border: 1px solid #dcdfe6; padding: 5px 12px; border-radius: 4px; cursor: pointer; transition: 0.2s;
}
.btn-page:hover:not(:disabled) { background: #3498db; color: white; border-color: #3498db; }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }
.page-info { font-size: 0.9rem; color: #555; }
.btn-danger-outline { background: white; color: #e74c3c; border: 1px solid #e74c3c; padding: 10px 18px; border-radius: 8px; cursor: pointer; margin-right: 10px; transition: all 0.3s; }
.btn-danger-outline:hover { background: #e74c3c; color: white; }
.card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; }
.card-header { padding: 15px 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
.card-header h3 { font-size: 1.1rem; margin: 0; color: #34495e; }
.form-body { padding: 20px; }
.field { margin-bottom: 15px; }
.field label { display: block; font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 6px; }
input, textarea { width: 100%; padding: 10px; border: 1px solid #dcdfe6; border-radius: 6px; transition: border-color 0.2s; font-size: 0.9rem; }
input:focus { border-color: #3498db; outline: none; }
.input-group { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.index-badge { background: #3498db; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; flex-shrink: 0; }
.btn-remove { background: #ffeded; color: #f56c6c; border: none; font-size: 1.2rem; cursor: pointer; border-radius: 4px; padding: 0 8px; }
.btn-add-t { width: 100%; background: none; border: 1px dashed #3498db; color: #3498db; padding: 8px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-weight: 500; }
.btn-add-t:hover { background: #f0f7ff; }
.list-controls { padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
.search-box { position: relative; flex: 1; }
.search-box i { position: absolute; left: 12px; top: 35%; color: #999; }
.search-box input { padding-left: 35px; border-radius: 20px; }
.custom-table { width: 100%; border-collapse: collapse; }
.custom-table th { background: #f8f9fb; padding: 12px 20px; text-align: left; color: #7f8c8d; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
.custom-table td { padding: 15px 20px; border-bottom: 1px solid #f0f0f0; }
.med-info-td { display: flex; flex-direction: column; }
.med-name { font-weight: 600; color: #2c3e50; }
.med-desc { font-size: 0.8rem; color: #95a5a6; }
.treatment-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { background: #e8f4fd; color: #3498db; padding: 4px 10px; border-radius: 15px; font-size: 0.75rem; font-weight: 500; }
.btn-save-main { width: 100%; background: #27ae60; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 20px; }
.btn-save-main:hover { background: #219150; }
.btn-save-main:disabled { background: #95a5a6; }
.btn-export { background: #34495e; color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; margin-right: 10px; }
.btn-import { background: #8e44ad; color: white; padding: 10px 18px; border-radius: 8px; cursor: pointer; display: inline-block; }
.action-row { display: flex; gap: 10px; justify-content: center; }
.btn-icon-edit { color: #3498db; background: none; border: none; cursor: pointer; font-size: 1.1rem; }
.btn-icon-delete { color: #e74c3c; background: none; border: none; cursor: pointer; font-size: 1.1rem; }
.empty-state { text-align: center; padding: 40px; color: #95a5a6; }
</style>
