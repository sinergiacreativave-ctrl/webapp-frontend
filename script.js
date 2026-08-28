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

// --- LÓGICA DEL ESCÁNER QR ---

const btnEscanear = document.getElementById('btn-escanear');
const resultadoDiv = document.getElementById('resultado');

btnEscanear.addEventListener('click', () => {
    // 1. Ocultar el botón y mostrar mensaje
    btnEscanear.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    // 2. Configurar el escáner
    const escaner = new Html5QrcodeScanner(
        "lector-qr", 
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
    );

    // 3. Iniciar el escáner
    escaner.render(alLeerQR, alFallarQR);

    function alLeerQR(codigoEscaneado) {
        // Detener la cámara una vez que lee el código
        escaner.clear();
        btnEscanear.style.display = 'block'; // Mostrar el botón de nuevo
        btnEscanear.innerText = "Escanear otro carnet";

        // Buscar el código en la base de datos descargada
        const estudiante = baseDeDatosEstudiantes.find(est => est.idQR === codigoEscaneado);

        if (estudiante) {
            // ¡Éxito! El código coincide con un alumno
            resultadoDiv.innerHTML = `
                <h3 style="color: #15803d;">✅ Acceso Permitido</h3>
                <p><strong>Estudiante:</strong> ${estudiante.nombres} ${estudiante.apellidos}</p>
                <p><strong>Grado:</strong> ${estudiante.grado}</p>
                <p style="color: gray; font-size: 14px;">Cargando perfil completo...</p>
            `;
        } else {
            // El código no existe
            resultadoDiv.innerHTML = `
                <h3 style="color: #b91c1c;">❌ Carnet Inválido</h3>
                <p>Este código no pertenece a ningún estudiante registrado.</p>
            `;
        }
    }

    function alFallarQR(error) {
        // Se ejecuta mientras busca el QR. Lo dejamos vacío.
    }
});
