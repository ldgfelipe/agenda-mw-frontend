<template>
  <div class="expediente-page">
    <div v-if="!paciente" class="search-overlay">
      <div class="search-box">
        <h2>Consultar Expediente</h2>
        <p>Ingrese el nombre del paciente para comenzar:</p>
        
        <input 
          v-model="queryBusqueda" 
          @input="buscarPaciente"
          type="text" 
          placeholder="Ej: Juan Pérez..."
          class="input-search"
        >

        <ul v-if="resultados.length > 0" class="resultados-lista">
          <li 
            v-for="p in resultados" 
            :key="p._id" 
            @click="seleccionarPaciente(p._id)"
          >
            {{ p.nombre }} {{ p.primerApellido }} 
            <small>(DNI: {{ p.documento }})</small>
          </li>
        </ul>
        
        <div v-else-if="queryBusqueda.length > 2" class="no-results">
          No se encontraron pacientes con ese nombre.
        </div>
      </div>
    </div>

    <div v-else class="expediente-detalle">
      <button @click="paciente = null" class="btn-volver">← Nueva Búsqueda</button>
      
      <header>
        <div class="paciente-info-top">
     
            <ExpedienteView :paciente="paciente" ></ExpedienteView>
        

        </div>
      </header>
      
      </div>
  </div>
</template>

<script setup>  
import { ref, onMounted } from 'vue';
import ExpedienteView from '@/views/adminMediWork/components/controls/ExpedienteView.vue';
import api from '@/plugins/axios';

const props = defineProps({
    params:{
        type:Object,
        default:()=>({})
    }
})


const paciente = ref(null);
const queryBusqueda = ref('');
const resultados = ref([]);

// 1. Buscar mientras el usuario escribe
const buscarPaciente = async () => {
  if (queryBusqueda.value.length < 3) {
    resultados.value = [];
    return;
  }
  try {
    const res = await api.get(`/pacientes/buscar?q=${queryBusqueda.value}`);
    resultados.value = res.data.data;
  } catch (error) {
    console.error("Error buscando:", error);
  }
};

// 2. Cargar expediente al seleccionar de la lista
const seleccionarPaciente = async (id) => {
  try {
    // 🔑 Cambio: Se agrega la 's' a /pacientes/ para coincidir con el backend
    const res = await api.get(`/pacientes/${id}`);
    
    // Verificamos si la respuesta trae la estructura res.data.data
    paciente.value = res.data.data;
    
    resultados.value = [];
    queryBusqueda.value = '';
    
    // Opcional: Actualizar la URL sin recargar la página para que el ID aparezca arriba
    // router.push({ name: 'ExpedientePaciente', params: { id } });
  } catch (error) {
    console.error("Detalle del error:", error); // Útil para debugear en consola
    alert("Error al cargar el expediente");
  }
};

// 3. Al cargar el componente, si ya hay un ID en la URL, lo traemos
onMounted(() => {

      if(props.params){
     seleccionarPaciente(props.params);
  }
});
</script>

<style scoped>
.search-box {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.input-search {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.resultados-lista {
  list-style: none;
  padding: 0;
  margin-top: 10px;
  border: 1px solid #eee;
  background: white;
}
.resultados-lista li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}
.resultados-lista li:hover {
  background: #e3f2fd;
}
.btn-volver {
  margin-bottom: 20px;
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  text-decoration: underline;
}
</style>