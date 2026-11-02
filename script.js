let coloniasData = [];
let municipioFiltro = 'todos'; 

// 1. Inyectar Modal para Maps
const modalHTML = document.createElement('div');
modalHTML.className = 'gmaps-modal';
modalHTML.id = 'gmapsModal';
modalHTML.innerHTML = `
    <div class="gmaps-header">
        <h3 class="gmaps-title" id="gmapsTitle">Ubicación</h3>
        <button class="gmaps-close" onclick="document.getElementById('gmapsModal').style.display='none'">X Cerrar</button>
    </div>
    <iframe id="gmapsIframe" class="gmaps-iframe" src="" loading="lazy"></iframe>
`;
document.body.appendChild(modalHTML);

// Íconos SVG Neón
const iconoCoche = `
    <svg viewBox="0 0 24 24" width="60" height="60" stroke="#00e5ff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 8px #00e5ff); margin-bottom: 10px;">
        <path d="M4 11l1.5-4.5A2 2 0 017.4 5h9.2a2 2 0 011.9 1.5L20 11"></path>
        <path d="M2 11h20v4a2 2 0 01-2 2h-1.5a2 2 0 01-1.8-1.4l-.2-.6H7.5l-.2.6A2 2 0 015.5 17H4a2 2 0 01-2-2v-4z"></path>
        <circle cx="7" cy="17" r="2.5" stroke="#39ff14" style="filter: drop-shadow(0 0 5px #39ff14);"></circle>
        <circle cx="17" cy="17" r="2.5" stroke="#39ff14" style="filter: drop-shadow(0 0 5px #39ff14);"></circle>
    </svg>
`;

// NUEVO: Chincheta 📍 exacta inclinada en neón
const iconoPin = `
    <svg class="pin-neon" viewBox="0 0 24 24" width="16" height="16" fill="#ff0055" style="transform: rotate(45deg);">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
    </svg>
`;

function showHome() {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `
        <div style="text-align: center; margin-top: 50px;">
            ${iconoCoche}
            <h2 style="color: #00e5ff; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Base de datos</h2>
        </div>
    `;
}

// 2. Cargar y Procesar Datos
async function loadData() {
    const results = document.getElementById('results');
    try {
        results.innerHTML = '<p style="color: #00e5ff; text-align: center; margin-top: 30px;">Cargando base de datos...</p>';
        const colRes = await fetch('colonias.json');
        if (!colRes.ok) throw new Error("No se encontró el archivo");
        
        const rawData = await colRes.json();
        let datosAplanados = [];
        
        if (!Array.isArray(rawData) && typeof rawData === 'object') {
            for (let estado in rawData) {
                if (Array.isArray(rawData[estado])) datosAplanados = datosAplanados.concat(rawData[estado]);
            }
        } else if (Array.isArray(rawData)) {
            datosAplanados = rawData;
        }

        const municipiosPermitidos = ['ecatepec', 'acolman', 'coacalco'];
        coloniasData = datosAplanados.filter(item => {
            const mun = (item.municipio || item.D_mnpio || item.d_mnpio || '').toLowerCase();
            return municipiosPermitidos.some(p => mun.includes(p));
        });
        
        showHome();
    } catch (error) {
        results.innerHTML = `<div style="color:#ff0055; background: #330011; padding: 15px; border-radius: 5px;"><b>ERROR:</b><br>${error.message}</div>`;
    }
}

// Filtro actual
function getDatosFiltrados() {
    if (municipioFiltro === 'todos') return coloniasData;
    return coloniasData.filter(item => {
        const mun = (item.municipio || item.D_mnpio || item.d_mnpio || '').toLowerCase();
        return mun.includes(municipioFiltro);
    });
}

