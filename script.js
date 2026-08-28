// Pega tu enlace CSV de la pestaña Estudiantes entre las comillas simples
const SHEET_CSV_ESTUDIANTES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=0&single=true&output=csv';

// Esta variable guardará toda la información en la memoria del teléfono temporalmente
let baseDeDatosEstudiantes = []; 

async function cargarDatos() {
  try {
    const respuesta = await fetch(SHEET_CSV_ESTUDIANTES);
    const datosCsv = await respuesta.text();

    // 1. Separar el texto por filas
    const filas = datosCsv.split('\n');
    
    // 2. Procesar el resto de las filas (saltando la primera que son los encabezados)
    baseDeDatosEstudiantes = filas.slice(1).map(fila => {
      const valores = fila.split(',');
      
      // Ajustamos los índices a las columnas que creamos en el Paso 1.2
      return {
        idQR: valores[0]?.trim(),           // Columna A
        cedula: valores[1]?.trim(),         // Columna B
        nombres: valores[2]?.trim(),        // Columna C
        apellidos: valores[3]?.trim(),      // Columna D
        grado: valores[4]?.trim(),          // Columna E
        representante: valores[5]?.trim()   // Columna F
      };
    }).filter(estudiante => estudiante.idQR); // Oculta filas en blanco

    console.log("¡Base de datos cargada con éxito!", baseDeDatosEstudiantes);
    
  } catch (error) {
    console.error('Error al leer la base de datos de Google Sheets:', error);
  }
}

// Iniciar la carga oculta al abrir la app
cargarDatos();

// Mantenemos el botón preparado para cuando conectemos la cámara
document.getElementById('btn-escanear').addEventListener('click', () => {
    alert("La base de datos está conectada. El próximo paso es abrir la cámara aquí mismo.");
});
