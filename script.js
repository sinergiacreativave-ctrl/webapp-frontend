// --- 1. ENLACES DE GOOGLE SHEETS (Verifica que tus 3 enlaces CSV sigan aquí) ---
const SHEET_CSV_ESTUDIANTES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=0&single=true&output=csv';
const SHEET_CSV_NOTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=2097122187&single=true&output=csv';
const SHEET_CSV_ASISTENCIA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1890009950&single=true&output=csv';

// --- 2. BASES DE DATOS EN MEMORIA ---
let bdEstudiantes = [];
let bdNotas = [];
let bdAsistencia = [];

// --- 3. CARGAR DATOS DE GOOGLE SHEETS ---
async function cargarDatos() {
    try {
        // Estudiantes 
        const resEst = await fetch(SHEET_CSV_ESTUDIANTES);
        const csvEst = await resEst.text();
        bdEstudiantes = csvEst.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                idQR: val[0]?.trim(),
                cedula: val[1]?.trim(),
                nombres: val[2]?.trim(),
                apellidos: val[3]?.trim(),
                grado: val[4]?.trim(),
                representante: val[5]?.trim(),
                foto: val[8]?.trim() // Lee la Columna I
            };
        }).filter(e => e.idQR);

        // Notas
        const resNotas = await fetch(SHEET_CSV_NOTAS);
        const csvNotas = await resNotas.text();
        bdNotas = csvNotas.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                idQR: val[0]?.trim(),
                lapso: val[1]?.trim(),
                materia: val[2]?.trim(),
                nota: val[3]?.trim(),
                observacion: val[4]?.trim()
            };
        }).filter(n => n.idQR);

        // Asistencia
        const resAsist = await fetch(SHEET_CSV_ASISTENCIA);
        const csvAsist = await resAsist.text();
        bdAsistencia = csvAsist.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                fecha: val[0]?.trim(),
                hora: val[1]?.trim(),
                idQR: val[2]?.trim(),
                estado: val[3]?.trim()
            };
        }).filter(a => a.idQR);

        console.log("¡Bases de datos listas!");
    } catch (error) {
        console.error('Error cargando los datos:', error);
    }
}

cargarDatos();

// --- 4. ESCÁNER QR Y DASHBOARD COMPLETO ---
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

    escaner.render(alLeerQR, () => {});

    function alLeerQR(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'none'; // Mantiene oculto el botón principal

        const codigoLimpio = codigoEscaneado.trim();
        const estudiante = bdEstudiantes.find(est => est.idQR === codigoLimpio);

        if (estudiante) {
            const susNotas = bdNotas.filter(n => n.idQR === codigoLimpio);
            const suAsistencia = bdAsistencia.filter(a => a.idQR === codigoLimpio);

            // Tabla de notas
            let htmlNotas = `<table class="tabla-notas"><tr><th>Materia</th><th>Nota</th><th>Lapso</th></tr>`;
            if (susNotas.length > 0) {
                susNotas.forEach(n => { 
                    htmlNotas += `<tr><td>${n.materia}</td><td>${n.nota}</td><td>${n.lapso}</td></tr>`; 
                });
            } else {
                htmlNotas += `<tr><td colspan="3">No hay notas registradas aún.</td></tr>`;
            }
            htmlNotas += `</table>`;

            // Lista de asistencia
            let htmlAsistencia = `<ul class="lista-asistencia">`;
            if (suAsistencia.length > 0) {
                suAsistencia.forEach(a => { 
                    htmlAsistencia += `<li>📅 ${a.fecha} - ⏰ ${a.hora} (${a.estado})</li>`; 
                });
            } else {
                htmlAsistencia += `<li>No hay registros de asistencia recientes.</li>`;
            }
            htmlAsistencia += `</ul>`;

            // Ruta de la foto
            let imgSrc = 'https://via.placeholder.com/80?text=Sin+Foto';
            if (estudiante.foto && estudiante.foto !== '') {
                const nombreArchivo = estudiante.foto.replace('fotos/', '');
                imgSrc = `fotos/${nombreArchivo}`;
            }

            // Renderizado centrado con Botón de Salida
            resultadoDiv.innerHTML = `
                <div class="dashboard">
                    <div class="perfil-cabecera">
                        <img src="${imgSrc}" alt="Foto" class="foto-estudiante" onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
                        <div>
                            <h2 style="margin: 5px 0 0 0; border: none; font-size: 18px;">${estudiante.nombres} ${estudiante.apellidos}</h2>
                            <p style="margin: 3px 0 0 0; color: #475569; font-weight: bold;">${estudiante.grado}</p>
                        </div>
                    </div>
                    
                    <h3>📚 Boletín de Calificaciones</h3>
                    ${htmlNotas}

                    <h3>🏫 Registro de Ingreso</h3>
                    ${htmlAsistencia}

                    <button id="btn-salir" class="btn-salida">🚪 Salir / Cerrar Perfil</button>
                </div>
            `;

            // Evento para limpiar la pantalla y volver al inicio al hacer clic en Salir
            document.getElementById('btn-salir').addEventListener('click', () => {
                resultadoDiv.innerHTML = '';
                btnEscanear.style.display = 'block';
                btnEscanear.innerText = 'Escanear Carnet';
            });

        } else {
            resultadoDiv.innerHTML = `
                <h3 style="color: #b91c1c; text-align: center;">❌ Carnet Inválido</h3>
                <button id="btn-salir" class="btn-salida">🚪 Salir</button>
            `;
            document.getElementById('btn-salir').addEventListener('click', () => {
                resultadoDiv.innerHTML = '';
                btnEscanear.style.display = 'block';
                btnEscanear.innerText = 'Escanear Carnet';
            });
        }
    }
});
