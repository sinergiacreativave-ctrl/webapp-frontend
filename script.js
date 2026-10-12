// --- 1. ENLACES Y CONFIGURACIÓN ---
const SHEET_CSV_ESTUDIANTES = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=0&single=true&output=csv';
const SHEET_CSV_NOTAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=2097122187&single=true&output=csv';
const SHEET_CSV_ASISTENCIA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1890009950&single=true&output=csv';
const SHEET_CSV_PERSONAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1608645723&single=true&output=csv';
const SHEET_CSV_ASISTENCIA_PERSONAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1735121026&single=true&output=csv';

// NUEVOS ENLACES CSV DE LA TIENDA (Reemplázalos por los tuyos)
const SHEET_CSV_TIENDA_PRODUCTOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1582006180&single=true&output=csv';
const SHEET_CSV_PEDIDOS_TIENDA = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCDvJTzjCsI4AKTuqT3i1g1amMd5CXUBEYR7Ck6LUi141PX3za3dYkiy3oHV5zodaCmc1uAMqE8WZY/pub?gid=1496442334&single=true&output=csv';

const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbw7kxRjvJJJbGd5vVWW9QtGcoQn0vxE47MejC_FjmzkqPD1peIfGXzUnjEfo0ytXY_f/exec';
const PIN_DOCENTE = "1234"; // PIN de acceso para la Maestra de Guardia
const PIN_TIENDA = "2503";  // NUEVA Contraseña exclusiva para Administrar la Tienda

const fotosInvitaciones = [
    'fotos/evento1.jpg',
    'fotos/evento2.jpg'
];

let bdEstudiantes = []; 
let bdNotas = [];
let bdAsistencia = [];
let bdPersonal = []; 
let bdAsistenciaPersonal = []; 
let bdTiendaProductos = [];
let bdPedidosTienda = [];

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

        const resPers = await fetch(SHEET_CSV_PERSONAL);
        const csvPers = await resPers.text();
        bdPersonal = csvPers.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                idQR: val[0]?.trim(),
                cedula: val[1]?.trim(),
                nombres: val[2]?.trim(),
                apellidos: val[3]?.trim(),
                cargo: val[4]?.trim(),
                foto: val[5]?.trim()
            };
        }).filter(p => p.idQR);

        const resAsistPers = await fetch(SHEET_CSV_ASISTENCIA_PERSONAL);
        const csvAsistPers = await resAsistPers.text();
        bdAsistenciaPersonal = csvAsistPers.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                fecha: val[0]?.trim(),
                idQR: val[1]?.trim(),
                hora_entrada: val[4]?.trim(),
                hora_salida: val[5]?.trim()
            };
        }).filter(ap => ap.idQR);

        // Cargar Tienda Productos
        const resTienda = await fetch(SHEET_CSV_TIENDA_PRODUCTOS);
        const csvTienda = await resTienda.text();
        bdTiendaProductos = csvTienda.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                id_producto: val[0]?.trim(),
                categoria: val[1]?.trim(),
                nombre: val[2]?.trim(),
                descripcion: val[3]?.trim(),
                precio: val[4]?.trim(),
                foto: val[5]?.trim()
            };
        }).filter(t => t.id_producto);

        // Cargar Pedidos Tienda
        const resPedidos = await fetch(SHEET_CSV_PEDIDOS_TIENDA);
        const csvPedidos = await resPedidos.text();
        bdPedidosTienda = csvPedidos.split(/\r?\n/).slice(1).map(fila => {
            const val = fila.split(',');
            return {
                fecha: val[0]?.trim(),
                hora: val[1]?.trim(),
                idQR_estudiante: val[2]?.trim(),
                estudiante: val[3]?.trim(),
                grado: val[4]?.trim(),
                producto: val[5]?.trim(),
                monto: val[6]?.trim(),
                referencia: val[7]?.trim(),
                estado: val[8]?.trim()
            };
        }).filter(p => p.referencia);

    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}
cargarDatos();