// 3. Renderizar Listas (CP Interactivo o Colonias Simples)
function renderizarLista(tipo) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    const datosActivos = getDatosFiltrados();
    
    if(datosActivos.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 30px;">No hay datos para este filtro.</p>';
        return;
    }

    if (tipo === 'cp') {
        const cps = datosActivos.map(i => (i.cp || i.d_codigo || '').toString().trim()).filter(v => v !== '');
        const cpsUnicos = [...new Set(cps)].sort();

        cpsUnicos.forEach(cp => {
            const coloniasDelCP = datosActivos
                .filter(item => (item.cp || item.d_codigo || '').toString().trim() === cp)
                .map(item => item.colonia || item.d_asenta || 'Desconocida')
                .sort();

            const card = document.createElement('div');
            card.className = 'cp-card';
            card.innerHTML = `<span>CP: ${cp}</span> <span style="color: rgba(255,255,255,0.5); font-size: 0.9rem;">▼</span>`;
            
            const dropdown = document.createElement('div');
            dropdown.className = 'colonias-dropdown';
            dropdown.innerHTML = coloniasDelCP.map(col => `<p>${iconoPin} ${col}</p>`).join('');

            card.onclick = () => {
                const isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
                card.querySelector('span:last-child').innerText = isVisible ? '▼' : '▲';
                card.querySelector('span:last-child').style.color = isVisible ? 'rgba(255,255,255,0.5)' : '#00e5ff';
            };

            resultsContainer.appendChild(card);
            resultsContainer.appendChild(dropdown);
        });
    } else {
        const cols = datosActivos.map(i => (i.colonia || i.d_asenta || '').toString().trim()).filter(v => v !== '');
        const colsUnicas = [...new Set(cols)].sort();

        colsUnicas.forEach(col => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `${iconoPin} ${col}`; 
            resultsContainer.appendChild(div);
        });
    }
}

// 4. Motor de Búsqueda Normal
function searchZones(query) {
    if (coloniasData.length === 0) return;
    query = query.toLowerCase().trim();
    if (query === '') { showHome(); return; }

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
    const datosActivos = getDatosFiltrados();

    const matchData = datosActivos.filter(item => {
        const cp = (item.cp || item.d_codigo || '').toString().trim();
        const colonia = (item.colonia || item.d_asenta || '').toString().toLowerCase();
        return cp === query || colonia.includes(query);
    });

    if (matchData.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 30px;">No se encontraron resultados.</p>';
        return;
    }

    matchData.forEach(item => {
        const nombreColonia = item.colonia || item.d_asenta || 'Desconocida';
        const codigoPostal = item.cp || item.d_codigo || 'S/N';
        const nombreMunicipio = item.municipio || item.D_mnpio || item.d_mnpio || 'Desconocido';

        const card = document.createElement('div');
        card.className = 'colonia-card';
        card.innerHTML = `
            <h3>${nombreColonia}</h3>
            <p><strong>CP:</strong> ${codigoPostal}</p>
            <p><strong>Municipio:</strong> ${nombreMunicipio}</p>
            <button class="btn-mapa">${iconoPin} Mapa</button>
        `;
        
        card.querySelector('.btn-mapa').onclick = () => {
            const busqueda = `${nombreColonia}, ${codigoPostal}, ${nombreMunicipio}, Estado de México`;
            document.getElementById('gmapsTitle').innerText = nombreColonia;
            document.getElementById('gmapsIframe').src = `https://maps.google.com/maps?q=${encodeURIComponent(busqueda)}&t=m&z=15&output=embed&iwloc=near`;
            document.getElementById('gmapsModal').style.display = 'flex';
        };
        resultsContainer.appendChild(card);
    });
}

// 5. Configurar Eventos
document.getElementById('searchBtn').addEventListener('click', () => searchZones(document.getElementById('searchInput').value));
document.getElementById('searchInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchZones(e.target.value); });

const btnFiltros = document.querySelectorAll('.filter-btn');
btnFiltros.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetMun = e.target.getAttribute('data-mun');
        if (municipioFiltro === targetMun) {
            municipioFiltro = 'todos';
            e.target.classList.remove('active');
        } else {
            municipioFiltro = targetMun;
            btnFiltros.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        }
        
        const query = document.getElementById('searchInput').value;
        if (query) searchZones(query); else showHome();
    });
});

document.getElementById('btnListCP').addEventListener('click', () => renderizarLista('cp'));
document.getElementById('btnListCol').addEventListener('click', () => renderizarLista('colonia'));

// Iniciar
loadData();
