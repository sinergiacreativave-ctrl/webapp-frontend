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

        // Encabezado institucional fijo (fuera del cuadro de datos para que siempre se vea)
        const headerInstitucional = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 15px; background: white; padding: 10px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <img src="fotos/logo.png" alt="Logo Colegio" style="width: 45px; height: 45px; object-fit: contain;">
                <h1 style="margin: 0; font-size: 20px; color: #1e3a8a;">Portal Escolar</h1>
            </div>
        `;

        if (estudiante) {
            const susNotas = bdNotas.filter(n => n.idQR === codigoLimpio);
            const suAsistencia = bdAsistencia.filter(a => a.idQR === codigoLimpio);

            const areasFijas = [
                "Lengua",
                "Matemática",
                "Ciencias de la naturaleza y tecnología",
                "Ciencias sociales",
                "Educación estética",
                "Educación física",
                "Robótica",
                "Inglés"
            ];

            let htmlNotas = `<table class="tabla-notas" style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <tr style="background-color: #1e3a8a; color: white;">
                    <th style="padding: 6px; text-align: left;">Área de Aprendizaje</th>
                    <th style="padding: 6px; text-align: center;">Evaluado</th>
                    <th style="padding: 6px; text-align: center;">Momento</th>
                </tr>`;
                
            let momentoActual = susNotas.length > 0 ? susNotas[susNotas.length - 1].momento : "I Momento";

            areasFijas.forEach(area => {
                const registrosArea = susNotas.filter(n => n.materia.toLowerCase().trim() === area.toLowerCase().trim());
                
                let valorPorcentaje = "0%";
                let momentoArea = momentoActual;

                if (registrosArea.length > 0) {
                    const ultimoRegistro = registrosArea[registrosArea.length - 1];
                    valorPorcentaje = ultimoRegistro.porcentaje.includes('%') ? ultimoRegistro.porcentaje : `${ultimoRegistro.porcentaje}%`;
                    momentoArea = ultimoRegistro.momento;
                }

                htmlNotas += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 5px; font-size: 12px;">${area}</td>
                    <td style="padding: 5px; text-align: center; font-weight: bold; color: #1e3a8a; font-size: 12px;">${valorPorcentaje}</td>
                    <td style="padding: 5px; text-align: center; font-size: 12px;">${momentoArea}</td>
                </tr>`;
            });

            htmlNotas += `</table>`;

            htmlNotas += `
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 8px; margin-bottom: 15px; border-radius: 6px; font-size: 11px; color: #52525b; line-height: 1.4;">
                <strong>📌 Nota importante:</strong> El porcentaje mostrado representa únicamente el avance de las evaluaciones realizadas durante el momento, <strong>no es la calificación del estudiante</strong>. Si desea conocer el rendimiento académico, comuníquese con la docente.
            </div>`;

            let htmlAsistencia = `<ul class="lista-asistencia" style="font-size: 12px; padding-left: 15px; margin-bottom: 10px;">`;
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

            // Inyectamos el header afuera del dashboard para que sea lo primero que se vea
            resultadoDiv.innerHTML = `
                ${headerInstitucional}
                <div class="dashboard" style="padding: 12px;">
                    <div class="perfil-cabecera" style="margin-bottom: 10px;">
                        <img src="${imgSrc}" alt="Foto" class="foto-estudiante" style="width: 80px; height: 80px;" onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
                        <div>
                            <h2 style="margin: 2px 0 0 0; border: none; font-size: 16px;">${estudiante.nombres} ${estudiante.apellidos}</h2>
                            <p style="margin: 2px 0 0 0; color: #475569; font-weight: bold; font-size: 13px;">${estudiante.grado}</p>
                        </div>
                    </div>
                    
                    <h3 style="margin: 10px 0 5px 0; font-size: 14px;">📊 Progreso Académico</h3>
                    ${htmlNotas}

                    <h3 style="margin: 10px 0 5px 0; font-size: 14px;">🏫 Registro de Ingreso</h3>
                    ${htmlAsistencia}

                    <button id="btn-salir" class="btn-salida" style="padding: 10px; font-size: 14px; margin-top: 10px;">🚪 Salir / Cerrar Perfil</button>
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
                ${headerInstitucional}
                <div class="dashboard">
                    <h3 style="color: #b91c1c; text-align: center; margin: 20px 0;">❌ Carnet Inválido</h3>
                    <button id="btn-salir" class="btn-salida">🚪 Salir</button>
                </div>
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