// --- 3. MODALES DE INVITACIONES, PLAN Y TIENDA ESCOLAR ---
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
            <div class="carrusel-contenedor">${htmlImagenes}</div>
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
            <a href="${archivoPDF}" download="${archivoPDF}" target="_blank" class="btn-plan" style="text-decoration: none;">📥 Descargar</a>
        </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('btn-cerrar-plan').addEventListener('click', () => { modal.style.display = 'none'; });
}

// --- MODAL TIENDA ESCOLAR ---
function abrirModalTienda(estudiante) {
    let modal = document.getElementById('modal-tienda');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-tienda';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    renderizarVistaTiendaCatalogo(estudiante, modal);
    modal.style.display = 'flex';
}

function renderizarVistaTiendaCatalogo(estudiante, modal) {
    // Filtrar productos por categoría o mostrar ambos
    const mascotas = bdTiendaProductos.filter(p => p.categoria.toLowerCase().includes('mascota'));
    const especiales = bdTiendaProductos.filter(p => p.categoria.toLowerCase().includes('especial') || p.categoria.toLowerCase().includes('actividad'));
    const susPedidos = bdPedidosTienda.filter(p => p.idQR_estudiante === estudiante.idQR);

    modal.innerHTML = `
        <div class="modal-contenido" style="max-width: 520px; width: 94%; max-height: 85vh; overflow-y: auto;">
            <button class="btn-cerrar-modal" id="btn-cerrar-tienda">✕</button>
            <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 18px; text-align: center;">🛒 Tienda Escolar</h3>
            
            <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                <button id="tab-cat" class="btn-plan" style="flex:1; background:#1e3a8a; color:white;">🛍️ Catálogo</button>
                <button id="tab-mis-pedidos" class="btn-plan" style="flex:1; background:#e2e8f0; color:#1e3a8a;">📦 Mis Pedidos (${susPedidos.length})</button>
            </div>

            <div id="contenido-tienda-dinamico">
                <h4 style="color: #1e3a8a; margin: 5px 0; font-size: 14px;">🐾 Merchandising de Mascotas</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    ${mascotas.length === 0 ? '<p style="font-size:12px; color:#64748b;">No hay productos en esta categoría.</p>' : mascotas.map(p => tarjetaProductoHTML(p)).join('')}
                </div>

                <h4 style="color: #1e3a8a; margin: 5px 0; font-size: 14px;">⭐ Actividades Especiales</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    ${especiales.length === 0 ? '<p style="font-size:12px; color:#64748b;">No hay productos en esta categoría.</p>' : especiales.map(p => tarjetaProductoHTML(p)).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-cerrar-tienda').addEventListener('click', () => { modal.style.display = 'none'; });
    
    document.getElementById('tab-cat').addEventListener('click', () => renderizarVistaTiendaCatalogo(estudiante, modal));
    document.getElementById('tab-mis-pedidos').addEventListener('click', () => renderizarMisPedidos(estudiante, modal));

    // Agregar eventos a botones de comprar
    modal.querySelectorAll('.btn-comprar-prod').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prodId = e.target.getAttribute('data-id');
            const producto = bdTiendaProductos.find(p => p.id_producto === prodId);
            renderizarPanelPago(estudiante, producto, modal);
        });
    });
}

function tarjetaProductoHTML(p) {
    let imgSrc = p.foto ? `fotos/${p.foto.replace('fotos/', '')}` : 'https://via.placeholder.com/100?text=Producto';
    return `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; text-align: center; background: #f8fafc;">
            <img src="${imgSrc}" style="width: 100%; height: 90px; object-fit: contain; border-radius: 6px;" onerror="this.src='https://via.placeholder.com/100?text=Sin+Foto'">
            <h5 style="margin: 5px 0 2px 0; font-size: 13px; color: #1e3a8a;">${p.nombre}</h5>
            <p style="margin: 0 0 5px 0; font-size: 11px; color: #64748b;">${p.descripcion}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #059669;">$${p.precio}</p>
            <button data-id="${p.id_producto}" class="btn-comprar-prod" style="background: #1e3a8a; color: white; border: none; padding: 5px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; width: 100%;">🛒 Comprar</button>
        </div>
    `;
}

function renderizarPanelPago(estudiante, producto, modal) {
    modal.innerHTML = `
        <div class="modal-contenido" style="max-width: 480px; width: 92%;">
            <button class="btn-cerrar-modal" id="btn-cerrar-tienda">✕</button>
            <h3 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 16px;">💳 Pago Móvil - ${producto.nombre}</h3>
            <p style="font-size: 12px; color: #64748b; margin-bottom: 12px;">Precio a pagar: <strong style="color: #059669;">$${producto.precio}</strong></p>

            <div style="background: #f1f5f9; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 13px; border: 1px solid #cbd5e1;">
                <p style="margin: 4px 0;"><strong>Banco:</strong> Banco de Venezuela (0102) <button onclick="copiarTexto('0102')" style="cursor:pointer; font-size:10px; padding:2px 5px;">[📋 Copiar]</button></p>
                <p style="margin: 4px 0;"><strong>Teléfono:</strong> 0414-1234567 <button onclick="copiarTexto('04141234567')" style="cursor:pointer; font-size:10px; padding:2px 5px;">[📋 Copiar]</button></p>
                <p style="margin: 4px 0;"><strong>Cédula / RIF:</strong> J-12345678-9 <button onclick="copiarTexto('J123456789')" style="cursor:pointer; font-size:10px; padding:2px 5px;">[📋 Copiar]</button></p>
                <p style="margin: 4px 0;"><strong>Monto:</strong> $${producto.precio} <button onclick="copiarTexto('${producto.precio}')" style="cursor:pointer; font-size:10px; padding:2px 5px;">[📋 Copiar]</button></p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                <label style="font-size: 12px; font-weight: bold; color: #1e3a8a;">Monto Exacto Transferido:</label>
                <input type="text" id="input-monto-pago" value="${producto.precio}" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 13px;">
                
                <label style="font-size: 12px; font-weight: bold; color: #1e3a8a;">Número de Referencia (últimos 4 u 8 dígitos):</label>
                <input type="text" id="input-ref-pago" placeholder="Ej: 4589" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 13px;">
            </div>

            <div style="display: flex; gap: 8px;">
                <button id="btn-volver-catalogo" class="btn-plan" style="flex: 1; background: #64748b; color: white;">⬅️ Volver</button>
                <button id="btn-enviar-pedido" class="btn-plan" style="flex: 1; background: #059669; color: white;">✅ Enviar Pedido</button>
            </div>
        </div>
    `;

    document.getElementById('btn-cerrar-tienda').addEventListener('click', () => { modal.style.display = 'none'; });
    document.getElementById('btn-volver-catalogo').addEventListener('click', () => renderizarVistaTiendaCatalogo(estudiante, modal));
    
    document.getElementById('btn-enviar-pedido').addEventListener('click', async () => {
        const monto = document.getElementById('input-monto-pago').value.trim();
        const referencia = document.getElementById('input-ref-pago').value.trim();

        if (!referencia) {
            alert("Por favor ingresa el número de referencia del pago.");
            return;
        }

        const btnEnviar = document.getElementById('btn-enviar-pedido');
        btnEnviar.innerText = "Enviando...";
        btnEnviar.disabled = true;

        const hoy = new Date();
        const fechaStr = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
        const horaStr = hoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        try {
            const params = new URLSearchParams({
                tipo: 'tienda',
                fecha: fechaStr,
                hora: horaStr,
                idQR_estudiante: estudiante.idQR,
                estudiante: `${estudiante.nombres} ${estudiante.apellidos}`,
                grado: estudiante.grado,
                producto: producto.nombre,
                monto: monto,
                referencia: referencia
            });

            await fetch(`${URL_APPS_SCRIPT}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });

            // Añadir localmente
            bdPedidosTienda.push({
                fecha: fechaStr,
                hora: horaStr,
                idQR_estudiante: estudiante.idQR,
                estudiante: `${estudiante.nombres} ${estudiante.apellidos}`,
                grado: estudiante.grado,
                producto: producto.nombre,
                monto: monto,
                referencia: referencia,
                estado: 'Pendiente'
            });

            alert("¡Pedido enviado con éxito! La administración verificará tu pago próximamente.");
            renderizarMisPedidos(estudiante, modal);
        } catch (e) {
            console.error("Error al enviar pedido:", e);
            alert("Error al enviar el pedido. Inténtalo de nuevo.");
            btnEnviar.innerText = "✅ Enviar Pedido";
            btnEnviar.disabled = false;
        }
    });
}

