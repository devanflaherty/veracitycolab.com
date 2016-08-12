<?php
/**
 * Get Client
 *
 * @package WordPress
 * @subpackage FoundationPress
 * @since FoundationPress 2.6.0
 */

 function getClient() {
  $clients = get_field('client');
  if( $clients ) {
    foreach( $clients as $p ) {
      $client = get_the_title( $p->ID );
    }
    return $client;
  }
}
