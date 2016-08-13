<?php
/**
 * Get page colors
 *
 * @package WordPress
 * @subpackage FoundationPress
 * @since FoundationPress 2.6.0
 */

 function getColors() {
   if ( is_post_type_archive('work') ) {
     $primaryColor = get_field( 'work_primary_color', 'option' );
     $secondaryColor = get_field( 'work_secondary_color', 'option' );
   } elseif ( is_post_type_archive('team') ) {
     $primaryColor = get_field( 'team_primary_color', 'option' );
     $secondaryColor = get_field( 'team_secondary_color', 'option' );
   } elseif ( is_post_type_archive('podcast') || is_singular('podcast') ) {
     $primaryColor = get_field( 'podcast_primary_color', 'option' );
     $secondaryColor = get_field( 'podcast_secondary_color', 'option' );
   } elseif (get_field( 'primary_color' ) && get_field( 'secondary_color' )) {
     $primaryColor = get_field( 'primary_color' );
     $secondaryColor = get_field( 'secondary_color' );
   } else {
     $primaryColor = get_field( 'global_primary_color', 'options' );
     $secondaryColor = get_field( 'global_secondary_color', 'options' );
   }
   return array('primary' => $primaryColor, 'secondary' => $secondaryColor);
}
