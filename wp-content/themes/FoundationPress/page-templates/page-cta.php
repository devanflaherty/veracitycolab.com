<?php
/**
 * The template for displaying pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages and that
 * other "pages" on your WordPress site will use a different template.
 * Template Name: CTA
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

     <div id="cardBody" class="bg-white"
      data-0="margin-top: 40px;"
      data-100="margin-top: 0px;">
       <div id="contentBody">
         <?php the_content(); ?>
       </div>
       <div class="row align-center" style="padding: 40px 0">
         <div class="columns small-12 medium-9">

            <!--[if lte IE 8]>
            <script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/v2-legacy.js"></script>
            <![endif]-->
            <script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/v2.js"></script>
            <script>
              hbspt.forms.create({
                css: '',
                portalId: '604644',
                formId: '<?php the_field('form'); ?>'
              });
            </script>
          </div>
        </div>

     </div>

   </article>
 <?php endwhile;?>

 <?php do_action( 'foundationpress_after_content' ); ?>

 </div>

 <?php get_footer(); ?>
