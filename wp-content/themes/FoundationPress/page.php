<?php
/**
 * The template for displaying pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages and that
 * other "pages" on your WordPress site will use a different template.
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
       <div id="tagline" class="columns medium-9">
         <h1 class="entry-title"><?php the_field('tagline') ?></h1>
       </div>
     </div>

     <div id="cardBody" class="bg-white"
      data-0="margin-top: 40px;"
      data-100="margin-top: 0px;">
       <div id="contentBody">
         <?php the_content(); ?>
       </div>
     </div>

   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>

 </div>

 <?php get_footer(); ?>
