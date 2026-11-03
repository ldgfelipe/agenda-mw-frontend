<template>
  <v-container>


    <v-row class="mb-4">
      <v-col cols="12" class="text-center">
        <h2>Calendario de Citas</h2>
        <v-btn icon @click="cambiarMes(-1)">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="mx-3 text-h6 text-capitalize">
          {{ mesActual.toLocaleString('es', { month: 'long', year: 'numeric' }) }}
        </span>
        <v-btn icon @click="cambiarMes(1)">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="12" v-if="rol === 'admin'">
        <v-btn @click="descargarPDF"><v-icon>mdi-file-pdf-box</v-icon></v-btn>
      </v-col>
    </v-row>


   <v-row dense class="text-center font-weight-bold mb-1">
      <v-col v-for="day in diasSemana" :key="day" class="dias-header">
        <span class="d-none d-sm-inline">{{ day }}</span>
        <span class="d-inline d-sm-none text-caption">{{ day.charAt(0) }}</span>
      </v-col>
    </v-row>

    <v-row dense>
      <v-col v-for="(dia, index) in diasDelMes" :key="index" class="pa-1 calendar-col">
        <v-sheet v-if="dia.fecha" 
          :class="[
            'pa-1 pa-sm-2', 'text-center', 'cursor-pointer', 'border', 'rounded', 'dia-sheet',
            diasBloqueados.includes(dia.fechaIso) ? 'bg-grey-lighten-2 text-grey' : ''
          ]" 
          @click="diasBloqueados.includes(dia.fechaIso) && rol !== 'admin' ? null : mostrarDetalle(dia.fecha)"
          :elevation="dia.esHoy ? 4 : 0"
          :color="dia.esHoy ? 'blue-grey-lighten-4' : (diasBloqueados.includes(dia.fechaIso) ? 'grey-lighten-3' : 'white')">

          <div class="d-flex justify-space-between align-start mb-1">
            <div class="font-weight-black text-body-2 text-sm-h6">{{ dia.fecha.getDate() }}</div>
            <v-btn v-if="rol === 'admin'" icon size="x-small" variant="text"
              :color="diasBloqueados.includes(dia.fechaIso) ? 'error' : 'grey'"
              @click.stop="toggleBloqueoDia(dia.fechaIso)" class="mt-n1 me-n1">
              <v-icon size="14">{{ diasBloqueados.includes(dia.fechaIso) ? 'mdi-lock' : 'mdi-lock-open-outline' }}</v-icon>
            </v-btn>
          </div>

          <div v-if="!diasBloqueados.includes(dia.fechaIso)" class="disponibilidad-info">
            <div v-if="disponibilidad[dia.fechaIso]" class="d-flex flex-column flex-sm-row justify-center align-center">
              <span class="text-error font-weight-bold text-mini">O{{ disponibilidad[dia.fechaIso].ocupados }}</span>
              <span class="d-none d-sm-inline mx-1">/</span>
              <span class="text-success font-weight-bold text-mini">D{{ disponibilidad[dia.fechaIso].disponibles }}</span>
            </div>
            <div v-else class="text-grey-darken-1 text-mini">
              D{{ (consultorioFiltro ? 1 : totalConsultorios) * 11 }}
            </div>
          </div>
          
          <div v-else class="text-mini text-error font-weight-bold d-none d-sm-block">BLOQUEO</div>
        </v-sheet>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="900px" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-card-title class="d-flex align-center text-h5 bg-primary text-white">
          <v-icon start>mdi-calendar-clock</v-icon>


          <v-menu :close-on-content-click="false" location="bottom">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" variant="tonal" color="white" class="text-capitalize">
                {{ diaSeleccionado.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) }}
                <v-icon end>mdi-calendar-edit</v-icon>
              </v-btn>
            </template>

            <v-date-picker v-model="diaSeleccionado" color="primary" hide-header
              @update:model-value="cambiarFechaInterna"></v-date-picker>
          </v-menu>


          <v-spacer></v-spacer>

          <v-row class="mb-4" justify="center">
            <v-col cols="12">
              <v-select v-model="consultorioFiltro" :items="consultoriosActivos" item-title="nombre" item-value="_id"
                label="Filtrar por Consultorio" prepend-inner-icon="mdi-hospital-building" variant="outlined"
                density="comfortable" clearable hide-details @update:model-value="alCambiarFiltro">
                <template v-slot:prepend-item>
                  <v-list-item title="Todos los consultorios" @click="consultorioFiltro = null; alCambiarFiltro()">
                  </v-list-item>
                  <v-divider class="mb-2"></v-divider>
                </template>
              </v-select>
            </v-col>
          </v-row>
          <v-btn icon color="white" variant="text" @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text>
          <v-alert v-if="detalleError" type="error" class="mb-3">{{ detalleError }}</v-alert>
          <v-progress-linear v-if="cargandoDetalle" indeterminate color="primary"></v-progress-linear>
          <v-text-field v-model="busqueda" label="busqueda en tabla"></v-text-field>


          <v-data-table :search="busqueda" :custom-filter="filtrarHorarios" :headers="horarioHeaders"
            :items="horariosDetalle" density="compact" :items-per-page="-1" hide-default-footer>


            <template v-for="cons in consultoriosActivos" :key="cons._id" #[`item.${cons._id}`]="{ item }">
              <div v-if="!consultorioFiltro || consultorioFiltro === cons._id">

                <template v-if="item[cons._id]?.cita">
                  <v-card v-if="item[cons._id].cita.medicoId === usuarioId || rol === 'admin'"
                    :color="item[cons._id].cita.estado === 'pendiente' ? 'yellow-lighten-2' : item[cons._id].cita.estado === 'confirmada' ? 'green-lighten-2' : 'pink-lighten-2'"
                    class="ma-1 elevation-2" @click="verDetalles(item[cons._id].cita)" hover>
                    <v-card-text class="pa-2 text-caption">
                      <div class="d-flex align-center">
                        <v-icon size="x-small" class="me-1">
                          {{ item[cons._id].cita.estado === 'pendiente' ? 'mdi-clock-outline' : 'mdi-check-circle' }}
                        </v-icon>
                        <strong>{{ item[cons._id].cita.estado.toUpperCase() }}</strong>
                        <v-chip v-if="solicitudesEstado[item[cons._id].cita._id] && (solicitudesEstado[item[cons._id].cita._id].estado === 'rechazada' || solicitudesEstado[item[cons._id].cita._id].estado === 'revertida')" color="red" size="x-small" class="ml-1" text-color="white">{{ solicitudesEstado[item[cons._id].cita._id].estado.toUpperCase() }}</v-chip>
                      </div>
                      <div v-if="rol === 'admin'" class="mt-1">
                        <v-alert v-if="item[cons._id].cita.tipo === 'x-hora'" color="green-lighten-4">
                          <v-icon>mdi-wallet</v-icon> por Hora
                          <hr />
                        </v-alert>
                        P: {{ item[cons._id].cita.pacienteNombre }}<br />
                        M: {{ item[cons._id].cita.nombreMedico }}
                      </div>
                      <div v-if="solicitudesEstado[item[cons._id].cita._id] && solicitudesEstado[item[cons._id].cita._id].notas" class="text-caption text-grey-darken-1 mt-1">Nota: {{ solicitudesEstado[item[cons._id].cita._id].notas }}</div>
                    </v-card-text>
                  </v-card>

                  <v-btn v-else size="x-small" color="grey-lighten-2" class="ma-1" disabled block>
                    Ocupado
                  </v-btn>
                </template>

                <v-btn v-else variant="outlined" size="small" color="primary" class="ma-1" block
                  @click="reservar(cons._id, item.hora)" :disabled="cargandoDetalle">
                  Reservar
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogReserva" max-width="500px">
      <CitaFormulario v-if="dialogReserva" :reserva-inicial="reservaData" @cerrar="cerrarDialogoReserva"
        @cita-guardada="cerrarDialogoReserva(true)" />
    </v-dialog>

    <v-dialog v-model="dialogDetalles" max-width="500px">
      <CitaDetalles v-if="dialogDetalles" :cita-data="citaSeleccionada" @cerrar="dialogDetalles = false"
        @cita-modificada="handleCitaModificada" @cita-cancelada="handleCitaCancelada" />
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import api from '@/plugins/axios';
import CitaFormulario from '@/components/CitaFormulario.vue';
import CitaDetalles from '@/components/CitaDetalles.vue';
import { useUserStore } from '../stores/user.js';
import io from 'socket.io-client';
const diasBloqueados = ref([]); // Lista de strings "YYYY-MM-DD"
// 1. ESTADO Y CONFIGURACIÓN
const userStore = useUserStore();
const usuarioId = computed(() => userStore.usuario?.id);
const rol = computed(() => userStore.usuario?.rol || null);
const mesActual = ref(new Date());
const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const totalConsultorios = ref(0);
const disponibilidad = ref({});
const consultorioFiltro = ref(null); // 🔑 Filtro seleccionado
const consultoriosActivos = ref([]);
const busqueda = ref('');
const dialog = ref(false);
const diaSeleccionado = ref(new Date());
const horariosDetalle = ref([]);
const cargandoDetalle = ref(false);
const detalleError = ref('');

