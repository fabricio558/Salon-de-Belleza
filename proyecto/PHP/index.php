<?php
require ("conexion.php");
$sql="SELECT * FROM usuarios WHERE idRol=2";
$resultado=$mysqli->query($sql);
$sql2="SELECT * FROM services";
$resultado2=$mysqli->query($sql2);
$sql3="SELECT * FROM productos";
$resultado3=$mysqli->query($sql3);

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Cliente | Salón de Belleza</title>
    <!-- Fuente elegante desde Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;1,400&display=swap" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        body {
            background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%), 
                        radial-gradient(circle, rgba(255,192,203,0.3) 0%, rgba(255,255,255,1) 100%);
            min-height: 100vh;
            color: #4a4a4a;
            padding-bottom: 50px;
        }

        /* --- NAVEGACIÓN --- */
        header {
            background-color: #ffffff;
            box-shadow: 0 4px 20px rgba(230, 150, 170, 0.15);
            padding: 15px 30px;
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f2d6dc;
        }

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

        .logo {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 600;
            color: #e91e63;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        nav ul {
            display: flex;
            list-style: none;
            gap: 20px;
        }

        nav a {
            text-decoration: none;
            color: #7a7a7a;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.3s;
        }

        nav a:hover {
            color: #e91e63;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
        }
        /* --- VER MÁS SERVICIOS (corregido) --- */
        #servicios .card.servicio-extra {
            display: none;
        }
        
        #servicios .servicios-expandido .card.servicio-extra {
            display: flex;
        }
/* --- MENSAJE DE BIENVENIDA --- */
.welcome-message {
    width: 100%;
    background: linear-gradient(180deg, #fce4ec 0%, #fdf3f6 100%);
    border-bottom: 1px solid #f2d6dc;
    padding: 28px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;     /* centra todo horizontalmente */
    justify-content: center;
    text-align: center;
}

.welcome-message .divider {
    color: #e91e63;
    font-size: 14px;
    letter-spacing: 8px;
    margin-bottom: 8px;
    padding-left: 8px;       /* compensa el espacio final del letter-spacing */
}

.welcome-message h2 {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 28px;
    color: #d81b60;
    margin-bottom: 8px;
    text-align: center;
}

.welcome-message p {
    font-size: 14px;
    color: #7a7a7a;
    max-width: 520px;
    line-height: 1.6;
    text-align: center;
}

.welcome-message p strong {
    color: #e91e63;
    font-weight: 600;
}

        .avatar-small {
            width: 35px;
            height: 35px;
            background-color: #fce4ec;
            color: #d81b60;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .btn-logout {
            color: #888;
            text-decoration: none;
            font-size: 12px;
            margin-left: 10px;
            border: 1px solid #ccc;
            padding: 4px 8px;
            border-radius: 6px;
        }

        .btn-logout:hover {
            background-color: #fee;
            color: #d32f2f;
        }

        /* --- CONTENEDOR PRINCIPAL --- */
        .container {
            max-width: 1100px;
            margin: 30px auto;
            padding: 0 20px;
        }

        /* --- CARRUSEL --- */
        .carousel-container {
            position: relative;
            width: 100%;
            height: 320px;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(230, 150, 170, 0.2);
            margin-bottom: 40px;
        }

        .carousel-slide {
            display: flex;
            width: 300%;
            height: 100%;
            transition: transform 0.5s ease-in-out;
        }

        .slide {
            width: 100%;
            height: 100%;
            position: relative;
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .slide-1 {
            background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80');
        }

        .slide-2 {
            background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80');
        }

        .slide-3 {
            background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1200&q=80');
        }

        .slide-content {
            color: white;
            text-align: center;
            padding: 20px;
        }

        .slide-content h2 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            margin-bottom: 10px;
        }

        .slide-content p {
            font-size: 16px;
        }

        .carousel-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(255, 255, 255, 0.7);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            color: #d81b60;
            transition: background-color 0.3s;
        }

        .carousel-btn:hover {
            background-color: #ffffff;
        }

        .prev { left: 15px; }
        .next { right: 15px; }

        /* --- TÍTULOS DE SECCIÓN --- */
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            color: #4a4a4a;
            margin-bottom: 20px;
            margin-top: 40px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .section-title::after {
            content: "";
            flex-grow: 1;
            height: 1px;
            background-color: #f2d6dc;
        }

        /* --- TARJETAS / GRIDS --- */
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
        }

        .card {
            background-color: #ffffff;
            border-radius: 15px;
            padding: 20px;
            border: 1px solid #f2d6dc;
            box-shadow: 0 5px 15px rgba(230, 150, 170, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-align: center;
        }

        .card:hover {
            transform: translateY(-50px);
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(230, 150, 170, 0.25);
        }

        .card-img {
            width: 100%;
            height: 140px;
            object-fit: cover;
            border-radius: 10px;
            margin-bottom: 12px;
        }

        .card h3 {
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
        }

        .card p {
            font-size: 12px;
            color: #7a7a7a;
            margin-bottom: 10px;
        }

        .price {
            font-size: 18px;
            font-weight: 600;
            color: #e91e63;
            margin-bottom: 12px;
        }

        /* --- BOTONES --- */
        .btn-action {
            width: 100%;
            padding: 9px;
            background: linear-gradient(45deg, #e91e63, #f48fb1);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-action:hover {
            box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
        }

        .btn-edit {
            background: #ffa726;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-right: 5px;
        }

        .btn-cancel {
            background: #ef5350;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        /* --- ARREGLO TARJETAS DE SERVICIOS --- */
#servicios .card {
    display: flex;
    flex-direction: column;
}

#servicios .card-img {
    flex-shrink: 0;
    height: 140px;
}

#servicios .card h3 {
    line-height: 1.3;
    min-height: 2.6em; /* reserva siempre 2 líneas */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

#servicios .card p {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

#servicios .card .price {
    margin-top: auto; /* empuja precio y botón abajo */
}

        /* --- TABLA DE TURNOS --- */
        .appointments-container {
            background-color: #ffffff;
            border-radius: 15px;
            padding: 20px;
            border: 1px solid #f2d6dc;
            box-shadow: 0 5px 15px rgba(230, 150, 170, 0.1);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
        }

        th, td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }

        th {
            background-color: #fce4ec;
            color: #d81b60;
            font-weight: 600;
        }

        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .badge-pending {
            background-color: #fff3e0;
            color: #ef6c00;
        }

        /* --- MODAL PARA AGENDAR/EDITAR TURNO --- */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 2000;
        }

        .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            position: relative;
        }

        .close-modal {
            position: absolute;
            top: 15px;
            right: 20px;
            font-size: 20px;
            cursor: pointer;
            color: #aaa;
        }

        .form-group {
            text-align: left;
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #7a7a7a;
            margin-bottom: 6px;
        }

        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 13px;
            outline: none;
        }

        .form-group input:focus, .form-group select:focus {
            border-color: #e91e63;
        }

    </style>
