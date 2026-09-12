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
        } else {
            include ("services/post.php");
        }
        
    }
}

?>