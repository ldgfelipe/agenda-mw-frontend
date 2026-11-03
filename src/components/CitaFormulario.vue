<template>
  <v-card>
    <v-card-title class="text-h6 primary white--text">
      Confirmar Reserva de Cita
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="formRef" @submit.prevent="guardarCita">

        <v-list dense class="mb-4 pa-0">
          <v-list-item class="pa-0">
            <v-list-item-title class="font-weight-bold">Día y Hora:</v-list-item-title>
            <v-list-item-subtitle>{{ fechaHoraFormateada }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="pa-0">
            <v-list-item-title class="font-weight-bold">Consultorio:</v-list-item-title>
            <v-list-item-subtitle>{{ form.nombreConsultorio || '...' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-3"></v-divider>

        <template v-if="esAdmin">
          <p class="text-subtitle-2 mb-2 blue--text">Asignación de Médico (Admin)</p>
          
          <v-combobox
            v-model="medicoSeleccionado"
            :items="listaMedicos"
            item-title="nombre"
            label="Seleccionar o escribir nombre del médico"
            hint="Selecciona un médico registrado o escribe uno nuevo"
            persistent-hint
            clearable
            required
            :rules="[v => !!v || 'El nombre del médico es requerido']"
            @update:model-value="alCambiarMedico"
          ></v-combobox>

          <v-checkbox
            v-if="esMedicoNuevo"
            v-model="form.registrarNuevoMedico"
            label="¿Registrar como nuevo usuario médico en el sistema?"
            color="primary"
            dense
            hint="Si se marca, se creará una cuenta de acceso para este médico"
            persistent-hint
          ></v-checkbox>


         

          <v-text-field
            v-if="esMedicoNuevo && form.registrarNuevoMedico"
            v-model="form.medicoCorreo"
            label="Correo electrónico del Médico"
            type="email"
            required
            :rules="[v => !!v || 'El correo es necesario para el registro']"
          ></v-text-field>
        </template>

        <v-text-field
          v-else
          v-model="form.nombreMedico"
          label="Médico"
          readonly
          disabled
        ></v-text-field>

       
 <v-checkbox
  v-if="esAdmin"
            v-model="form.medicoTipo"
            label="Activa si el cobro es por hora"
            color="primary"
            dense
            persistent-hint
          ></v-checkbox>

           <v-divider class="my-5"></v-divider>
        <v-text-field
          v-model="form.pacienteNombre"
          label="Nombre del Paciente"
          required
          :rules="[v => !!v || 'El nombre del paciente es requerido']"
        ></v-text-field>

        <v-text-field
          v-model="form.pacienteCorreo"
          label="Correo del Paciente"
        ></v-text-field>

        <v-text-field
          v-model="form.pacienteTelefono"
          label="Teléfono del Paciente"
        ></v-text-field>

        <v-textarea
          v-model="form.pacienteNotas"
          label="Notas del Paciente (Motivo, etc.)"
          rows="3"
        ></v-textarea>

        <v-text-field
          v-model.number="form.costoConsulta"
          label="Costo de la Consulta"
          prefix="$"
          type="number"
          required
          :rules="[v => v >= 0 || 'El costo debe ser cero o positivo']"
        ></v-text-field>
        
        <v-alert type="info" dense class="mt-4">
          Estado inicial: **{{ form.estado && form.estado.toUpperCase() }}**
        </v-alert>

      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" text @click="$emit('cerrar', false)" :disabled="cargando">Cancelar</v-btn>
      <v-btn color="primary" @click="guardarCita" :loading="cargando">Confirmar Reserva</v-btn>
    </v-card-actions>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import api from '@/plugins/axios'; 
import { useUserStore } from '@/stores/user';

const props = defineProps({
    reservaInicial: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['cerrar', 'citaGuardada']);
const userStore = useUserStore();

// --- ESTADO ---
const esAdmin = computed(() => userStore.usuario?.rol === 'admin');
const listaMedicos = ref([]);
const medicoSeleccionado = ref(null);
const esMedicoNuevo = ref(false);

const form = ref({
    consultorioId: null,
    nombreConsultorio: '',
    fechaHoraInicio: null,
    medicoTipo:false,
    medicoId: null,
    nombreMedico: '',
    medicoCorreo: '', // Para nuevo registro
    registrarNuevoMedico: false, // Switch para el admin
    pacienteNombre: '',
    pacienteNotas: '',
    pacienteTelefono:'',
    pacienteCorreo:'',
    costoConsulta: 0,
    estado: 'pendiente' 
});

const cargando = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });
const formRef = ref(null);

// --- LÓGICA ---

// Cargar médicos registrados al montar
const cargarMedicos = async () => {
    try {
        const res = await api.get('/usuarios'); // Ajusta a tu endpoint real
        listaMedicos.value = res.data;

        console.log(listaMedicos)
    } catch (e) {
        console.error("Error cargando médicos:", e);
    }
};

// Sincronización inicial
watch(() => props.reservaInicial, (newValue) => {
    if (newValue && newValue.consultorioId) {
        form.value = { ...form.value, ...newValue };
        // Inicializar el médico seleccionado con lo que venga del calendario
        medicoSeleccionado.value = { 
            nombre: newValue.nombreMedico, 
            _id: newValue.medicoId 
        };
    }
}, { deep: true, immediate: true });

// Detectar si el médico escrito es nuevo o de la lista
const alCambiarMedico = (val) => {
    if (!val) {
        esMedicoNuevo.value = false;
        form.value.medicoId = null;
        form.value.nombreMedico = '';
        return;
    }

    if (typeof val === 'string') {
        // El admin escribió un nombre nuevo
        esMedicoNuevo.value = true;
        form.value.nombreMedico = val;
        form.value.medicoId = null;
    } else {
        // Seleccionó uno de la lista
        esMedicoNuevo.value = false;
        form.value.nombreMedico = val.nombre;
        form.value.medicoId = val._id;
        form.value.registrarNuevoMedico = false;
    }
};

const fechaHoraFormateada = computed(() => {
    const fecha = form.value.fechaHoraInicio;
    if (!fecha || !(fecha instanceof Date)) return 'Cargando fecha...';
    return fecha.toLocaleString('es', {
        timeZone: 'UTC',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
});

const guardarCita = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;

    cargando.value = true;
    
    const citaPayload = {
        consultorio: form.value.consultorioId,
        nombreConsultorio: form.value.nombreConsultorio,
        // Datos del médico: enviamos ID si existe, o solo nombre si no
        medico: {
            nombre: form.value.nombreMedico, 
            id: form.value.medicoId,
            tipo:form.value.medicoTipo
        },
        // Metadata para que el backend sepa si crear un usuario médico
        opcionesRegistroMedico: {
            crearUsuario: form.value.registrarNuevoMedico,
            correo: form.value.medicoCorreo
        },
        paciente: { 
            nombre: form.value.pacienteNombre, 
            notas: form.value.pacienteNotas, 
            correo: form.value.pacienteCorreo, 
            telefono: form.value.pacienteTelefono
        },
        costo: form.value.costoConsulta,
        // Enviar exactamente la hora del calendario como string local (sin conversión zona horaria)
        fechaHoraInicio: form.value.fechaHoraInicio
          ? (() => {
              const d = new Date(form.value.fechaHoraInicio);
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const h = String(d.getHours()).padStart(2, '0');
              const min = String(d.getMinutes()).padStart(2, '0');
              return `${y}-${m}-${day}T${h}:${min}:00`;
            })()
          : null,
        estado: form.value.estado
    };

    try {
        await api.post('/citas', citaPayload);
        snackbar.value = { show: true, message: 'Operación realizada con éxito', color: 'success' };
        setTimeout(() => { emit('citaGuardada'); }, 1000);
    } catch (error) {
        console.error(error);
        snackbar.value = { show: true, message: 'Error al procesar reserva', color: 'error' };
    } finally {
        cargando.value = false;
    }
};

onMounted(() => {
    if (esAdmin.value) cargarMedicos();
});
</script>