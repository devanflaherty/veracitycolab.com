<?php
/**
 * Get page cta Logic
 *
 * @package WordPress
 * @subpackage FoundationPress
 * @since FoundationPress 2.6.0
 */

 function getCta() {

   if( is_singular( 'work' ) || is_post_type_archive('work') ) { // IF IS A WORK POST
     $postType = 'work';
   } elseif( is_singular( 'podcast' ) || is_post_type_archive('podcast') ) { // IF IS A WORK POST
     $postType = 'podcast';
   } elseif( is_singular( 'post' ) || is_home() || is_archive() ) { // IF IS A POST
     $postType = 'post';
   } elseif( is_front_page() ) { // IF IS A POST
     $postType = 'home';
   } else {
     $postType = 'global';
   }

   if (!is_singular()) {
     if($postType == 'post') {
       $page = get_page_by_path( 'blog' );
     } else {
      $page = get_page_by_path( $postType . '-archive' );
     }
     $pId = $page->ID;
     $cta = get_field('choose_cta', $pId);
     if(get_field('custom_color', $pId) == true) {
       $color = get_field('button_color', $pId);
     }
   } else {
     $cta = get_field('choose_cta');
     if(get_field('custom_color') == true) {
       $color = get_field('button_color');
     }
   }
   if ( $cta !== "Hide" ) {
     // If CTA Isn't hidden
     if ( $cta == "Default" ) {
       $ctaId = get_field( $postType . '_cta_default', 'option' );
       // Find CTA from ID
       $ctaId = $ctaId[0];
       $value = get_field('cta_button_value', $ctaId);
       $url = get_field('cta_button_url', $ctaId);
       $blurb = get_field('cta_button_blurb', $ctaId);
     } elseif( $cta == "Select" ) {
       // If CTA is set to Select
       if (!is_singular()) {
         $ctaSelect = get_field('call_to_action', $pId);
       } else {
         $ctaSelect = get_field('call_to_action');
       }
       if( $ctaSelect ) {
         foreach( $ctaSelect as $p ) {
           $value = get_field('cta_button_value', $p->ID);
           $url = get_field('cta_button_url', $p->ID);
           $blurb = get_field('cta_button_blurb', $p->ID);
         }
       }
     } elseif( $cta == "Custom" ) {
       if (!is_singular()) {
         $value = get_field('button_value', $pId);
         $url = get_field('button_url', $pId);
         $blurb = get_field('button_blurb', $pId);
       } else {
         $value = get_field('button_value');
         $url = get_field('button_url');
         $blurb = get_field('button_blurb');
       }
     }
   } else {
     $hidden = true;
   }
   return array('ctaValue' => $value, 'ctaUrl' => $url, 'ctaBlurb' => $blurb, 'ctaHide' => $hidden, 'ctaColor' => $color);
 }
