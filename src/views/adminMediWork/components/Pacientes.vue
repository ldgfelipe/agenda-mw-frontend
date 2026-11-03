<template>
  <div class="pacientes-container">
    <div class="tabs-header">
      <button @click="irALista" :class="{ active: tabActiva === 'lista' }">Ver Pacientes</button>
      <button @click="prepararNuevoRegistro" :class="{ active: tabActiva === 'registro' }">
        {{ modoEdicion ? 'Editar Paciente' : 'Nuevo Registro' }}
      </button>
    </div>

    <div v-if="tabActiva === 'lista'" class="tab-content">
      <div class="search-container">
        <input
          type="text"
          v-model="busqueda"
          placeholder="Buscar por nombre o apellido (minimo 3 caracteres)..."
          class="search-input"
        >
      </div>

      <table class="pacientes-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Edad</th>
            <th>Telefono</th>
            <th>Medico Titular</th>
            <th>Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="paciente in pacientesFiltrados" :key="paciente._id">
            <td>
              <strong>{{ paciente.nombre }} {{ paciente.primerApellido }}</strong>
              <div class="sub-text">{{ paciente.email }}</div>
            </td>
            <td>{{ paciente.edad || 0 }} anos</td>
            <td>{{ paciente.celular }}</td>
            <td>{{ paciente.medicoTitular }}</td>
            <td>{{ formatearFecha(paciente.fechaRegistro || paciente.createdAt) }}</td>
            <td class="acciones-cell">
              <button class="btn-action btn-view" @click="verexpediente(paciente)">Ver Expediente</button>
              <button class="btn-action btn-edit" @click="editarPaciente(paciente)">Editar</button>
            </td>
          </tr>
          <tr v-if="pacientesFiltrados.length === 0">
            <td colspan="6" class="no-results">No se encontraron pacientes que coincidan con la busqueda.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tabActiva === 'registro'" class="tab-content">
      <div class="form-toolbar">
        <h3>{{ modoEdicion ? 'Editar Perfil del Paciente' : 'Registrar Paciente' }}</h3>
        <button v-if="modoEdicion" type="button" class="btn-cancel-edit" @click="cancelarEdicion">Cancelar edicion</button>
      </div>

      <form @submit.prevent="guardarPaciente" class="form-paciente">
        <fieldset>
          <legend><i class="fas fa-user"></i> Datos del Paciente</legend>
          <div class="grid-4">
            <div class="field">
              <label>Nombre(s) *</label>
              <input v-model="form.nombre" type="text" required>
            </div>
            <div class="field">
              <label>Primer Apellido *</label>
              <input v-model="form.primerApellido" type="text" required>
            </div>
            <div class="field">
              <label>Segundo Apellido</label>
              <input v-model="form.segundoApellido" type="text">
            </div>
            <div class="field">
              <label>Fecha de Registro</label>
              <input v-model="form.fechaRegistro" type="date" readonly class="readonly">
            </div>
            <div class="field">
              <label>Fecha de Nacimiento</label>
              <input v-model="form.fechaNacimiento" type="date" @change="calcularEdad">
            </div>
            <div class="field">
              <label>Edad (Anos / Meses)</label>
              <div class="flex-row">
                <input v-model="form.edad" type="number" readonly placeholder="Anos">
                <input v-model="form.meses" type="number" readonly placeholder="Meses">
              </div>
            </div>
            <div class="field">
              <label>Sexo</label>
              <select v-model="form.sexo">
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
                <option value="No Binario">No Binario</option>
              </select>
            </div>
            <div class="field">
              <label>Tipo de Documento</label>
              <select v-model="form.tipoDocumento">
                <option>Ine</option>
                <option>Curp</option>
                <option>Licencia de Manejo</option>
              </select>
            </div>
            <div class="field">
              <label>Documento (Numero/Folio)</label>
              <input v-model="form.documento" type="text">
            </div>
            <div class="field">
              <label>Medico Titular</label>
              <input
                v-model="form.medicoTitular"
                type="text"
                list="medicos-list"
                placeholder="Nombre del medico"
                :readonly="!esAdmin"
                :class="{ readonly: !esAdmin }"
              >

              <datalist id="medicos-list" v-if="esAdmin">
                <option v-for="medico in listaMedicos" :key="medico._id" :value="medico.nombre"></option>
              </datalist>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend><i class="fas fa-map-marker-alt"></i> Direccion</legend>
          <div class="grid-4">
            <div class="field"><label>Pais</label><input v-model="form.pais" type="text"></div>
            <div class="field"><label>Nacionalidad</label><input v-model="form.nacionalidad" type="text"></div>
            <div class="field"><label>Estado</label><input v-model="form.estado" type="text"></div>
            <div class="field"><label>Municipio</label><input v-model="form.municipio" type="text"></div>
            <div class="field"><label>Localidad</label><input v-model="form.localidad" type="text"></div>
            <div class="field"><label>Colonia</label><input v-model="form.colonia" type="text"></div>
            <div class="field"><label>Calle</label><input v-model="form.calle" type="text"></div>
            <div class="field-group-mini">
              <div class="field"><label>No. Ext</label><input v-model="form.noExt" type="text"></div>
              <div class="field"><label>No. Int</label><input v-model="form.noInt" type="text"></div>
              <div class="field"><label>C.P.</label><input v-model="form.cp" type="text"></div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend><i class="fas fa-phone"></i> Contacto</legend>
          <div class="grid-4">
            <div class="field"><label>Email</label><input v-model="form.email" type="email"></div>
            <div class="field"><label>Tel. Casa</label><input v-model="form.telCasa" type="text"></div>
            <div class="field"><label>Tel. Oficina</label><input v-model="form.telOficina" type="text"></div>
            <div class="field">
              <label>Celular (Lada + Numero) *</label>
              <div class="flex-row">
                <input v-model="form.ladaCelular" type="text" placeholder="Lada" style="width: 60px">
                <input v-model="form.celular" type="text" placeholder="Celular" required>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend><i class="fas fa-info-circle"></i> Otros Datos</legend>
          <div class="grid-4">
            <div class="field"><label>Nombre Corto</label><input v-model="form.nombreCorto" type="text"></div>
            <div class="field">
              <label>Tipo de Sangre</label>
              <select v-model="form.tipoSangre">
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
                <option>O+</option>
                <option>O-</option>
              </select>
            </div>
            <div class="field"><label>Ocupacion</label><input v-model="form.ocupacion" type="text"></div>
            <div class="field"><label>Estado Civil</label><input v-model="form.estadoCivil" type="text"></div>
            <div class="field">
              <label>Idioma</label>
              <select v-model="form.idioma">
                <option>Espanol</option>
                <option>Ingles</option>
              </select>
            </div>
            <div class="field">
              <label>Origen</label>
              <select v-model="form.origen">
                <option>Recomendado por un paciente</option>
                <option>Recomendado por medico</option>
                <option>Conocido</option>
                <option>Anuncio exterior de clinica</option>
                <option>Pagina web</option>
                <option>Facebook</option>
                <option>Google</option>
                <option>Instagram</option>
              </select>
            </div>
            <div class="field"><label>Recomendado por</label><input v-model="form.recomendadoPor" type="text"></div>
            <div class="field">
              <label>Tipo de Paciente</label>
              <select v-model="form.tipoPaciente">
                <option>Particular</option>
                <option>Asegurado/Empresa</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div class="grid-2">
          <fieldset>
            <legend><i class="fas fa-exclamation-triangle"></i> Contacto de Emergencia</legend>
            <div class="field"><label>Nombre Contacto</label><input v-model="form.emergenciaNombre" type="text"></div>
            <div class="field"><label>Telefono</label><input v-model="form.emergenciaTel" type="text"></div>
            <div class="field"><label>Lugar de Atencion</label><input v-model="form.emergenciaLugar" type="text"></div>
          </fieldset>

          <fieldset>
            <legend><i class="fas fa-comment"></i> Observaciones</legend>
            <textarea v-model="form.observaciones" rows="6" placeholder="Notas adicionales..."></textarea>
          </fieldset>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save">
            {{ modoEdicion ? 'Actualizar Paciente' : 'Registrar Paciente en Mediwork' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../../plugins/axios';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const esAdmin = computed(() => userStore.usuario?.rol === 'admin');
const usuarioActualId = computed(() => userStore.userId);
const tabActiva = ref('lista');
const busqueda = ref('');
const listaPacientes = ref([]);
const listaMedicos = ref([]);
const modoEdicion = ref(false);
const pacienteEditandoId = ref(null);

const emit = defineEmits(['navegacion']);

const createEmptyForm = () => ({
  nombre: '',
  primerApellido: '',
  segundoApellido: '',
  fechaRegistro: new Date().toISOString().split('T')[0],
  fechaNacimiento: '',
  edad: 0,
  meses: 0,
  sexo: 'Hombre',
  tipoDocumento: 'Ine',
  documento: '',
  medicoTitular: esAdmin.value ? '' : (userStore.usuario?.nombre || ''),
  medicoId: esAdmin.value ? null : usuarioActualId.value,
  pais: 'Mexico',
  nacionalidad: 'Mexicana',
  estado: '',
  municipio: '',
  localidad: '',
  calle: '',
  noExt: '',
  noInt: '',
  cp: '',
  colonia: '',
  email: '',
  telCasa: '',
  telOficina: '',
  ladaCelular: '',
  celular: '',
  nombreCorto: '',
  tipoSangre: 'O+',
  ocupacion: '',
  estadoCivil: '',
  idioma: 'Espanol',
  origen: 'Pagina web',
  recomendadoPor: '',
  tipoPaciente: 'Particular',
  emergenciaNombre: '',
  emergenciaTel: '',
  emergenciaLugar: '',
  observaciones: ''
});

const form = ref(createEmptyForm());

const pacientesFiltrados = computed(() => {
  if (busqueda.value.length < 3) return listaPacientes.value;
  return listaPacientes.value.filter((p) =>
    `${p.nombre} ${p.primerApellido} ${p.segundoApellido || ''}`.toLowerCase().includes(busqueda.value.toLowerCase())
  );
});

const toInputDate = (value) => {
  if (!value) return '';
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toISOString().split('T')[0];
};

const formatearFecha = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-MX');
};

const mapPacienteToForm = (paciente) => ({
  nombre: paciente.nombre || '',
  primerApellido: paciente.primerApellido || '',
  segundoApellido: paciente.segundoApellido || '',
  fechaRegistro: toInputDate(paciente.fechaRegistro || paciente.createdAt) || new Date().toISOString().split('T')[0],
  fechaNacimiento: toInputDate(paciente.fechaNacimiento),
  edad: paciente.edad || 0,
  meses: paciente.meses || 0,
  sexo: paciente.sexo || 'Hombre',
  tipoDocumento: paciente.tipoDocumento || 'Ine',
  documento: paciente.documento || '',
  medicoTitular: paciente.medicoTitular || '',
  medicoId: paciente.medicoId?._id || paciente.medicoId || null,
  pais: paciente.direccion?.pais || 'Mexico',
  nacionalidad: paciente.direccion?.nacionalidad || 'Mexicana',
  estado: paciente.direccion?.estado || '',
  municipio: paciente.direccion?.municipio || '',
  localidad: paciente.direccion?.localidad || '',
  calle: paciente.direccion?.calle || '',
  noExt: paciente.direccion?.noExt || '',
  noInt: paciente.direccion?.noInt || '',
  cp: paciente.direccion?.cp || '',
  colonia: paciente.direccion?.colonia || '',
  email: paciente.email || '',
  telCasa: paciente.telCasa || '',
  telOficina: paciente.telOficina || '',
  ladaCelular: paciente.ladaCelular || '',
  celular: paciente.celular || '',
  nombreCorto: paciente.nombreCorto || '',
  tipoSangre: paciente.tipoSangre || 'O+',
  ocupacion: paciente.ocupacion || '',
  estadoCivil: paciente.estadoCivil || '',
  idioma: paciente.idioma || 'Espanol',
  origen: paciente.origen || 'Pagina web',
  recomendadoPor: paciente.recomendadoPor || '',
  tipoPaciente: paciente.tipoPaciente || 'Particular',
  emergenciaNombre: paciente.contactoEmergencia?.nombre || '',
  emergenciaTel: paciente.contactoEmergencia?.telefono || '',
  emergenciaLugar: paciente.contactoEmergencia?.lugarAtencion || '',
  observaciones: paciente.observaciones || ''
});

const construirPayload = () => ({
  nombre: form.value.nombre,
  primerApellido: form.value.primerApellido,
  segundoApellido: form.value.segundoApellido,
  fechaRegistro: form.value.fechaRegistro || null,
  fechaNacimiento: form.value.fechaNacimiento || null,
  edad: form.value.edad || 0,
  meses: form.value.meses || 0,
  sexo: form.value.sexo,
  tipoDocumento: form.value.tipoDocumento,
  documento: form.value.documento,
  medicoId: form.value.medicoId,
  medicoTitular: form.value.medicoTitular,
  direccion: {
    pais: form.value.pais,
    nacionalidad: form.value.nacionalidad,
    estado: form.value.estado,
    municipio: form.value.municipio,
    localidad: form.value.localidad,
    colonia: form.value.colonia,
    calle: form.value.calle,
    noExt: form.value.noExt,
    noInt: form.value.noInt,
    cp: form.value.cp
  },
  email: form.value.email,
  telCasa: form.value.telCasa,
  telOficina: form.value.telOficina,
  ladaCelular: form.value.ladaCelular,
  celular: form.value.celular,
  nombreCorto: form.value.nombreCorto,
  tipoSangre: form.value.tipoSangre,
  ocupacion: form.value.ocupacion,
  estadoCivil: form.value.estadoCivil,
  idioma: form.value.idioma,
  origen: form.value.origen,
  recomendadoPor: form.value.recomendadoPor,
  tipoPaciente: form.value.tipoPaciente,
  contactoEmergencia: {
    nombre: form.value.emergenciaNombre,
    telefono: form.value.emergenciaTel,
    lugarAtencion: form.value.emergenciaLugar
  },
  observaciones: form.value.observaciones
});

const irALista = () => {
  tabActiva.value = 'lista';
};

const prepararNuevoRegistro = () => {
  if (!modoEdicion.value) {
    tabActiva.value = 'registro';
    return;
  }
};

const resetForm = () => {
  form.value = createEmptyForm();
  modoEdicion.value = false;
  pacienteEditandoId.value = null;
};

const cancelarEdicion = () => {
  resetForm();
  tabActiva.value = 'lista';
};

const calcularEdad = () => {
  if (!form.value.fechaNacimiento) return;
  const hoy = new Date();
  const cumple = new Date(form.value.fechaNacimiento);
  let edadAnos = hoy.getFullYear() - cumple.getFullYear();
  let meses = hoy.getMonth() - cumple.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < cumple.getDate())) {
    edadAnos--;
    meses += 12;
  }
  form.value.edad = edadAnos;
  form.value.meses = meses;
};