function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        alert(`¡Copiado: ${texto}!`);
    });
}

function renderizarMisPedidos(estudiante, modal) {
    const susPedidos = bdPedidosTienda.filter(p => p.idQR_estudiante === estudiante.idQR);

    modal.innerHTML = `
        <div class="modal-contenido" style="max-width: 520px; width: 94%; max-height: 85vh; overflow-y: auto;">
            <button class="btn-cerrar-modal" id="btn-cerrar-tienda">✕</button>
            <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 18px; text-align: center;">🛒 Tienda Escolar</h3>
            
            <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                <button id="tab-cat" class="btn-plan" style="flex:1; background:#e2e8f0; color:#1e3a8a;">🛍️ Catálogo</button>
                <button id="tab-mis-pedidos" class="btn-plan" style="flex:1; background:#1e3a8a; color:white;">📦 Mis Pedidos (${susPedidos.length})</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${susPedidos.length === 0 ? '<p style="text-align:center; color:#64748b; font-size:13px; padding:20px;">No tienes pedidos registrados todavía.</p>' : 
                  susPedidos.map(p => `
                    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff; font-size: 12px;">
                        <p style="margin: 2px 0;"><strong>Producto:</strong> ${p.producto}</p>                         <p style="margin: 2px 0;"><strong>Monto:</strong> $${p.monto} \vert{} <strong>Ref:</strong>${p.referencia}</p>
                        <p style="margin: 2px 0;"><strong>Fecha:</strong> ${p.fecha} (${p.hora})</p>
                        <p style="margin: 4px 0;"><strong>Estatus:</strong> <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${p.estado === 'Confirmado' ? '#d1fae5; color: #065f46;' : '#fef3c7; color: #92400e;'}">${p.estado}</span></p>${p.estado === 'Confirmado' ? `<button onclick='descargarComprobante(${JSON.stringify(p)})' style="margin-top: 6px; background: #059669; color: white; border: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; width: 100%;">📥 Descargar Comprobante de Pago</button>` : '<p style="color: #64748b; font-style: italic; font-size: 11px; margin: 4px 0 0 0;">⏳ Su pago está siendo verificado por la administración.</p>'}
                    </div>
                  `).join('')}
            </div>
        </div>
    `;

    document.getElementById('btn-cerrar-tienda').addEventListener('click', () => { modal.style.display = 'none'; });
    document.getElementById('tab-cat').addEventListener('click', () => renderizarVistaTiendaCatalogo(estudiante, modal));
    document.getElementById('tab-mis-pedidos').addEventListener('click', () => renderizarMisPedidos(estudiante, modal));
}