const dialogDetalles = ref(false);
const citaSeleccionada = ref(null);
const citasDelDia = ref([]);
const dialogReserva = ref(false);
const solicitudesEstado = ref({}); // Mapa citaId -> { estado, notas, solicitudId }

const horasDisponibles = Array.from({ length: 11 }, (_, i) => `${9 + i}:00`);
const conexionServer = process.env.VUE_APP_API_URL || 'http://localhost:4001';
const socket = io(conexionServer);

// 2. LÓGICA DE CARGA Y FILTROS

const alCambiarFiltro = () => {
  cargarDisponibilidad();
  if (dialog.value) {
    cargarDetalleHorario(diaSeleccionado.value);
  }
};

const cargarConsultorios = async () => {
  try {
    const { data } = await api.get('/consultorios?estado=activo');
    // 🔑 Ordenamiento Alfanumérico (Natural Sort)
    consultoriosActivos.value = data.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, undefined, { numeric: true, sensitivity: 'base' })
    );
  } catch (err) {
    console.error("Error al cargar consultorios:", err);
  }
};

const cargarDisponibilidad = async () => {
  const year = mesActual.value.getFullYear();
  const month = mesActual.value.getMonth() + 1;
  const params = { year, month };

  // 🔑 Enviar filtro si existe
  if (consultorioFiltro.value) {
    params.consultorioId = consultorioFiltro.value;
  }

  try {
    const { data } = await api.get('/citas/disponibilidad', { params });
    totalConsultorios.value = data.totalConsultorios;
    disponibilidad.value = data.disponibilidad;
  } catch (err) {
    console.error("Error disponibilidad:", err);
    disponibilidad.value = {};
  }
};
const cargarCitasRegistradas = async (fecha) => {
  const fechaISO = fecha.toISOString().split('T')[0];
  try {
    const response = await api.get(`/citas/dia`, {
      params: { fecha: fechaISO }
    });

    citasDelDia.value = response.data.map(cita => {
      // --- CORRECCIÓN CLAVE: MANEJO CORRECTO DE FECHA ISO ---
      const fechaStringRaw = cita.fechaHoraInicio;
      // La fecha viene como "2026-10-31T11:00:00.000Z" (UTC)
      // Para convertir a hora local (ej: -06:00), usamos new Date(fechaStringRaw) directamente
      const fechaParaCalendario = new Date(fechaStringRaw);

      return {
        _id: cita._id,
        consultorioId: cita.consultorio?._id ?? 'N/A',
        medicoId: cita.medico.id,
        fechaHoraInicio: fechaParaCalendario, // <--- Date object con timezone correcta
        estado: cita.estado,
        nombreConsultorio: cita.consultorio?.nombre ?? 'N/A',
        nombreMedico: cita.medico.nombre,
        tipo: cita.medico.tipo,
        pacienteNombre: cita.paciente.nombre,
        pacienteNotas: cita.paciente.notas,
        pacienteCorreo: cita.paciente.correo,
        pacienteTelefono: cita.paciente.telefono,
        costoConsulta: cita.costo,
      };
    });

    // Para depurar, ahora verás que la hora coincide con la de la base de datos
    console.log("Primera cita procesada:", citasDelDia.value[0]?.fechaHoraInicio.toString());

  } catch (error) {
    console.error("Error cargar citas:", error);
  }
};


