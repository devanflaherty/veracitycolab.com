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

<?php if(get_field('show_featured_image') == true) : ?>
  <?php $pullUp = "-250"; ?>
 <?php get_template_part( 'template-parts/featured-image' ); ?>
<?php else: ?>
  <?php $pullUp = "0"; ?>
<?php endif; ?>

 <div id="page" class="full-card" role="main">
 <?php while ( have_posts() ) : the_post(); ?>
   <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>"
     data-0="margin-top: <?= $pullUp; ?>px;"
     data-top-bottom="margin-top: -400px;">

     <div class="row">
       <div id="tagline" class="columns medium-9" style="background-color: <?php the_field('tertiary_color'); ?>">
         <h1 class="entry-title"><?php the_field('tagline') ?></h1>
       </div>
     </div>

     <div id="cardBody" class="bg-white"
      data-0="margin-top: 40px;"
      data-100="margin-top: 0px;">
       <div id="contentBody">
         <?php the_content(); ?>
       </div>
       <div class="row">
         <div class="small-12 medium-12 large-6 columns">
           <div id="contentBody">
             <?php the_field('left_column'); ?>
           </div>
         </div>
         <div class="small-12 medium-12 large-6 columns">
           <div id="contentBody">
             <?php the_field('right_column'); ?>
           </div>
         </div>
       </div>
       <br>
     </div>

   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>

 </div>

 <?php get_footer(); ?>