function descargarComprobante(p) {
    let win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head><title>Comprobante de Pago - Tienda Escolar</title></head>
        <body style="font-family: Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 600px; margin: auto; border: 2px solid #1e3a8a; border-radius: 12px;">
            <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
                <h2 style="color: #1e3a8a; margin: 0;">Portal Escolar</h2>
                <h3 style="color: #059669; margin: 5px 0;">Comprobante Oficial de Compra y Pago</h3>
            </div>
            <p><strong>Estudiante:</strong> ${p.estudiante}</p>
            <p><strong>Grado:</strong> ${p.grado}</p>
            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 15px 0;">
            <p><strong>Producto Adquirido:</strong> ${p.producto}</p>
            <p><strong>Monto Cancelado:</strong> $${p.monto}</p>
            <p><strong>Número de Referencia (Pago Móvil):</strong> ${p.referencia}</p>
            <p><strong>Fecha del Pedido:</strong> ${p.fecha} - ${p.hora}</p>
            <p><strong>Estatus de Verificación:</strong> <span style="color: #059669; font-weight: bold;">APROBADO / CONFIRMADO</span></p>
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                <p>Este documento certifica que el pago ha sido verificado y procesado exitosamente por la administración del colegio.</p>
                <button onclick="window.print()" style="background: #1e3a8a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 10px;">🖨️ Imprimir / Guardar PDF</button>
            </div>
        </body>
        </html>
    `);
    win.document.close();
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
    const fechasAsistidasNorm = registrosAlumno.map(r => obtenerFechaNormalizada(r.fecha));

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
        const fechaDiaNorm = `${dia}/${mes + 1}/${ano}`;
        const asistio = fechasAsistidasNorm.some(fNorm => fNorm === fechaDiaNorm);

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

// --- 5. PERFIL ADMINISTRATIVO (PERSONAL AUTORIZADO) ---
function obtenerFechaNormalizada(fechaStr) {
    if (!fechaStr) return "";
    if (fechaStr.includes("-")) {
        const [y, m, d] = fechaStr.split("-");
        return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    }
    if (fechaStr.includes("/")) {
        const [d, m, y] = fechaStr.split("/");
        return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    }
    return fechaStr;
}

function normalizarGradoBase(gradoRaw) {
    if (!gradoRaw) return "";
    const str = String(gradoRaw).trim().toUpperCase();
    if (str.includes("III") || str.includes("3ER GRUPO")) return "III Grupo";
    if (str.includes("II") || str.includes("2DO GRUPO")) return "II Grupo";
    if (str.includes("I GRUPO") || str.includes("1ER GRUPO")) return "I Grupo";
    if (str.includes("1")) return "1er Grado A";
    if (str.includes("2")) return "2do Grado A";
    if (str.includes("3")) return "3er Grado A";
    if (str.includes("4")) return "4to Grado A";
    if (str.includes("5")) return "5to Grado A";
    if (str.includes("6")) return "6to Grado A";
    return gradoRaw.trim();
}

function calcularAsistenciaHoyPorGrado() {
    const hoy = new Date();
    const fechaHoyNorm = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
    const conteos = { "I Grupo": 0, "II Grupo": 0, "III Grupo": 0, "1er Grado A": 0, "2do Grado A": 0, "3er Grado A": 0, "4to Grado A": 0, "5to Grado A": 0, "6to Grado A": 0 };

    bdAsistencia.forEach(reg => {
        const fechaRegNorm = obtenerFechaNormalizada(reg.fecha);
        if (fechaRegNorm === fechaHoyNorm) {
            const est = bdEstudiantes.find(e => e.idQR === reg.idQR);
            if (est) {
                const gradoBase = normalizarGradoBase(est.grado);
                if (conteos[gradoBase] !== undefined) conteos[gradoBase]++;
            }
        }
    });
    return conteos;
}

const modalPin = document.getElementById('modal-pin');
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnCerrarPin = document.getElementById('btn-cerrar-pin');
const btnConfirmarPin = document.getElementById('btn-confirmar-pin');
const inputPin = document.getElementById('input-pin');

// Cambiar texto del botón a Personal Autorizado si existe
if(btnAdminLogin) btnAdminLogin.innerText = "🔐 Personal Autorizado";

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

function iniciarPanelAdmin() {
    document.getElementById('btn-escanear').style.display = 'none';
    document.getElementById('btn-admin-login').style.display = 'none';
    if (document.getElementById('texto-inicio')) document.getElementById('texto-inicio').style.display = 'none';

    const resultadoDiv = document.getElementById('resultado');
    const conteosHoy = calcularAsistenciaHoyPorGrado();

    resultadoDiv.innerHTML = `
        <div class="dashboard">
            <h2 style="color: #1e3a8a; margin: 0 0 5px 0; font-size: 18px;">🔐 Panel de Personal Autorizado</h2>
            
            <div style="display: flex; gap: 8px; margin: 10px 0;">
                <button id="btn-tab-asistencia" class="btn-plan" style="flex:1; background:#1e3a8a; color:white;">📋 Asistencia en Vivo</button>
                <button id="btn-tab-tienda-admin" class="btn-plan" style="flex:1; background:#e2e8f0; color:#1e3a8a;">🛒 Adm. Tienda</button>
            </div>

            <div id="panel-admin-contenido">
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
            </div>

            <button id="btn-cerrar-admin" class="btn-salida" style="margin-top: 10px;">🚪 Salir de Personal Autorizado</button>
        </div>
    `;

    document.getElementById('btn-tab-asistencia').addEventListener('click', () => iniciarPanelAdmin());
    
    // Al hacer clic en Adm. Tienda, lanzamos el modal estilizado pidiendo la contraseña 2503
    document.getElementById('btn-tab-tienda-admin').addEventListener('click', () => {
        solicitarPasswordTienda();
    });

    document.getElementById('btn-cerrar-admin').addEventListener('click', () => {
        if (escanerContinuo) escanerContinuo.clear();
        location.reload();
    });

    escanerContinuo = new Html5QrcodeScanner("lector-qr-admin", { fps: 10, qrbox: { width: 220, height: 220 } }, false);
    escanerContinuo.render(alEscanearModoGuardia, () => {});
}

// NUEVA FUNCIÓN: Modal estilizado para la clave de administración de tienda
function solicitarPasswordTienda() {
    let modal = document.getElementById('modal-password-tienda');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-password-tienda';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-contenido" style="max-width: 340px; width: 90%; text-align: center; padding: 25px;">
            <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px;">🔒 Seguridad de Tienda</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 15px;">Ingrese la contraseña de administración:</p>
            <input type="password" id="input-password-tienda" placeholder="••••" style="width: 80%; padding: 10px; font-size: 18px; text-align: center; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 15px; letter-spacing: 4px;" maxlength="6">
            <div style="display: flex; gap: 10px;">
                <button id="btn-cancelar-pwd" style="flex: 1; background: #64748b; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">Cancelar</button>
                <button id="btn-confirmar-pwd" style="flex: 1; background: #1e3a8a; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer;">Entrar</button>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    const inputPwd = document.getElementById('input-password-tienda');
    inputPwd.focus();

    // Eventos de los botones del modal
    document.getElementById('btn-cancelar-pwd').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    const validarPwd = () => {
        if (inputPwd.value === PIN_TIENDA) {
            modal.style.display = 'none';
            renderizarPanelAdminTienda();
        } else {
            alert("Contraseña incorrecta");
            inputPwd.value = '';
            inputPwd.focus();
        }
    };

    document.getElementById('btn-confirmar-pwd').addEventListener('click', validarPwd);
    inputPwd.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validarPwd();
    });
}

function renderizarPanelAdminTienda() {
    if (escanerContinuo) escanerContinuo.clear();
    const contenido = document.getElementById('panel-admin-contenido');
    
    document.getElementById('btn-tab-asistencia').style.background = "#e2e8f0";
    document.getElementById('btn-tab-asistencia').style.color = "#1e3a8a";
    document.getElementById('btn-tab-tienda-admin').style.background = "#1e3a8a";
    document.getElementById('btn-tab-tienda-admin').style.color = "white";

    contenido.innerHTML = `
        <h4 style="color: #1e3a8a; margin: 10px 0;">📦 Pedidos Recibidos de la Tienda</h4>
        <div style="max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
            ${bdPedidosTienda.length === 0 ? '<p style="text-align:center; color:#64748b; font-size:13px;">No hay pedidos registrados.</p>' :
              bdPedidosTienda.map((p, idx) => `
                <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #fff; font-size: 12px; text-align: left;">
                    <p style="margin: 2px 0;"><strong>Estudiante:</strong> ${p.estudiante} (${p.grado})</p>
                    <p style="margin: 2px 0;"><strong>Producto:</strong> ${p.producto} - <strong>Monto:</strong>$${p.monto}</p>
                    <p style="margin: 2px 0;"><strong>Referencia:</strong> ${p.referencia} \vert{} <strong>Fecha:</strong>${p.fecha}</p>
                    <p style="margin: 4px 0;"><strong>Estatus:</strong> <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${p.estado === 'Confirmado' ? '#d1fae5; color: #065f46;' : '#fef3c7; color: #92400e;'}">${p.estado}</span></p>${p.estado !== 'Confirmado' ? `<button onclick="confirmarPagoAdmin('${p.referencia}')" style="margin-top: 6px; background: #059669; color: white; border: none; padding: 6px 10px; border-radius: 5px; font-size: 11px; cursor: pointer;">✅ Pago Confirmado</button>` : '<span style="color: #059669; font-weight: bold; font-size: 11px;">✓ Pago Procesado</span>'}
                </div>
              `).join('')}
        </div>
    `;

    document.getElementById('btn-tab-asistencia').addEventListener('click', () => iniciarPanelAdmin());
}

async function confirmarPagoAdmin(referencia) {
    if (!confirm(`¿Confirmar el pago con referencia ${referencia}?`)) return;
    try {
        const params = new URLSearchParams({ tipo: 'confirmar_pago', referencia: referencia });
        await fetch(`${URL_APPS_SCRIPT}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });

        // Actualizar localmente
        const pedido = bdPedidosTienda.find(p => p.referencia === referencia);
        if (pedido) pedido.estado = 'Confirmado';

        alert("¡Pago confirmado con éxito!");
        renderizarPanelAdminTienda();
    } catch (e) {
        console.error("Error al confirmar pago:", e);
        alert("Error al procesar la confirmación.");
    }
}