function verexpediente(p) {
  emit('navegacion', {
    to: 'Expediente',
    params: p._id
  });
}

const editarPaciente = async (paciente) => {
  try {
    const response = await api.get(`/pacientes/${paciente._id}`);
    const pacienteCompleto = response.data?.data || paciente;
    modoEdicion.value = true;
    pacienteEditandoId.value = paciente._id;
    form.value = mapPacienteToForm(pacienteCompleto);
    tabActiva.value = 'registro';
  } catch (error) {
    alert('No se pudo cargar el perfil completo del paciente.');
  }
};

const guardarPaciente = async () => {
  try {
    if (!form.value.nombre || !form.value.primerApellido || !form.value.celular) {
      return alert('Nombre, apellido y celular son obligatorios');
    }

    if (esAdmin.value) {
      const medicoEncontrado = listaMedicos.value.find((m) => m.nombre === form.value.medicoTitular);
      if (!medicoEncontrado) {
        return alert('Debe seleccionar un medico titular valido del listado');
      }
      form.value.medicoId = medicoEncontrado._id;
    }

    const payload = construirPayload();
    const response = modoEdicion.value
      ? await api.put(`/pacientes/${pacienteEditandoId.value}`, payload)
      : await api.post('/pacientes', payload);

    if (response.data.status === 'success' || response.status === 201 || response.status === 200) {
      alert(modoEdicion.value ? 'Paciente actualizado exitosamente' : 'Paciente registrado exitosamente en Mediwork');
      resetForm();
      tabActiva.value = 'lista';
      await obtenerPacientes();
    }
  } catch (error) {
    const msg = error.response?.data?.error || error.response?.data?.message || 'Error de conexion con el servidor';
    alert(msg);
  }
};

