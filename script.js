// --- 1. ENLACES DE GOOGLE SHEETS ---
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
                foto: val[8]?.trim()
            };
        }).filter(e => e.idQR);

        const resNotas = await fetch(SHEET_CSV_NOTAS);
        const csvNotas = await resNotas.text();
        bdNotas = csvNotas.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return { 
                idQR: val[0]?.trim(), 
                momento: val[1]?.trim(),     
                materia: val[2]?.trim(),     
                porcentaje: val[3]?.trim()   
            };
        }).filter(n => n.idQR);

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
const textoInicio = document.getElementById('texto-inicio');

btnEscanear.addEventListener('click', () => {
    btnEscanear.style.display = 'none';
    if (textoInicio) textoInicio.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    const escaner = new Html5QrcodeScanner(
        "lector-qr", 
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
    );

    escaner.render(alLeerQR, () => {});

    function alLeerQR(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'none'; 
        if (textoInicio) textoInicio.style.display = 'none';

        const codigoLimpio = codigoEscaneado.trim();
        const estudiante = bdEstudiantes.find(est => est.idQR === codigoLimpio);

        if (estudiante) {
            const susNotas = bdNotas.filter(n => n.idQR === codigoLimpio);
            const suAsistencia = bdAsistencia.filter(a => a.idQR === codigoLimpio);

            let htmlNotas = `<table class="tabla-notas"><tr><th>Área / Materia</th><th>Porcentaje</th><th>Momento</th></tr>`;
            if (susNotas.length > 0) {
                susNotas.forEach(n => { 
                    htmlNotas += `<tr><td>${n.materia}</td><td>${n.porcentaje}</td><td>${n.momento}</td></tr>`; 
                });
            } else {
                htmlNotas += `<tr><td colspan="3">No hay registros de porcentajes aún.</td></tr>`;
            }
            htmlNotas += `</table>`;

            let htmlAsistencia = `<ul class="lista-asistencia">`;
            if (suAsistencia.length > 0) {
                suAsistencia.forEach(a => { 
                    htmlAsistencia += `<li>📅 ${a.fecha} - ⏰ ${a.hora} (${a.estado})</li>`; 
                });
            } else {
                htmlAsistencia += `<li>No hay registros de asistencia recientes.</li>`;
            }
            htmlAsistencia += `</ul>`;

            let imgSrc = 'https://via.placeholder.com/80?text=Sin+Foto';
            if (estudiante.foto && estudiante.foto !== '') {
                const nombreArchivo = estudiante.foto.replace('fotos/', '');
                imgSrc = `fotos/${nombreArchivo}`;
            }

            // Renderizado centrado con Logo y Botón de Salida
            resultadoDiv.innerHTML = `
                <div class="dashboard">
                    <!-- NUEVO ENCABEZADO INSTITUCIONAL -->
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0;">
                        <img src="fotos/logo.png" alt="Logo Colegio" style="width: 55px; height: 55px; object-fit: contain;">
                        <h1 style="margin: 0; font-size: 24px; color: #1e3a8a;">Portal Escolar</h1>
                    </div>

                    <!-- FOTO Y DATOS DEL ALUMNO -->
                    <div class="perfil-cabecera">
                        <img src="${imgSrc}" alt="Foto" class="foto-estudiante" onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
                        <div>
                            <h2 style="margin: 5px 0 0 0; border: none; font-size: 18px;">${estudiante.nombres} ${estudiante.apellidos}</h2>
                            <p style="margin: 3px 0 0 0; color: #475569; font-weight: bold;">${estudiante.grado}</p>
                        </div>
                    </div>
                    
                    <h3>📊 Rendimiento Académico</h3>
                    ${htmlNotas}

                    <h3>🏫 Registro de Ingreso</h3>
                    ${htmlAsistencia}

                    <button id="btn-salir" class="btn-salida">🚪 Salir / Cerrar Perfil</button>
                </div>
            `;

            document.getElementById('btn-salir').addEventListener('click', () => {
                resultadoDiv.innerHTML = '';
                btnEscanear.style.display = 'block';
                btnEscanear.innerText = 'Escanear Carnet';
                if (textoInicio) textoInicio.style.display = 'block'; 
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
                if (textoInicio) textoInicio.style.display = 'block'; 
            });
        }
    }
});
