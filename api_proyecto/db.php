<?php

$servername = "localhost" ;
$username = "root" ;
$password = "" ;
$database = "mydb" ;

$conn = new mysqli($servername, $username, $password, $database) ;

if ($conn->connect_error) {
    die("Conexión Fallida: " . $conn->connect_error);
}

?>