const obtenerPacientes = async () => {
  try {
    const response = await api.get('/pacientes');
    listaPacientes.value = response.data?.data || response.data || [];
  } catch (error) {
    alert('No se pudo cargar la lista de pacientes. Revisa la conexion con el servidor.');
  }
};

const obtenerMedicos = async () => {
  try {
    const response = await api.get('/usuarios/medicos');
    listaMedicos.value = response.data?.data || [];
  } catch (error) {
    console.error('Error cargando medicos:', error);
  }
};

onMounted(() => {
  obtenerMedicos();
  obtenerPacientes();
});
</script>

<style scoped>
.pacientes-container {
  padding: 20px;
  background: #f9f9f9;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.field-group-mini {
  display: flex;
  gap: 10px;
  grid-column: span 1;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}

.flex-row {
  display: flex;
  gap: 5px;
}

.readonly {
  background: #eee;
  cursor: not-allowed;
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 25px;
  background: white;
}

legend {
  font-weight: bold;
  color: #2c3e50;
  padding: 0 10px;
  font-size: 1.1rem;
}

label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #555;
}

input,
select,
textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

textarea {
  width: 100%;
  resize: none;
}

.btn-save {
  background: #3498db;
  color: white;
  padding: 15px 40px;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  float: right;
}

.btn-save:hover {
  background: #2980b9;
}

.tabs-header {
  margin-bottom: 20px;
}

.tabs-header button {
  padding: 10px 25px;
  cursor: pointer;
  border: none;
  background: #e0e0e0;
  margin-right: 5px;
  border-radius: 5px 5px 0 0;
}

.tabs-header button.active {
  background: #3498db;
  color: white;
}

.search-container {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.pacientes-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.pacientes-table th {
  background: #34495e;
  color: white;
  padding: 12px;
  text-align: left;
}

.pacientes-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.sub-text {
  font-size: 0.75rem;
  color: #7f8c8d;
}

.acciones-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-action {
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-view {
  background: #2ecc71;
}

.btn-edit {
  background: #f39c12;
}

.btn-cancel-edit {
  background: #fff3cd;
  color: #8a6d3b;
  border: 1px solid #f1d28b;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.form-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.no-results {
  text-align: center;
  color: #7f8c8d;
  padding: 20px;
}
</style>
