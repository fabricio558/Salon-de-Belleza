<?php

if (isset($_SERVER['REQUEST_METHOD'])){

    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if($_SERVER['REQUEST_METHOD'] == "GET"){
        
        if ($action === 'get_citas') {
            include("services/get_citas.php");
        } elseif ($action === 'get_cliente' || $action === 'get_clientes') {
            include("services/get_clientes.php");
        } elseif ($action === 'get_servicios') {
            include("services/get_servicios.php");
        } elseif ($action === 'get_estilistas') {
            include("services/get_estilistas.php");
        } elseif ($action === 'get_citas_dia') {
            include("services/get_citas_dia.php");
        } elseif ($action === 'get_citas_semana') {
            include("services/get_citas_semana.php");
        } elseif ($action === 'get_usuarios') {
            include("services/get_usuarios.php");
        } elseif ($action === 'get_perfil_recepcionista') {
            include("services/get_perfil_recepcionista.php");
        } elseif ($action === 'get_citas_cliente') {
            include("services/get_citas_cliente.php");
        } elseif ($action === 'get_clientes_lista') {
            include("services/get_clientes_lista.php");
        } elseif ($action === 'get_productos') {
            include("services/get_productos.php");
        } else {
            include("services/get.php");
        }
    }

    if($_SERVER['REQUEST_METHOD'] == "POST" ){
        
        if ($action === 'login') {
            include("services/login.php");
        } elseif ($action === 'crear_cita') {
            include("services/crear_cita.php");
        } elseif ($action === 'iniciar_servicio') {      
            include("services/iniciar_servicio.php");
        } elseif ($action === 'finalizar_servicio') {    
            include("services/finalizar_servicio.php");
        } elseif ($action === 'update_servicios_cita') {    
            include("services/update_servicios_cita.php");
        } elseif ($action === 'registrar_usuario') {
            include("services/registrar_usuario.php");
        } elseif ($action === 'update_rol_usuario') {
            include("services/update_rol_usuario.php");
        } elseif ($action === 'update_perfil_recepcionista') {
            include("services/update_perfil_recepcionista.php");
        } elseif ($action === 'update_contrasena') {
            include("services/update_contrasena.php");
        } elseif ($action === 'cancelar_cita') {
            include("services/cancelar_cita.php");
        } elseif ($action === 'reprogramar_cita') {
            include("services/reprogramar_cita.php");
        } elseif ($action === 'cancelar_cita_salon') {
            include("services/cancelar_cita_salon.php");
        } elseif ($action === 'reprogramar_cita_salon') {
            include("services/reprogramar_cita_salon.php");
        } else {
            include ("services/post.php");
        }
        
    }
}

?>