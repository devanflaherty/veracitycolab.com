<?php
/**
 * Get Client
 *
 * @package WordPress
 * @subpackage FoundationPress
 * @since FoundationPress 2.6.0
 */

 function getClient() {
   $taxonomies = get_the_terms(get_the_ID(), 'clients');
   if ($taxonomies) {
     $i = 0;
     $c = count($taxonomies);
     foreach($taxonomies as $term) {
       $i++;
       if ($i << 2) {
         $client = $term->name;
       }
     }
     return $client;
   }

  // $clients = get_field('client');
  // if( $clients ) {
  //   foreach( $clients as $p ) {
  //     $client = get_the_title( $p->ID );
  //   }
  //   return $client;
  // }
}
