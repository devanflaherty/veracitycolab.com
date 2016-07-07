<?php
  $errors         = array();      // array to hold validation errors
  $data           = array();      // array to pass back data

    // validate the variables ======================================================
    // if any of these variables don't exist, add an error to our $errors array

    if (empty($_POST['email'])) {
      $errors['email'] = 'Email is required.';
    }

    // return a response ===========================================================

    // if there are any errors in our errors array, return a success boolean of false
    if ( ! empty($errors)) {
        // if there are items in our errors array, return those errors
        $data['success'] = false;
        $data['errors']  = $errors;
    } else {
        // if there are no errors process our form, then return a message
        $hubspotutk      = $_COOKIE['hubspotutk']; //grab the cookie from the visitors browser.
        $ip_addr         = $_SERVER['REMOTE_ADDR']; //IP address too.
        $hs_context      = array(
          'hutk' => $hubspotutk,
          'ipAddress' => $ip_addr,
          'pageUrl' => 'http://www.veracitycolab.com',
          'pageName' => 'VeracityColab'
        );
        $hs_context_json = json_encode($hs_context);

        //Need to populate these varilables with values from the form.
        $str_post =
          "firstname=" . urlencode($_POST["firstname"])
          . "&email=" . urlencode($_POST["email"])
          . "&comment=" . urlencode($_POST["comment"])
          . "&company_name=" . urlencode($_POST["company_name"])
          . "&hs_context=" . urlencode($hs_context_json); //Leave this one be

        //replace the values in this URL with your portal ID and your form GUID
        $endpoint = 'https://forms.hubspot.com/uploads/form/v2/604644/69ea1cd8-7086-4602-a8d6-41e03c3ec74a';

        $ch = @curl_init();
        @curl_setopt($ch, CURLOPT_POST, true);
        @curl_setopt($ch, CURLOPT_POSTFIELDS, $str_post);
        @curl_setopt($ch, CURLOPT_URL, $endpoint);
        @curl_setopt($ch, CURLOPT_HTTPHEADER, array(
          'Content-Type: application/x-www-form-urlencoded'
        ));
        @curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response    = @curl_exec($ch); //Log the response from HubSpot as needed.
        $status_code = @curl_getinfo($ch, CURLINFO_HTTP_CODE); //Log the response status code
        @curl_close($ch);
//        echo $status_code . " " . $response;

        // show a message of success and provide a true success variable
        $data['success'] = true;
        $data['message'] = 'Success!';
    }

    // return all our data to an AJAX call
    echo json_encode($data);
?>
