<?php
$servidor = 'localhost';
$usuario = 'root';
$password = '';
$base_de_datos = 'salondebelleza';

$mysqli = new mysqli($servidor, $usuario, $password, $base_de_datos);
$conexion = $mysqli;
if ($conexion->connect_errno){
    echo "no se realizo la conexion: (" . $mysqli->connect_errno .")" . $mysqli->connect_error;
} else{
    //echo "conexion exitosa";    
}

?>