// Función para buscar en campos anidados (paciente o médico)
const filtrarHorarios = (value, query, item) => {
  if (!query) return true;

  const s = query.toLowerCase();

  // 1. Buscar en la hora
  if (item.raw.hora.toLowerCase().includes(s)) return true;

  // 2. Buscar dentro de cada consultorio de la fila
  return consultoriosActivos.value.some(cons => {
    const cita = item.raw[cons._id]?.cita;
    if (!cita) return false;

    return (
      cita.pacienteNombre?.toLowerCase().includes(s) ||
      cita.nombreMedico?.toLowerCase().includes(s) ||
      cita.estado?.toLowerCase().includes(s)
    );
  });
};


const cargarDetalleHorario = async (fecha) => {
  detalleError.value = '';
  cargandoDetalle.value = true;

  if (!consultoriosActivos.value.length) await cargarConsultorios();
  await cargarCitasRegistradas(fecha);

  const citasMap = citasDelDia.value.reduce((map, cita) => {
    const hora = cita.fechaHoraInicio.getUTCHours();
    if (!map[hora]) map[hora] = {};
    map[hora][cita.consultorioId] = cita;
    return map;
  }, {});

  horariosDetalle.value = horasDisponibles.map(horaStr => {
    const horaNum = parseInt(horaStr.split(':')[0]);
    let row = { hora: horaStr };
    consultoriosActivos.value.forEach(cons => {
      const cita = citasMap[horaNum]?.[cons._id];
      row[cons._id] = { cita: cita || null };
    });
    return row;
  });
  cargandoDetalle.value = false;
};

