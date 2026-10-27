<?php
session_start();
require("conexion.php");
$nombreCliente=$_SESSION["usuario"];


$estilistas = $mysqli->query("SELECT * FROM usuarios WHERE idRol=2")->fetch_all(MYSQLI_ASSOC);
$servicios  = $mysqli->query("SELECT * FROM services")->fetch_all(MYSQLI_ASSOC);
$productos  = $mysqli->query("SELECT * FROM productos")->fetch_all(MYSQLI_ASSOC);

$limiteServicios = 4;
$limiteProductos = 4;
$imagenesProductos = [
    "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1608248597309-10056a07fc58?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
];
$imagenServicio = "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80";
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mi Panel | Mandala</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; font-family:'Poppins',sans-serif; }
body { background: linear-gradient(135deg,#fdfbfb 0%,#ebedee 100%), radial-gradient(circle,rgba(255,192,203,.3) 0%,rgba(255,255,255,1) 100%); min-height:100vh; color:#4a4a4a; padding-bottom:50px; }
/* --- BOTÓN VER MÁS --- */
.ver-mas-wrap {
    text-align: center;
    margin-top: 35px;      /* más separación de las tarjetas */
}

.ver-mas-wrap .btn-action {
    width: auto;           /* pisa el 100% y se ajusta al texto */
    padding: 10px 35px;    /* largo del botón */
    border-radius: 25px;
}
header { background:#fff; box-shadow:0 4px 20px rgba(230,150,170,.15); padding:15px 30px; position:sticky; top:0; z-index:1000; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f2d6dc; }
.logo { font-family:'Playfair Display',serif; font-size:22px; font-weight:600; color:#e91e63; }
nav ul { display:flex; list-style:none; gap:20px; }
nav a { text-decoration:none; color:#7a7a7a; font-size:14px; font-weight:500; transition:color .3s; }
nav a:hover { color:#e91e63; }
.user-profile { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:500; }
.avatar-small { width:35px; height:35px; background:#fce4ec; color:#d81b60; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:18px; }
.btn-logout { color:#888; text-decoration:none; font-size:12px; margin-left:10px; border:1px solid #ccc; padding:4px 8px; border-radius:6px; }
.btn-logout:hover { background:#fee; color:#d32f2f; }

.container { max-width:1100px; margin:30px auto; padding:0 20px; }

.welcome { background:linear-gradient(45deg,#e91e63,#f48fb1); color:#fff; border-radius:20px; padding:28px 30px; margin-bottom:30px; display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; box-shadow:0 10px 25px rgba(230,150,170,.3); }
.welcome h1 { font-family:'Playfair Display',serif; font-size:26px; margin-bottom:4px; }
.welcome p { font-size:14px; opacity:.95; }
.welcome .btn-white { background:#fff; color:#e91e63; border:none; padding:11px 22px; border-radius:10px; font-weight:600; font-size:13px; cursor:pointer; }

.carousel-container { position:relative; width:100%; height:320px; border-radius:20px; overflow:hidden; box-shadow:0 10px 25px rgba(230,150,170,.2); margin-bottom:40px; }
.carousel-slide { display:flex; width:300%; height:100%; transition:transform .5s ease-in-out; }
.slide { width:100%; height:100%; background-size:cover; background-position:center; display:flex; align-items:center; justify-content:center; }
.slide-1 { background-image:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.3)),url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80'); }
.slide-2 { background-image:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.3)),url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'); }
.slide-3 { background-image:linear-gradient(rgba(0,0,0,.3),rgba(0,0,0,.3)),url('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80'); }
.slide-content { color:#fff; text-align:center; padding:20px; }
.slide-content h2 { font-family:'Playfair Display',serif; font-size:32px; margin-bottom:10px; }
.carousel-btn { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,.7); border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:18px; color:#d81b60; }
.carousel-btn:hover { background:#fff; }
.prev { left:15px; } .next { right:15px; }

.section-title { font-family:'Playfair Display',serif; font-size:24px; color:#4a4a4a; margin:40px 0 20px; display:flex; align-items:center; gap:10px; }
.section-title::after { content:""; flex-grow:1; height:1px; background:#f2d6dc; }

.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:20px; }
.card { background:#fff; border-radius:15px; padding:20px; border:1px solid #f2d6dc; box-shadow:0 5px 15px rgba(230,150,170,.1); transition:transform .3s, box-shadow .3s; text-align:center; display:flex; flex-direction:column; }
.card:hover { transform:translateY(-5px); box-shadow:0 8px 25px rgba(230,150,170,.25); }
.card-img { width:100%; height:140px; object-fit:cover; border-radius:10px; margin-bottom:12px; flex-shrink:0; }
.card h3 { font-size:16px; color:#333; margin-bottom:5px; line-height:1.3; min-height:2.6em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.card p { font-size:12px; color:#7a7a7a; margin-bottom:10px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.price { font-size:18px; font-weight:600; color:#e91e63; margin:auto 0 12px; }
.extra { display:none; }
.expandido .extra { display:flex; }
.ver-mas-wrap { text-align:center; margin-top:15px; }
.ver-mas-wrap .btn-action { width:auto; padding:9px 28px; }

.btn-action { width:100%; padding:9px; background:linear-gradient(45deg,#e91e63,#f48fb1); border:none; border-radius:8px; color:#fff; font-size:13px; font-weight:600; cursor:pointer; transition:all .3s; }
.btn-action:hover { box-shadow:0 4px 12px rgba(233,30,99,.3); }
.btn-edit { background:#ffa726; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-right:5px; }
.btn-cancel { background:#ef5350; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; }

.appointments-container { background:#fff; border-radius:15px; padding:20px; border:1px solid #f2d6dc; box-shadow:0 5px 15px rgba(230,150,170,.1); overflow-x:auto; }
table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }
th, td { padding:12px 15px; border-bottom:1px solid #eee; }
th { background:#fce4ec; color:#d81b60; font-weight:600; }
.badge { padding:4px 8px; border-radius:12px; font-size:11px; font-weight:600; }
.badge-pending { background:#fff3e0; color:#ef6c00; }
.badge-ok { background:#e8f5e9; color:#2e7d32; }

.modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,.5); justify-content:center; align-items:center; z-index:2000; padding:15px; }
.modal-content { background:#fff; padding:30px; border-radius:20px; width:100%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,.2); position:relative; }
.close-modal { position:absolute; top:15px; right:20px; font-size:20px; cursor:pointer; color:#aaa; }
.form-group { text-align:left; margin-bottom:15px; }
.form-group label { display:block; font-size:12px; font-weight:600; color:#7a7a7a; margin-bottom:6px; }
.form-group input, .form-group select { width:100%; padding:10px; border:1px solid #e0e0e0; border-radius:8px; font-size:13px; outline:none; }
.form-group input:focus, .form-group select:focus { border-color:#e91e63; }
.form-error { color:#d32f2f; font-size:12px; margin-bottom:10px; min-height:16px; }

@media (max-width:700px) { header { flex-wrap:wrap; gap:10px; } nav { order:3; width:100%; } }
</style>
</head>
<body>

<header>
    <div class="logo">✨ MANDALA</div>
    <nav>
        <ul>
            <li><a href="#mis-turnos">Mis Turnos</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#productos">Productos</a></li>
            <li><a href="#estilistas">Estilistas</a></li>
        </ul>
    </nav>
    <div class="user-profile">
        <div class="avatar-small">👤</div>
        <span><?php echo htmlspecialchars($nombreCliente); ?></span>
        <a href="../../proyecto/PHP/index.php" class="btn-logout">Salir</a>
    </div>
</header>

<div class="container">

    <div class="welcome">
        <div>
            <h1>¡Hola, <?php echo htmlspecialchars($nombreCliente); ?>! 💖</h1>
            <p>Gestioná tus turnos y descubrí nuestros servicios.</p>
        </div>
        <button class="btn-white" onclick="openModal()">+ Nuevo turno</button>
    </div>

    <div class="carousel-container">
        <div class="carousel-slide" id="carouselSlide">
            <div class="slide slide-1"><div class="slide-content"><h2>Especiales de Primavera</h2><p>20% de descuento en Tintes y Tratamientos Capilares</p></div></div>
            <div class="slide slide-2"><div class="slide-content"><h2>Manicura Spa &amp; Pedicura</h2><p>Luce unas uñas impecables con nuestros esmaltados en gel</p></div></div>
            <div class="slide slide-3"><div class="slide-content"><h2>Peinados &amp; Maquillaje</h2><p>Reserva tu turno para tus eventos especiales</p></div></div>
        </div>
        <button class="carousel-btn prev" onclick="moveSlide(-1)">&#10094;</button>
        <button class="carousel-btn next" onclick="moveSlide(1)">&#10095;</button>
    </div>

    <!-- MIS TURNOS -->
    <div id="mis-turnos">
        <div class="section-title">📅 Mis Turnos</div>
        <div class="appointments-container">
            <table>
                <thead>
                    <tr><th>Servicio</th><th>Estilista</th><th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody id="turnosTableBody"></tbody>
            </table>
        </div>
    </div>

    <!-- SERVICIOS -->
    <div id="servicios">
        <div class="section-title">💇‍♀️ Nuestros Servicios</div>
        <?php if ($servicios) { ?>
            <div class="grid" id="serviciosGrid">
                <?php foreach ($servicios as $i => $s) { ?>
                    <div class="card <?php echo $i >= $limiteServicios ? 'extra' : ''; ?>">
                        <img src="<?php echo $imagenServicio; ?>" class="card-img" alt="<?php echo htmlspecialchars($s['servicio']); ?>">
                        <h3><?php echo htmlspecialchars($s['servicio']); ?></h3>
                        <?php if (!empty($s['descripcion'])) { ?><p><?php echo htmlspecialchars($s['descripcion']); ?></p><?php } ?>
                        <div class="price">$<?php echo is_numeric($s['precio']) ? number_format($s['precio'], 0, ',', '.') : htmlspecialchars($s['precio']); ?></div>
                        <button class="btn-action" onclick='openModalWithService(<?php echo htmlspecialchars(json_encode($s['servicio']), ENT_QUOTES); ?>)'>Agendar Turno</button>
                    </div>
                <?php } ?>
            </div>
            <?php if (count($servicios) > $limiteServicios) { ?>
                <div class="ver-mas-wrap"><button class="btn-action" onclick="toggleGrid('serviciosGrid', this)">Ver más</button></div>
            <?php } ?>
        <?php } else { ?>
            <p>No hay servicios disponibles.</p>
        <?php } ?>
    </div>

    <!-- PRODUCTOS -->
    <div id="productos">
        <div class="section-title">🛍️ Productos en Venta</div>
        <?php if ($productos) { ?>
            <div class="grid" id="productosGrid">
                <?php foreach ($productos as $i => $p) { ?>
                    <div class="card <?php echo $i >= $limiteProductos ? 'extra' : ''; ?>">
                        <img src="<?php echo $imagenesProductos[$i % count($imagenesProductos)]; ?>" class="card-img" alt="<?php echo htmlspecialchars($p['nombreProducto']); ?>">
                        <h3><?php echo htmlspecialchars($p['nombreProducto']); ?></h3>
                        <p><?php echo htmlspecialchars($p['marca']); ?> · Stock: <?php echo (int)$p['stock']; ?></p>
                        <div class="price">$<?php echo number_format($p['precioVenta'], 0, ',', '.'); ?></div>
                    </div>
                <?php } ?>
            </div>
            <?php if (count($productos) > $limiteProductos) { ?>
                <div class="ver-mas-wrap"><button class="btn-action" onclick="toggleGrid('productosGrid', this)">Ver más</button></div>
            <?php } ?>
        <?php } else { ?>
            <div style="text-align:center;padding:40px 20px;background:#fff;border:2px dashed #e5d5e8;border-radius:16px;color:#8a7a8f;">
                <div style="font-size:48px;margin-bottom:10px;">🛍️</div>
                <h3 style="margin:0 0 6px;font-weight:600;">Sin productos por ahora</h3>
                <p style="margin:0;font-size:14px;">Estamos reponiendo stock. ¡Volvé pronto!</p>
            </div>
        <?php } ?>
    </div>

    <!-- ESTILISTAS -->
    <div id="estilistas">
        <div class="section-title">✂️ Nuestro Equipo</div>
        <div class="grid">
            <?php if ($estilistas) { foreach ($estilistas as $e) { ?>
                <div class="card">
                    <div class="avatar-small" style="width:70px;height:70px;margin:0 auto 10px;font-size:30px;">👤</div>
                    <h3><?php echo htmlspecialchars($e['nombres'] . ' ' . $e['apellido']); ?></h3>
                </div>
            <?php } } else { ?>
                <p>No hay estilistas disponibles.</p>
            <?php } ?>
        </div>
    </div>
</div>
<?php


$idCliente = (int)$_SESSION['idUsuarios'];

$sql = "SELECT c.idCitas,
               CONCAT(u.nombres, ' ', u.apellido) AS estilista,
               DATE(c.horaInicio) AS fecha,
               TIME_FORMAT(c.horaInicio, '%H:%i') AS hora,
               ec.estado_cita AS estado
        FROM citas c
        JOIN usuarios u     ON u.idUsuarios = c.estilistas
        JOIN estado_cita ec ON ec.idEstado  = c.estado_cita_idEstado
        WHERE c.clientes = ?
        ORDER BY c.horaInicio DESC";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $idCliente);
$stmt->execute();
$resultado = $stmt->get_result();
?>

<table>
  <tr>
    <th>Servicio</th><th>Estilista</th><th>Fecha</th><th>Hora</th><th>Estado</th>
  </tr>
  <?php while ($fila = $resultado->fetch_assoc()) { ?>
  <tr>
    <td><!-- servicio, ver abajo --></td>
    <td><?= htmlspecialchars($fila['estilista']) ?></td>
    <td><?= $fila['fecha'] ?></td>
    <td><?= $fila['hora'] ?></td>
    <td><?= htmlspecialchars($fila['estado']) ?></td>
    <td><!-- botones --></td>
  </tr>
  <?php } ?>
</table>

<!-- MODAL TURNO -->
<div class="modal" id="turnoModal">
    <div class="modal-content">
        <span class="close-modal" onclick="closeModal()">&times;</span>
        <h2 id="modalTitle" style="font-family:'Playfair Display',serif;margin-bottom:20px;font-size:20px;">Agendar Turno</h2>
        <form action="../../proyecto/PHP/turno.php" method="post" id="appointmentForm" >
            <input type="hidden" id="appointmentId">
            <div class="form-group">
                <label>Servicio</label>
            <select name="idServicio" id="serviceSelect" required>
            <option value="">Elegí un Servicio</option>
                <?php foreach ($servicios as $s) { ?>
            <option value="<?php echo (int)$s['idServicios']; ?>">
                <?php echo htmlspecialchars($s['servicio'] ); ?>
            </option>
            <?php } ?>
            
         </select>
            </div>
            
            <div class="form-group">
         <label>Estilista</label>
         <select name="idEstilista" id="estilistaSelect" required>
            <option value="">Elegí un estilista</option>
                <?php foreach ($estilistas as $e) { ?>
            <option value="<?php echo (int)$e['idUsuarios']; ?>">
                <?php echo htmlspecialchars($e['nombres'] . ' ' . $e['apellido']); ?>
            </option>
            <?php } ?>
         </select>

           
            <div class="form-group"><label>Fecha</label><input type="date" name="fecha" id="dateInput" required ></div>
            <div class="form-group"><label>Hora Inicio</label><input type="time" name="horaInicio" id="timeInput" required ></div>
            <div class="form-group"><label>Hora Fin</label><input type="time" name="horaFin" id="timeInput" required ></div>
            <div class="form-error" id="formError"></div>
            <button type="submit" class="btn-action">Guardar Turno</button>
        </form>
    </div>
</div>

<script>    
// --- VER MÁS / VER MENOS ---
function toggleGrid(id, btn) {
    const abierto = document.getElementById(id).classList.toggle('expandido');
    btn.innerText = abierto ? 'Ver menos' : 'Ver más';
}

// --- CARRUSEL ---
let currentSlide = 0;
const slides = document.getElementById('carouselSlide');
function moveSlide(d) {
    currentSlide = (currentSlide + d + 3) % 3;
    slides.style.transform = `translateX(-${currentSlide * 33.333}%)`;
}
setInterval(() => moveSlide(1), 4000);

// --- TURNOS ---
let appointments = [];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtFecha = f => f.split('-').reverse().join('/');

async function api(accion, data = {}) {
    const fd = new FormData();
    fd.append('accion', accion);
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    const r = await fetch('turnos_accion.php', { method: 'POST', body: fd });
    if (r.status === 401) { location.href = '../../proyecto/html/login.html'; return {ok:false}; }
    return r.json();
}

async function loadAppointments() {
    const res = await api('listar');
    appointments = res.turnos || [];
    renderAppointments();
}

function renderAppointments() {
    const tbody = document.getElementById('turnosTableBody');
    if (!appointments.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No tenés turnos agendados.</td></tr>';
        return;
    }
    tbody.innerHTML = appointments.map(a => `
        <tr>
            <td><strong>${esc(a.servicio)}</strong></td>
            <td>${esc(a.estilista)}</td>
            <td>${fmtFecha(a.fecha)}</td>
            <td>${a.hora.slice(0,5)} hs</td>
            <td><span class="badge ${a.estado === 'Confirmado' ? 'badge-ok' : 'badge-pending'}">${esc(a.estado)}</span></td>
            <td>
                <button class="btn-edit" onclick="editAppointment(${a.id})">Editar</button>
                <button class="btn-cancel" onclick="cancelAppointment(${a.id})">Cancelar</button>
            </td>
        </tr>`).join('');
}

function openModal() {
    document.getElementById('appointmentForm').reset();
    document.getElementById('appointmentId').value = '';
    document.getElementById('formError').innerText = '';
    document.getElementById('dateInput').min = new Date().toISOString().split('T')[0];
    document.getElementById('modalTitle').innerText = 'Agendar Nuevo Turno';
    document.getElementById('turnoModal').style.display = 'flex';
}
function openModalWithService(name) { openModal(); document.getElementById('serviceSelect').value = name; }
function closeModal() { document.getElementById('turnoModal').style.display = 'none'; }

async function saveAppointment(e) {
    e.preventDefault();
    const res = await api('guardar', {
        id: document.getElementById('appointmentId').value || 0,
        servicio: document.getElementById('serviceSelect').value,
        estilista: document.getElementById('stylistSelect').value,
        fecha: document.getElementById('dateInput').value,
        hora: document.getElementById('timeInput').value
    });
    if (!res.ok) { document.getElementById('formError').innerText = res.msg || 'Error al guardar.'; return; }
    closeModal();
    loadAppointments();
}

function editAppointment(id) {
    const a = appointments.find(x => x.id == id);
    if (!a) return;
    openModal();
    document.getElementById('appointmentId').value = a.id;
    document.getElementById('serviceSelect').value = a.servicio;
    document.getElementById('stylistSelect').value = a.estilista;
    document.getElementById('dateInput').value = a.fecha;
    document.getElementById('timeInput').value = a.hora.slice(0,5);
    document.getElementById('modalTitle').innerText = 'Editar Turno';
}

async function cancelAppointment(id) {
    if (!confirm('¿Seguro que querés cancelar este turno?')) return;
    await api('cancelar', { id });
    loadAppointments();
}

loadAppointments();
</script>
</body>
</html>