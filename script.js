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
    // 2. Procesar el resto de las filas
    baseDeDatosEstudiantes = filas.slice(1).map(fila => {
      const valores = fila.split(',');
      return {
        idQR: valores[0]?.trim(),           // Columna A
        cedula: valores[1]?.trim(),         // Columna B
        nombres: valores[2]?.trim(),        // Columna C
        apellidos: valores[3]?.trim(),      // Columna D
        grado: valores[4]?.trim(),          // Columna E
        representante: valores[5]?.trim(),  // Columna F
        foto: valores[6]?.trim()            // Columna G (¡Aquí lee la foto!)
      };
    }).filter(estudiante => estudiante.idQR); 
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
    btnEscanear.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    const escaner = new Html5QrcodeScanner(
        "lector-qr", 
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
    );

    escaner.render(alLeerQR, alFallarQR);

    function alLeerQR(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'block'; 
        btnEscanear.innerText = "Escanear otro carnet";

        const estudiante = baseDeDatosEstudiantes.find(est => est.idQR === codigoEscaneado);

        if (estudiante) {
            // La app buscará la imagen dentro de la carpeta fotos/ de tu propio GitHub
            const imgSrc = estudiante.foto ? `fotos/${estudiante.foto}` : 'https://via.placeholder.com/80?text=Sin+Foto';

            resultadoDiv.innerHTML = `
                <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${imgSrc}" alt="Foto" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #15803d;">
                </div>
                <h3 style="color: #15803d; text-align: center;">✅ Acceso Permitido</h3>
                <p><strong>Estudiante:</strong> ${estudiante.nombres} ${estudiante.apellidos}</p>
                <p><strong>Grado:</strong> ${estudiante.grado}</p>
            `;
        } else {
            resultadoDiv.innerHTML = `
                <h3 style="color: #b91c1c; text-align: center;">❌ Carnet Inválido</h3>
                <p style="text-align: center;">Este código no pertenece a ningún estudiante registrado.</p>
            `;
        }
    }

    function alFallarQR(error) {}
});