// 3. PROPIEDADES COMPUTADAS

const horarioHeaders = computed(() => {
  let headers = [{ title: 'Hora', value: 'hora', sortable: false, width: '100px' }];

  // 🔑 Filtrar cabeceras según consultorio seleccionado
  const consultoriosVisibles = consultorioFiltro.value
    ? consultoriosActivos.value.filter(c => c._id === consultorioFiltro.value)
    : consultoriosActivos.value;

  consultoriosVisibles.forEach(cons => {
    headers.push({ title: cons.nombre, value: cons._id, sortable: false, align: 'center' });
  });
  return headers;
});

// Función para cambiar de fecha sin cerrar el modal
const cambiarFechaInterna = async (nuevaFecha) => {
  if (!nuevaFecha) return;

  // Actualizamos la referencia del día seleccionado
  diaSeleccionado.value = new Date(nuevaFecha);

  // Recargamos los datos de la tabla para esa nueva fecha
  await cargarDetalleHorario(diaSeleccionado.value);

  // Opcional: Si quieres que el calendario principal de fondo también se sincronice
  mesActual.value = new Date(nuevaFecha);
};

const diasDelMes = computed(() => {
  const year = mesActual.value.getFullYear();
  const month = mesActual.value.getMonth();
  const dias = [];
  const primerDia = new Date(year, month, 1).getDay();
  for (let i = 0; i < primerDia; i++) dias.push({ fecha: null });

  const ultimoDia = new Date(year, month + 1, 0).getDate();
  const hoy = new Date();

  for (let i = 1; i <= ultimoDia; i++) {
    const fecha = new Date(year, month, i);
    dias.push({
      fecha,
      fechaIso: fecha.toISOString().substring(0, 10),
      esHoy: fecha.toDateString() === hoy.toDateString()
    });
  }
  return dias;
});

// 4. ACCIONES Y SOCKETS

const cambiarMes = (delta) => {
  mesActual.value = new Date(mesActual.value.setMonth(mesActual.value.getMonth() + delta));
};

const manejarBloqueoDia = (data) => {
  console.log("Actualización de bloqueo recibida:", data);
  // Refrescamos los datos para que el calendario se pinte correctamente
  cargarDiasBloqueados();
  cargarDisponibilidad();
};

const mostrarDetalle = async (fecha) => {
  diaSeleccionado.value = fecha;
  await cargarDetalleHorario(fecha);
  dialog.value = true;
};

const manejarActualizacionCita = (data) => {
  cargarDisponibilidad();
  if (dialog.value && diaSeleccionado.value.toISOString().substring(0, 10) === data.fechaISO) {
    cargarDetalleHorario(diaSeleccionado.value);
  }
};

// ... (Resto de funciones: reservar, verDetalles, handleCitaModificada, etc. se mantienen igual) ...

const reservaData = ref({});
const reservar = (consultorioId, hora) => {

  const fechaIso = diaSeleccionado.value.toISOString().substring(0, 10);
  if (diasBloqueados.value.includes(fechaIso) && rol.value !== 'admin') {
    alert("Este día ha sido bloqueado por el administrador.");
    return;
  }

  
  const consultorio = consultoriosActivos.value.find(c => c._id === consultorioId);
  const [horaNum] = hora.split(':');
  const fechaHora = new Date(diaSeleccionado.value);
  fechaHora.setHours(parseInt(horaNum), 0, 0, 0);

  reservaData.value = {
    consultorioId,
    nombreConsultorio: consultorio?.nombre,
    fechaHoraInicio: fechaHora,
    medicoId: userStore.usuario?.id,
    nombreMedico: userStore.usuario?.nombre,
    estado: 'pendiente'
  };
  dialogReserva.value = true;
};

