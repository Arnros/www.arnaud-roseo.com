<?php    
    $to =   'contact@arnaud-roseo.com'; //the address to which the email will be sent
    $email    =   $_POST['email'];
    $subject  =   $_POST['subject'];
    $message  =   $_POST['message'];
    
    $headers = '';
    $headers .= 'MIME-Version: 1.0'."\n";
    $headers .= 'content-type: text/html; charset=iso-8859-1'."\n";
    $headers .= "From: {$to}\n";
    $headers .= "Reply-To: {$email}\n";
    $headers .= 'X-Mailer: PHP v'.phpversion();


    if(mail($to,$subject,$message,$headers)){
        echo 'sent';  
    }else{
        echo 'failed';
    }
?>