// --- ESCANEO Y ACTUALIZACIÓN EN VIVO (PERSONAL AUTORIZADO) ---
async function alEscanearModoGuardia(codigoEscaneado) {
    if (procesandoEscaneo) return;
    procesandoEscaneo = true;

    const codigoLimpio = codigoEscaneado.trim();
    const estudiante = bdEstudiantes.find(e => e.idQR === codigoLimpio);
    const personal = bdPersonal.find(p => p.idQR === codigoLimpio);
    const alertaDiv = document.getElementById('alerta-escaneo');

    const hoy = new Date();
    const fechaStrNorm = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
    const horaStr = hoy.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (personal) {
        const yaRegistroEntrada = bdAsistenciaPersonal.some(a => a.idQR === codigoLimpio && obtenerFechaNormalizada(a.fecha) === fechaStrNorm);
        const yaRegistroSalida = bdAsistenciaPersonal.some(a => a.idQR === codigoLimpio && obtenerFechaNormalizada(a.fecha) === fechaStrNorm && a.hora_salida && a.hora_salida !== "");

        if (yaRegistroSalida) {
            alertaDiv.className = "alerta-escaneo repetido";
            alertaDiv.innerText = `⚠️ ${personal.nombres} ya registró salida hoy.`;
        } else if (yaRegistroEntrada) {
            alertaDiv.className = "alerta-escaneo exito";
            alertaDiv.innerText = `✅ Salida Registrada: ${personal.nombres} (${personal.cargo})`;
            enviarAsistencia(fechaStrNorm, horaStr, codigoLimpio, `${personal.nombres} ${personal.apellidos}`, 'personal', personal.cargo);
            const regLocal = bdAsistenciaPersonal.find(a => a.idQR === codigoLimpio && obtenerFechaNormalizada(a.fecha) === fechaStrNorm);
            if(regLocal) regLocal.hora_salida = horaStr;
        } else {
            alertaDiv.className = "alerta-escaneo exito";
            alertaDiv.innerText = `✅ Entrada Registrada: ${personal.nombres} (${personal.cargo})`;
            enviarAsistencia(fechaStrNorm, horaStr, codigoLimpio, `${personal.nombres} ${personal.apellidos}`, 'personal', personal.cargo);
            bdAsistenciaPersonal.push({ fecha: fechaStrNorm, idQR: codigoLimpio, hora_entrada: horaStr, hora_salida: "" });
        }

        alertaDiv.style.display = "block";
        setTimeout(() => { procesandoEscaneo = false; alertaDiv.style.display = "none"; }, 2500);
        return;
    }

    if (!estudiante) {
        alertaDiv.className = "alerta-escaneo repetido";
        alertaDiv.innerText = "❌ Carnet no registrado en el sistema";
        alertaDiv.style.display = "block";
        setTimeout(() => { procesandoEscaneo = false; alertaDiv.style.display = "none"; }, 2000);
        return;
    }

    const yaRegistrado = bdAsistencia.some(a => a.idQR === codigoLimpio && obtenerFechaNormalizada(a.fecha) === fechaStrNorm);

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

    bdAsistencia.push({ fecha: fechaStrNorm, hora: horaStr, idQR: codigoLimpio, estado: 'Presente' });

    const gradoBase = normalizarGradoBase(estudiante.grado);
    const idContador = `cnt-${gradoBase.replace(/\s+/g, '')}`;
    const elContador = document.getElementById(idContador);
    if (elContador) {
        const conteos = calcularAsistenciaHoyPorGrado();
        elContador.innerText = `${conteos[gradoBase] || 0} / 25`;
    }

    enviarAsistencia(fechaStrNorm, horaStr, codigoLimpio, `${estudiante.nombres} ${estudiante.apellidos}`, 'estudiante');

    setTimeout(() => {
        procesandoEscaneo = false;
        alertaDiv.style.display = "none";
    }, 2200);
}

