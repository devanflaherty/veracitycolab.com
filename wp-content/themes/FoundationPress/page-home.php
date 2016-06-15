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

 <div id="fullCard" role="main">
 <?php while ( have_posts() ) : the_post(); ?>
   <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>"
     data-0="margin-top: -250px;"
     data-top-bottom="margin-top: -400px;">

     <div class="row">
       <div id="tagline" class="columns small-9">
         <h1 class="entry-title"><?php bloginfo('description'); ?></h1>
       </div>
     </div>

     <div class="row" id="cardBody"
     data-0="margin-top: 40px;"
     data-100="margin-top: 0px;">
       <div class="entry-content columns">
         <h2><?php the_field( 'mission' ); ?></h2>
         <?php
           if( have_rows('logos') ) {
             echo '<div id="logos" class="row small-up-2 medium-up-5">';
             while ( have_rows('logos') ) { the_row();
               $src = get_sub_field('logo');
               echo "<div class='columns'>";
               echo "<img src=\"" . $src . "\"/>";
               echo "</div>";
             }
             echo "</div>";
           }
         ?>
       </div>
     </div>

     <div id="cta" class="row collapse"
       data-0="margin-top: 0px;"
       data-end="margin-top: 120px;">
       <div class="columns small-9">
         <h2><?php the_field( 'cta' ); ?></h2>
       </div>
       <div class="columns small-3">
        <a class="button expanded secondary" href="<?php the_field( 'cta_button_url' ); ?>"><?php the_field( 'cta_button_value' ); ?></a>
       </div>
     </div>
   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>

 </div>

 <?php get_footer(); ?>
