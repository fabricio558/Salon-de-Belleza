<?php
require ("conexion.php");
$nombre=$_POST["nombre"];
$nombreU=$_POST["usuario"];
$apellido=$_POST["apellido"];
$contra=$_POST["contrasena"];
$fechaN=$_POST["fechaN"];
$correo=$_POST["correo"];
$fechaCreacion= date("Y-m-d");
$sql="INSERT INTO usuarios (nombres, apellido, nombreUsuario, fechaNacimiento, correo, contrasena, fechaCreacion, estado, idRol) VALUES ('$nombre','$apellido','$nombreU','$fechaN','$correo','$contra','$fechaCreacion',1,1)";
$mandar = $mysqli->query($sql);
$idNuevo = $mysqli->insert_id;

$stmt2 = $mysqli->prepare("INSERT INTO clientes (idClientes) VALUES (?)");
$stmt2->bind_param("i", $idNuevo);
$stmt2->execute();

echo '<script language=javascript>
alert ("registrado correctamente")
self.location = "../../proyecto/PHP/index.php"
</script>';
?>