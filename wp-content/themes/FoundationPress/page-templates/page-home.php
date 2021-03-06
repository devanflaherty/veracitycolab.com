<?php
/**
 * The template for displaying pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages and that
 * other "pages" on your WordPress site will use a different template.
 * Template Name: Home
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

 get_header(); ?>

 <?php get_template_part( 'template-parts/featured-image' ); ?>

 <div id="home" class="full-card" role="main">
 <?php while ( have_posts() ) : the_post(); ?>
   <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>"
     data-0="margin-top: -250px;"
     data-top-bottom="margin-top: -400px;">

     <div class="row">
       <div id="tagline" class="medium-9">
         <h1 class="entry-title" style="background:<?php the_field("tertiary_color"); ?>"><?php bloginfo('description'); ?></h1>
       </div>
     </div>

     <div class="row" id="cardBody"
      data-0="margin-top: 40px;"
      data-100="margin-top: 0px;">
       <div class="entry-content columns" style="padding-top: 40px; padding-bottom: 40px;">
         <h2><?php the_field( 'mission' ); ?></h2>
         <?php
           if( have_rows('logos') ) {
             echo '<div id="logos" class="row small-up-2 medium-up-5">';
             while ( have_rows('logos') ) { the_row();
               $src = get_sub_field('logo');

               if(get_sub_field('link') && get_sub_field('link') != "") {
                 $link = get_sub_field('link');
                 echo "<div class='columns'>";
                 echo "<a href=\"" . $link . "\"><img src=\"" . $src . "\"/></a>";
                 echo "</div>";
               } else {
                 echo "<div class='columns'>";
                 echo "<img src=\"" . $src . "\"/>";
                 echo "</div>";
               }
             }
             echo "</div>";
           }
         ?>
       </div>
     </div>

     <?php get_template_part( 'template-parts/cta' ); ?>

   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>

 </div>

 <?php get_footer(); ?>
