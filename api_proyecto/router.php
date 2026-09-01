<?php

if (isset($_SERVER['REQUEST_METHOD'])){

    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if($_SERVER['REQUEST_METHOD'] == "GET"){
        
        if ($action === 'get_citas') {
            include("services/get_citas.php");
        } elseif ($action === 'get_cliente' || $action === 'get_clientes') {
            include("services/get_clientes.php");
        } elseif ($action === 'get_servicios') {          // 👈 nuevo
            include("services/get_servicios.php");
        } elseif ($action === 'get_estilistas') {          // 👈 nuevo
            include("services/get_estilistas.php");
        } else {
            include("services/get.php");
        }
    }

    if($_SERVER['REQUEST_METHOD'] == "POST" ){
        
        if ($action === 'login') {
            include("services/login.php");
        } elseif ($action === 'crear_cita') {              // 👈 nuevo
            include("services/crear_cita.php");
        } else {
            include ("services/post.php");
        }
        
    }
}

?>