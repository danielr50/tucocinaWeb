<?php
    //comprobamos que sea una petición ajax
    if(!empty($_FILES['imagen_promo']))
    {
        //obtenemos el archivo a subir
        $archivo = $_FILES['imagen_promo'];
        //obetenemos nombre del archivo
        $file = $_FILES['imagen_promo']['name']; 
        // $file = $_POST['nombre']; 
        //comprobamos si existe un directorio para subir el archivo
        //si no es así, lo creamos
        if(!is_dir("uploads/promo/"))
            mkdir("uploads/promo/", 0777);

        //comprobamos si el archivo ha subido
        if ($file && move_uploaded_file($_FILES['imagen_promo']['tmp_name'],"uploads/promo/".$file))
        {
           // sleep(3);//hacer que la petición dure por lo menos 3 segundos es opcional
           echo $file;//devolvemos el nombre del archivo para pintar la imagen
        }
    }else{
        throw new Exception("Error Processing Request", 1);   
    }
?>