</head>
<body>

    <!-- NAVEGACIÓN -->
    <header>
        <div class="logo">
            ✨ MANDALA 
        </div>
        <nav>
            <ul>
                <li><a href="#servicios">Servicios</a></li>
                <li><a href="#productos">Productos</a></li>
                <li><a href="#estilistas">Estilistas</a></li>
            </ul>
        </nav>
        <nav>
            <ul>
              <li><a href="../../proyecto/html/login.html">Inicio Sesion</a></li>
            </ul>
        </nav>
        
       
    </header>
</header>

<!-- MENSAJE DE BIENVENIDA -->
<div class="welcome-message">
    <div class="divider">✦ ✦ ✦</div>
    <h2>Tu momento de brillar empieza acá</h2>
    <p>
        <strong>Iniciá sesión</strong> y reservá tu turno en un minuto.
        Vos elegís el servicio, nosotras nos ocupamos del resto.
    </p>
</div>

<div class="container">
<div id="servicios">
    <div class="section-title">
        💇‍♀️ Nuestros Servicios
    </div>
    <div class="grid" id="serviciosGrid">
        <?php if ($resultado2->num_rows > 0) { ?>
            <?php $i = 0; ?>
            <?php while ($servicio = mysqli_fetch_assoc($resultado2)) { ?>
                <div class="card <?php echo $i >= 4 ? 'servicio-extra' : ''; ?>">
                    <img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80" class="card-img" alt="<?php echo htmlspecialchars($servicio['servicio']); ?>">
                    <h3><?php echo htmlspecialchars($servicio['servicio']); ?></h3>
                    <?php if (!empty($servicio['descripcion'])) { ?>
                        <p><?php echo htmlspecialchars($servicio['descripcion']); ?></p>
                    <?php } ?>
                    <div class="price">
                        $<?php echo is_numeric($servicio['precio']) ? number_format($servicio['precio'], 0, ',', '.') : htmlspecialchars($servicio['precio']); ?>
                    </div>

                </div>
                <?php $i++; ?>
            <?php } ?>
        <?php } else { ?>
            <p>No hay servicios disponibles.</p>
        <?php } ?>
    </div>

    <?php if ($resultado2->num_rows > 4) { ?>
        <div class="ver-mas-wrap">
            <button class="btn-action" onclick="toggleServicios(this)">Ver más</button>
        </div>
    <?php } ?>
