<?php

include 'db.php';

$sql = "SELECT * FROM usuarios ";

$result = $conn->query($sql);

if ($result->num_rows > 0) { 
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
    echo json_encode($usuarios);
} else { 
    echo json_encode([]);
}

?>