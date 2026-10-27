<?php
session_start();
require ("conexion.php");
$usuario=$_POST["usuario"];
$contrasena=$_POST["contra"];
$a="SELECT * from usuarios where nombreUsuario='$usuario' and contrasena='$contrasena'";
$resultado=$mysqli->query($a) or die ($mysqli->error);
$_SESSION['usuario']=$usuario;

$total_registro=$resultado->num_rows;
if ($total_registro>0) {
    $arreglo=mysqli_fetch_assoc($resultado);
    $_SESSION['idUsuarios'] = $arreglo['idUsuarios'];
    $tipoEstado=$arreglo['estado'];
    if ($tipoEstado==1) { 
        $tipo=$arreglo['idRol'];
        if($tipo==1){
           echo '<script language = javascript>
           self.location = "../../proyecto/PHP/cliente.php"
           </script>';
        }else{
           if ($tipo==2) {
              echo '<script language = javascript>
              alert("estilista")
              </script>';
           }else{
            if ($tipo==3) {
              echo '<script language = javascript>
              alert("recepcionista")
              </script>';
            }else{
                if ($tipo==4) {
                    echo '<script language = javascript>
                    alert("gerente")
                    </script>';
                }
            }
           }
        }
        
    }else{
        echo '<script language = javascript>
        alert("Usuario Desactivado  ")
        self.location = "seccion.html"
        </script>';
    }
}
else{
   echo '<script language = javascript>
   alert("Informacion inválida  ")
   
   </script>';
}

?>