const verDetalles = (cita) => {
  citaSeleccionada.value = cita;
  dialogDetalles.value = true;
};

const descargarPDF = async () => {
  var mesSelect = mesActual.value.getMonth() + 1;
  var anoSelect = mesActual.value.getFullYear();

  try {
    const mesActual = mesSelect; // O el mes que tengas seleccionado en tu calendario
    const anioActual = anoSelect;

    const response = await api.get('/citas/exportar-pdf', {
      params: { year: anioActual, month: mesActual },
      responseType: 'blob' // 👈 Muy importante para archivos
    });

    // Crear un link invisible para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Citas_${mesActual}_${anioActual}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al descargar el PDF", error);
  }
};

const cargarDiasBloqueados = async () => {
  const year = mesActual.value.getFullYear();
  const month = mesActual.value.getMonth() + 1;
  try {
    const { data } = await api.get('/citas/bloqueados', { params: { year, month } });
    diasBloqueados.value = data;
  } catch (err) {
    console.error("Error al cargar bloqueos:", err);
  }
};

const toggleBloqueoDia = async (fechaIso) => {
  if (rol.value !== 'admin') return;
  try {
    await api.post('/citas/bloqueados/toggle', { fechaIso });
    await cargarDiasBloqueados();
    await cargarDisponibilidad(); // Refrescar para ver cambios
  } catch (err) {
    alert("Error al cambiar estado del día");
  }
};


const cerrarDialogoReserva = () => { dialogReserva.value = false; };
const handleCitaModificada = () => { dialogDetalles.value = false; };
const handleCitaCancelada = () => { dialogDetalles.value = false; };

onMounted(() => {
  cargarConsultorios();
  cargarDisponibilidad();
  cargarDiasBloqueados();
  socket.on('cita:actualizada', manejarActualizacionCita);
  socket.on('dia:bloqueoActualizado', manejarBloqueoDia);
  socket.on('cancelacion:resuelta', (data) => {
    if (data && data.solicitudId) {
      solicitudesEstado.value[data.solicitudId] = {
        estado: data.estado,
        notas: data.notas || '',
        citaId: data.citaId
      };
      if (data.estado === 'aprobada') {
        cargarDisponibilidad();
        if (dialog.value && diaSeleccionado.value.toISOString().substring(0, 10) === data.fechaISO) {
          cargarDetalleHorario(diaSeleccionado.value);
        }
        return;
      }
    }
    cargarDisponibilidad();
    cargarDiasBloqueados();
  });
});

onBeforeUnmount(() => {
  socket.off('cita:actualizada');
  socket.off('dia:bloqueoActualizado');
  socket.off('cancelacion:resuelta');
  socket.disconnect();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.dia-sheet:hover {
  border-color: #1976D2 !important;
  transition: 0.3s;
}

.dia-sheet {
  height: 100%;
  min-height: 80px;
}

/* Grid de 7 columnas para el calendario */
.calendar-col {
  flex: 0 0 14.285%;
  max-width: 14.285%;
}
.dias-header {
  flex: 0 0 14.285%;
  max-width: 14.285%;
}

.cursor-pointer { cursor: pointer; }
.dia-sheet {
  height: 100%;
  min-height: 70px; /* Reducido para móvil */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  transition: 0.2s;
}

@media (min-width: 600px) {
  .dia-sheet { min-height: 100px; }
}

.text-mini { font-size: 0.65rem !important; }
.text-mini-cita { font-size: 0.7rem !important; line-height: 1.1; }

/* Contenedor de la tabla para permitir scroll lateral en móviles */
.tabla-container {
  overflow-x: auto;
  border-radius: 8px;
  background: white;
}

.custom-table {
  min-width: 600px; /* Asegura que no se colapse la tabla en móvil */
}

.cita-card {
  border: 1px solid rgba(0,0,0,0.05);
  max-width: 120px;
  cursor: pointer;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-wrapper {
  padding: 4px 0;
  display: flex;
  justify-content: center;
}
</style>
