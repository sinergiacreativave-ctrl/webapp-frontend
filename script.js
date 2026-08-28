// --- 1. ENLACES DE GOOGLE SHEETS (Reemplaza estos 3) ---
const SHEET_CSV_ESTUDIANTES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=0&single=true&output=csv';
const SHEET_CSV_NOTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=2097122187&single=true&output=csv';
const SHEET_CSV_ASISTENCIA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1890009950&single=true&output=csv';

// --- 2. BASES DE DATOS EN MEMORIA ---
let bdEstudiantes = []; 
let bdNotas = [];
let bdAsistencia = [];

// --- 3. FUNCIÓN PARA DESCARGAR TODO ---
async function cargarDatos() {
    try {
        // Cargar Estudiantes
        const resEst = await fetch(SHEET_CSV_ESTUDIANTES);
        const csvEst = await resEst.text();
        bdEstudiantes = csvEst.split('\n').slice(1).map(fila => {
            const val = fila.split(',');
            return { idQR: val[0]?.trim(), cedula: val[1]?.trim(), nombres: val[2]?.trim(), apellidos: val[3]?.trim(), grado: val[4]?.trim(), representante: val[5]?.trim() };
        }).filter(e => e.idQR);

        // Cargar Notas
        const resNotas = await fetch(SHEET_CSV_NOTAS);
        const csvNotas = await resNotas.text();
        bdNotas = csvNotas.split('\n').slice(1).map(fila => {
            const val = fila.split(',');
            return { idQR: val[0]?.trim(), lapso: val[1]?.trim(), materia: val[2]?.trim(), nota: val[3]?.trim(), observacion: val[4]?.trim() };
        }).filter(n => n.idQR);

        // Cargar Asistencia
        const resAsist = await fetch(SHEET_CSV_ASISTENCIA);
        const csvAsist = await resAsist.text();
        bdAsistencia = csvAsist.split('\n').slice(1).map(fila => {
            const val = fila.split(',');
            return { fecha: val[0]?.trim(), hora: val[1]?.trim(), idQR: val[2]?.trim(), estado: val[3]?.trim() };
        }).filter(a => a.idQR);

        console.log("¡Bases de datos listas!");
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}
cargarDatos();

// --- 4. LÓGICA DEL ESCÁNER QR Y DASHBOARD ---
const btnEscanear = document.getElementById('btn-escanear');
const resultadoDiv = document.getElementById('resultado');

btnEscanear.addEventListener('click', () => {
    btnEscanear.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    const escaner = new Html5QrcodeScanner("lector-qr", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    escaner.render(alLeerQR, () => {});

    function alLeerQR(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'block';
        btnEscanear.innerText = "Escanear otro carnet";

        // Buscar al estudiante
        const estudiante = bdEstudiantes.find(est => est.idQR === codigoEscaneado);

        if (estudiante) {
            // Filtrar sus notas y asistencia
            const susNotas = bdNotas.filter(n => n.idQR === codigoEscaneado);
            const suAsistencia = bdAsistencia.filter(a => a.idQR === codigoEscaneado);

            // Armar tabla de notas
            let htmlNotas = `<table class="tabla-notas"><tr><th>Materia</th><th>Nota</th><th>Lapso</th></tr>`;
            if (susNotas.length > 0) {
                susNotas.forEach(n => { htmlNotas += `<tr><td>${n.materia}</td><td>${n.nota}</td><td>${n.lapso}</td></tr>`; });
            } else {
                htmlNotas += `<tr><td colspan="3">No hay notas registradas aún.</td></tr>`;
            }
            htmlNotas += `</table>`;

            // Armar lista de asistencia
            let htmlAsistencia = `<ul class="lista-asistencia">`;
            if (suAsistencia.length > 0) {
                suAsistencia.forEach(a => { htmlAsistencia += `<li>📅 ${a.fecha} - ⏰ ${a.hora} (${a.estado})</li>`; });
            } else {
                htmlAsistencia += `<li>No hay registros de asistencia recientes.</li>`;
            }
            htmlAsistencia += `</ul>`;

            // Pintar todo en el Dashboard
            resultadoDiv.innerHTML = `
                <div class="dashboard">
                    <h2>🎓 Perfil del Estudiante</h2>
                    <p><strong>Alumno:</strong> ${estudiante.nombres} ${estudiante.apellidos}</p>
                    <p><strong>Grado:</strong> ${estudiante.grado}</p>
                    
                    <h3>📚 Boletín de Calificaciones</h3>
                    ${htmlNotas}

                    <h3>🏫 Registro de Ingreso</h3>
                    ${htmlAsistencia}
                </div>
            `;
        } else {
            resultadoDiv.innerHTML = `<h3 style="color: #b91c1c; text-align: center;">❌ Carnet Inválido</h3>`;
        }
    }
});