</div>



 <!-- PRODUCTOS -->
        <?php
        // Imágenes para los productos (una distinta a cada uno, en orden).
        // Si tenés más de 3 productos, agregá más URLs acá.
        $imagenesProductos = [
            "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1608248597309-10056a07fc58?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80",
            // "https://...cuarta imagen...",
        ];
        $limiteProductos = 4; // cuántos se ven antes del "Ver más"
        ?>
        <div id="productos">
            <div class="section-title">
                🛍️ Productos en Venta
            </div>

            <?php if ($resultado3->num_rows > 0) { ?>
                <div class="grid">
                    <?php
                    $i = 0;
                    while ($productos = mysqli_fetch_assoc($resultado3)) {
                        $imagen = $imagenesProductos[$i % count($imagenesProductos)];
                        $oculto = ($i >= $limiteProductos) ? ' producto-extra' : '';
                    ?>
                        <div class="card<?php echo $oculto; ?>" <?php echo $oculto ? 'style="display:none;"' : ''; ?>>
                            <img src="<?php echo $imagen; ?>" class="card-img" alt="<?php echo htmlspecialchars($productos['nombreProducto']); ?>">
                            <h3><?php echo htmlspecialchars($productos['nombreProducto']); ?></h3>
                            <p><?php echo htmlspecialchars($productos['marca']); ?> · Stock: <?php echo (int)$productos['stock']; ?></p>
                            <div class="price">$<?php echo number_format($productos['precioVenta'], 0, ',', '.'); ?></div>
                        </div>
                    <?php
                        $i++;
                    } ?>
                </div>

                <?php if ($i > $limiteProductos) { ?>
                    <div style="text-align:center; margin-top:15px;">
                        <button type="button" id="btnVerMasProductos" class="btn" onclick="toggleProductos()">Ver más</button>
                    </div>
                <?php } ?>
                       <?php } else { ?>
                <div style="text-align:center; padding:40px 20px; background:#fff; border:2px dashed #e5d5e8; border-radius:16px; color:#8a7a8f;">
                    <div style="font-size:48px; margin-bottom:10px;">🛍️</div>
                    <h3 style="margin:0 0 6px 0; font-weight:600;">Sin productos por ahora</h3>
                    <p style="margin:0; font-size:14px;">Estamos reponiendo stock. ¡Volvé pronto!</p>
                </div>
            <?php } ?>
        </div>
        <!-- ESTILISTAS -->
                <!-- ESTILISTAS -->
        <div id="estilistas">
            <div class="section-title">
                ✂️ Nuestro Equipo
            </div>
            <div class="grid">
                <?php if ($resultado->num_rows > 0) { ?>
                    <?php while ($estilistas = mysqli_fetch_assoc($resultado)) { ?>
                        <div class="card">
                            <div class="avatar-small" style="width: 70px; height: 70px; margin: 0 auto 10px auto; font-size: 30px;">👤</div>
                            <h3><?php echo $estilistas['nombres']; ?> <?php echo $estilistas['apellido']; ?></h3>
                        </div>
                    <?php } ?>
                <?php } else { ?>
                    <p>No hay estilistas disponibles.</p>
                <?php } ?>
            </div>
        </div>

        



    <script>
         function toggleProductos() {
                var extras = document.querySelectorAll('.producto-extra');
                var btn = document.getElementById('btnVerMasProductos');
                var ocultos = extras.length > 0 && extras[0].style.display === 'none';
                extras.forEach(function (el) {
                    el.style.display = ocultos ? '' : 'none';
                });
                btn.textContent = ocultos ? 'Ver menos' : 'Ver más';
            }
        // --- VER MÁS / VER MENOS SERVICIOS ---
function toggleServicios(btn) {
    const grid = document.getElementById('serviciosGrid');
    const abierto = grid.classList.toggle('servicios-expandido');
    btn.innerText = abierto ? 'Ver menos' : 'Ver más';
}


        // --- LÓGICA DEL CARRUSEL ---
        let currentSlide = 0;
        const slides = document.getElementById('carouselSlide');
        const totalSlides = 3;

        function moveSlide(direction) {
            currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
            slides.style.transform = `translateX(-${currentSlide * 33.333}%)`;
        }

        // Carrusel automático cada 4 segundos      
        setInterval(() => moveSlide(1), 4000);


    </script>

</body>
</html>