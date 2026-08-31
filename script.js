// --- 1. ENLACES Y CONFIGURACIÓN ---
const SHEET_CSV_ESTUDIANTES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=0&single=true&output=csv';
const SHEET_CSV_NOTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=2097122187&single=true&output=csv';
const SHEET_CSV_ASISTENCIA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1890009950&single=true&output=csv';

// URL de tu ejecutable de Google Apps Script
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbwyay8rAIAXAy_951jvj_N-L4zv8EP41AsxzVe612jwtH15JEKt5h1axEo5pxUN6onv/exec';

const PIN_DOCENTE = "1234"; // PIN de acceso para la Maestra de Guardia

const fotosInvitaciones = [
    'fotos/evento1.jpg',
    'fotos/evento2.jpg'
];

let bdEstudiantes = []; 
let bdNotas = [];
let bdAsistencia = [];
let intervaloCarrusel = null;
let escanerContinuo = null;
let procesandoEscaneo = false;

// --- 2. CARGAR DATOS EN TIEMPO REAL ---
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
                grado: val[0]?.trim(), 
                momento: val[1]?.trim(), 
                materia: val[2]?.trim(), 
                porcentaje: val[3]?.trim() 
            };
        }).filter(n => n.grado);

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

    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}
cargarDatos();

// --- 3. MODALES DE INVITACIONES Y PLAN DE EVALUACIÓN ---
function abrirModalInvitaciones() {
    if (fotosInvitaciones.length === 0) return;

    let modal = document.getElementById('modal-invitaciones');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-invitaciones';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    let htmlImagenes = fotosInvitaciones.map((src, i) => 
        `<img src="${src}" class="carrusel-img ${i === 0 ? 'activa' : ''}" alt="Invitación ${i + 1}">`
    ).join('');

    modal.innerHTML = `
        <div class="modal-contenido">
            <button class="btn-cerrar-modal" id="btn-cerrar-modal">✕</button>
            <h3 style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 16px;">📩 Próximos Eventos</h3>
            <div class="carrusel-contenedor">
                ${htmlImagenes}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarModalInvitaciones);

    if (fotosInvitaciones.length > 1) {
        let indexActual = 0;
        const imagenes = modal.querySelectorAll('.carrusel-img');
        clearInterval(intervaloCarrusel);
        intervaloCarrusel = setInterval(() => {
            imagenes[indexActual].classList.remove('activa');
            indexActual = (indexActual + 1) % imagenes.length;
            imagenes[indexActual].classList.add('activa');
        }, 3500);
    }
}

function cerrarModalInvitaciones() {
    const modal = document.getElementById('modal-invitaciones');
    if (modal) modal.style.display = 'none';
    clearInterval(intervaloCarrusel);
}

function abrirModalPlanEvaluacion(gradoTexto) {
    const numGrado = gradoTexto.match(/\d+/)?.[0] || '1';
    const archivoPDF = `Imomento${numGrado}.pdf`;

    let modal = document.getElementById('modal-plan');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-plan';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-contenido" style="max-width: 480px; width: 92%;">
            <button class="btn-cerrar-modal" id="btn-cerrar-plan">✕</button>
            <h3 style="margin: 5px 0 10px 0; color: #1e3a8a; font-size: 16px;">📋 Plan de Evaluación (${gradoTexto})</h3>
            
            <div style="height: 55vh; width: 100%; margin-bottom: 12px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
                <iframe src="${archivoPDF}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>

            <a href="${archivoPDF}" download="${archivoPDF}" target="_blank" class="btn-plan" style="text-decoration: none;">
                📥 Descargar
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    document.getElementById('btn-cerrar-plan').addEventListener('click', () => { modal.style.display = 'none'; });
}

// --- 4. CALENDARIO DE ASISTENCIA PARA ESTUDIANTES ---
function generarCalendarioAsistencia(registrosAlumno) {
    const hoy = new Date();
    const ano = hoy.getFullYear();
    const mes = hoy.getMonth();

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const primerDiaMes = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();

    const desfaseInicio = primerDiaMes === 0 ? 6 : primerDiaMes - 1;
    const fechasAsistidas = registrosAlumno.map(r => r.fecha);

    let htmlCal = `
        <div style="margin-top: 15px; background: #fff; border-radius: 10px; padding: 10px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 14px; text-align: center;">
                📅 Asistencia - ${nombresMeses[mes]} ${ano}
            </h4>
            <div class="calendario-header">
                <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div><div>Do</div>
            </div>
            <div class="calendario-grid">
    `;

    for (let i = 0; i < desfaseInicio; i++) {
        htmlCal += `<div class="dia-box invalido"></div>`;
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const fechaObj = new Date(ano, mes, dia);
        const diaSemana = fechaObj.getDay();
        const esFinDeSemana = (diaSemana === 0 || diaSemana === 6);

        const diaPadded = String(dia).padStart(2, '0');
        const mesPadded = String(mes + 1).padStart(2, '0');
        const fechaStr1 = `${diaPadded}/${mesPadded}/${ano}`;
        const fechaStr2 = `${ano}-${mesPadded}-${diaPadded}`;

        const asistio = fechasAsistidas.some(f => f === fechaStr1 || f === fechaStr2 || f.startsWith(`${diaPadded}/${mesPadded}`));

        let claseEstado = "";
        if (asistio) {
            claseEstado = "presente";
        } else if (esFinDeSemana) {
            claseEstado = "fin-semana";
        }

        htmlCal += `<div class="dia-box ${claseEstado}">${dia}</div>`;
    }

    htmlCal += `</div></div>`;
    return htmlCal;
}

// --- 5. PERFIL ADMINISTRATIVO (DOCENTE DE GUARDIA) ---
const modalPin = document.getElementById('modal-pin');
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnCerrarPin = document.getElementById('btn-cerrar-pin');
const btnConfirmarPin = document.getElementById('btn-confirmar-pin');
const inputPin = document.getElementById('input-pin');

btnAdminLogin.addEventListener('click', () => {
    modalPin.style.display = 'flex';
    inputPin.value = '';
    inputPin.focus();
});

btnCerrarPin.addEventListener('click', () => { modalPin.style.display = 'none'; });

btnConfirmarPin.addEventListener('click', procesarAccesoAdmin);
inputPin.addEventListener('keypress', (e) => { if (e.key === 'Enter') procesarAccesoAdmin(); });

function procesarAccesoAdmin() {
    if (inputPin.value === PIN_DOCENTE) {
        modalPin.style.display = 'none';
        iniciarPanelAdmin();
    } else {
        alert("PIN Incorrecto");
        inputPin.value = '';
    }
}

function calcularAsistenciaHoyPorGrado() {
    const hoyStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const conteos = { "1er Grado": 0, "2do Grado": 0, "3er Grado": 0, "4to Grado": 0, "5to Grado": 0, "6to Grado": 0 };

    bdAsistencia.forEach(reg => {
        if (reg.fecha === hoyStr || reg.fecha.startsWith(hoyStr.substring(0, 5))) {
            const est = bdEstudiantes.find(e => e.idQR === reg.idQR);
            if (est && conteos[est.grado] !== undefined) {
                conteos[est.grado]++;
            }
        }
    });

    return conteos;
}

function iniciarPanelAdmin() {
    document.getElementById('btn-escanear').style.display = 'none';
    document.getElementById('btn-admin-login').style.display = 'none';
    if (document.getElementById('texto-inicio')) document.getElementById('texto-inicio').style.display = 'none';

    const resultadoDiv = document.getElementById('resultado');
    const conteosHoy = calcularAsistenciaHoyPorGrado();

    resultadoDiv.innerHTML = `
        <div class="dashboard">
            <h2 style="color: #1e3a8a; margin: 0 0 5px 0; font-size: 18px;">📋 Control de Asistencia en Vivo</h2>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">Maestra de Guardia - Modo Continuo</p>
            
            <div id="alerta-escaneo" class="alerta-escaneo"></div>

            <div class="admin-grid-grados">
                ${Object.keys(conteosHoy).map(grado => `
                    <div class="tarjeta-grado">
                        <h4>${grado}</h4>
                        <div class="conteo" id="cnt-${grado.replace(/\s+/g, '')}">${conteosHoy[grado]} / 25</div>
                    </div>
                `).join('')}
            </div>

            <div id="lector-qr-admin" style="margin: 10px 0;"></div>

            <button id="btn-cerrar-admin" class="btn-salida" style="margin-top: 10px;">🚪 Salir de Modo Guardia</button>
        </div>
    `;

    document.getElementById('btn-cerrar-admin').addEventListener('click', () => {
        if (escanerContinuo) escanerContinuo.clear();
        location.reload();
    });

    escanerContinuo = new Html5QrcodeScanner("lector-qr-admin", { fps: 10, qrbox: { width: 220, height: 220 } }, false);
    escanerContinuo.render(alEscanearModoGuardia, () => {});
}

async function alEscanearModoGuardia(codigoEscaneado) {
    if (procesandoEscaneo) return;
    procesandoEscaneo = true;

    const codigoLimpio = codigoEscaneado.trim();
    const estudiante = bdEstudiantes.find(e => e.idQR === codigoLimpio);
    const alertaDiv = document.getElementById('alerta-escaneo');

    if (!estudiante) {
        alertaDiv.className = "alerta-escaneo repetido";
        alertaDiv.innerText = "❌ Carnet no registrado en el sistema";
        alertaDiv.style.display = "block";
        setTimeout(() => { procesandoEscaneo = false; alertaDiv.style.display = "none"; }, 2000);
        return;
    }

    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = hoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const yaRegistrado = bdAsistencia.some(a => a.idQR === codigoLimpio && (a.fecha === fechaStr || a.fecha.startsWith(fechaStr.substring(0, 5))));

    if (yaRegistrado) {
        alertaDiv.className = "alerta-escaneo repetido";
        alertaDiv.innerText = `⚠️ ${estudiante.nombres} ya registró asistencia hoy.`;
        alertaDiv.style.display = "block";
        setTimeout(() => { procesandoEscaneo = false; alertaDiv.style.display = "none"; }, 2000);
        return;
    }

    alertaDiv.className = "alerta-escaneo exito";
    alertaDiv.innerText = `✅ ¡Asistencia Registrada! ${estudiante.nombres} (${estudiante.grado})`;
    alertaDiv.style.display = "block";

    bdAsistencia.push({ fecha: fechaStr, hora: horaStr, idQR: codigoLimpio, estado: 'Presente' });

    const idContador = `cnt-${estudiante.grado.replace(/\s+/g, '')}`;
    const elContador = document.getElementById(idContador);
    if (elContador) {
        const conteos = calcularAsistenciaHoyPorGrado();
        elContador.innerText = `${conteos[estudiante.grado]} / 25`;
    }

    // Envío por parámetros URL para evitar el bloqueo de cuerpo por CORS
    try {
        const urlConParametros = `${URL_APPS_SCRIPT}?fecha=${encodeURIComponent(fechaStr)}&hora=${encodeURIComponent(horaStr)}&idQR=${encodeURIComponent(codigoLimpio)}&estado=Presente`;
        
        await fetch(urlConParametros, {
            method: 'POST',
            mode: 'no-cors'
        });
    } catch (e) {
        console.error("Error guardando en la hoja de cálculo:", e);
    }

    setTimeout(() => {
        procesandoEscaneo = false;
        alertaDiv.style.display = "none";
    }, 2200);
}

// --- 6. ESCÁNER QR ESTUDIANTE Y RENDERIZADO DEL PERFIL ---
const btnEscanear = document.getElementById('btn-escanear');
const resultadoDiv = document.getElementById('resultado');
const textoInicio = document.getElementById('texto-inicio');

btnEscanear.addEventListener('click', () => {
    btnEscanear.style.display = 'none';
    btnAdminLogin.style.display = 'none';
    if (textoInicio) textoInicio.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    const escaner = new Html5QrcodeScanner("lector-qr", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    escaner.render(alLeerQREstudiante, () => {});

    function alLeerQREstudiante(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'none';
        btnAdminLogin.style.display = 'none';
        if (textoInicio) textoInicio.style.display = 'none';

        const codigoLimpio = codigoEscaneado.trim();
        const estudiante = bdEstudiantes.find(est => est.idQR === codigoLimpio);

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
                "Lengua", "Matemática", "Ciencias de la naturaleza y tecnología",
                "Ciencias sociales", "Educación estética", "Educación física",
                "Robótica", "Inglés"
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

            let htmlCalendario = generarCalendarioAsistencia(suAsistencia);

            let imgSrc = 'https://via.placeholder.com/80?text=Sin+Foto';
            if (estudiante.foto && estudiante.foto !== '') {
                const nombreArchivo = estudiante.foto.replace('fotos/', '');
                imgSrc = `fotos/${nombreArchivo}`;
            }

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
                    
                    <button id="btn-toggle-menu" class="btn-toggle-menu">≡ Menú</button>

                    <div id="menu-opciones" class="menu-opciones">
                        <button id="btn-ver-invitaciones" class="btn-invitaciones">📩 Invitaciones Escolares</button>
                        <button id="btn-plan-evaluacion" class="btn-plan">📋 Plan de Evaluación</button>
                    </div>

                    <h3 style="margin: 10px 0 5px 0; font-size: 14px;">📊 Progreso Académico</h3>
                    ${htmlNotas}

                    <h3 style="margin: 10px 0 5px 0; font-size: 14px;">🏫 Registro de Ingreso</h3>
                    ${htmlCalendario}

                    <button id="btn-salir" class="btn-salida" style="padding: 10px; font-size: 14px; margin-top: 10px;">🚪 Salir / Cerrar Perfil</button>
                </div>
            `;

            document.getElementById('btn-toggle-menu').addEventListener('click', () => {
                const contenedorMenu = document.getElementById('menu-opciones');
                contenedorMenu.classList.toggle('abierto');
            });

            document.getElementById('btn-ver-invitaciones').addEventListener('click', abrirModalInvitaciones);
            document.getElementById('btn-plan-evaluacion').addEventListener('click', () => { abrirModalPlanEvaluacion(estudiante.grado); });

            document.getElementById('btn-salir').addEventListener('click', () => {
                cerrarModalInvitaciones();
                location.reload();
            });

            if (fotosInvitaciones.length > 0) {
                setTimeout(abrirModalInvitaciones, 400);
            }

        } else {
            resultadoDiv.innerHTML = `
                ${headerInstitucional}
                <div class="dashboard">
                    <h3 style="color: #b91c1c; text-align: center; margin: 20px 0;">❌ Carnet Inválido</h3>
                    <button id="btn-salir" class="btn-salida">🚪 Salir</button>
                </div>
            `;
            document.getElementById('btn-salir').addEventListener('click', () => { location.reload(); });
        }
    }
});