async function enviarAsistencia(fecha, hora, idQR, nombre, tipo, cargo = "") {
    try {
        const params = new URLSearchParams({
            fecha: fecha,
            hora: hora,
            idQR: idQR,
            tipo: tipo,
            estado: 'Presente'
        });
        if (tipo === 'estudiante') params.append('estudiante', nombre);
        else if (tipo === 'personal') {
            params.append('empleado', nombre);
            params.append('cargo', cargo);
        }
        await fetch(`${URL_APPS_SCRIPT}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });
    } catch (e) {
        console.error("Error guardando asistencia:", e);
    }
}

// --- 6. ESCÁNER QR PRINCIPAL Y RENDERIZADO DEL PERFIL ---
const btnEscanear = document.getElementById('btn-escanear');
const resultadoDiv = document.getElementById('resultado');
const textoInicio = document.getElementById('texto-inicio');

btnEscanear.addEventListener('click', () => {
    btnEscanear.style.display = 'none';
    btnAdminLogin.style.display = 'none';
    if (textoInicio) textoInicio.style.display = 'none';
    resultadoDiv.innerHTML = "Cargando cámara...";

    const escaner = new Html5QrcodeScanner("lector-qr", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    escaner.render(alLeerQRPrincipal, () => {});

    function alLeerQRPrincipal(codigoEscaneado) {
        escaner.clear();
        btnEscanear.style.display = 'none';
        btnAdminLogin.style.display = 'none';
        if (textoInicio) textoInicio.style.display = 'none';

        const codigoLimpio = codigoEscaneado.trim();
        const estudiante = bdEstudiantes.find(est => est.idQR === codigoLimpio);
        const personal = bdPersonal.find(per => per.idQR === codigoLimpio);

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
                        <button id="btn-tienda-escolar" class="btn-plan" style="background: #059669; color: white;">🛒 Tienda Escolar</button>
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
            document.getElementById('btn-tienda-escolar').addEventListener('click', () => { abrirModalTienda(estudiante); });

            document.getElementById('btn-salir').addEventListener('click', () => {
                cerrarModalInvitaciones();
                location.reload();
            });

            if (fotosInvitaciones.length > 0) {
                setTimeout(abrirModalInvitaciones, 400);
            }
        
        } else if (personal) {
            let imgSrc = 'https://via.placeholder.com/80?text=Sin+Foto';
            if (personal.foto && personal.foto !== '') {
                const nombreArchivo = personal.foto.replace('fotos/', '');
                imgSrc = `fotos/${nombreArchivo}`;
            }

            resultadoDiv.innerHTML = `
                ${headerInstitucional}
                <div class="dashboard" style="padding: 12px; text-align: center;">
                    <h3 style="color: #1e3a8a; margin-top: 0;">Perfil de Personal</h3>
                    <img src="${imgSrc}" alt="Foto" style="width: 120px; height: 120px; border-radius: 50%; margin: 15px auto; display: block; border: 3px solid #cbd5e1;" onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
                    <h2 style="margin: 5px 0; font-size: 18px;">${personal.nombres} ${personal.apellidos}</h2>
                    <p style="margin: 5px 0; color: #475569; font-weight: bold; font-size: 14px;">Cargo: ${personal.cargo}</p>
                    <p style="margin: 5px 0 20px 0; color: #64748b; font-size: 12px;">C.I.: ${personal.cedula}</p>
                    <button id="btn-salir" class="btn-salida" style="padding: 10px; font-size: 14px; width: 100%;">🚪 Salir</button>
                </div>
            `;
            document.getElementById('btn-salir').addEventListener('click', () => { location.reload(); });

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
