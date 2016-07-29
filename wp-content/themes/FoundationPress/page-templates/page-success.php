<?php
/**
 * The template for displaying pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages and that
 * other "pages" on your WordPress site will use a different template.
 * Template Name: Success
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

 <div id="success" class="full-card" role="main">
 <?php while ( have_posts() ) : the_post(); ?>
   <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>"
     data-0="margin-top: <?= $pullUp; ?>px;"
     data-top-bottom="margin-top: -400px;">

     <div id="cardBody" class="bg-white"
      data-0="margin-top: 40px;"
      data-100="margin-top: 0px;">
       <div id="contentBody">
         <?php the_content(); ?>
       </div>
       <div class="row align-center">

         <?php
           if( have_rows('call_to_actions') ) {
             while ( have_rows('call_to_actions') ) { the_row();
               $src = get_sub_field('image');
               $content = get_sub_field('excerpt');
               $value = get_sub_field('button_value');
               $url = get_sub_field('button_url');
               echo '<div class="small-12 medium-12 large-6 columns">';

               echo "<img src=\"" . $src . "\"/>";
               echo "<p>" . $content . "</p>";
               echo "<a class='button large expanded' href=\"" . $url . "\">" . $value . "</a>";

               echo "</div>";
             }
           }
         ?>

       </div>
       <br>
     </div>

   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>
 </div>

 <?php get_footer(); ?>
