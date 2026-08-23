<?php

if (isset($_SERVER['REQUEST_METHOD'])){

    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if($_SERVER['REQUEST_METHOD'] == "GET"){
        include("services/get.php");
    }

    if($_SERVER['REQUEST_METHOD'] == "POST" ){
        
        if ($action === 'login') {
            include("services/login.php");
        } else {
            include ("services/post.php");
        }
        
    }
}

?>