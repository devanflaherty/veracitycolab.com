<?php
/**
 * The template for displaying the Approach page
 *
 * Template Name: Approach
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

 get_header(); ?>

<div id="approach-page" class="full-card" role="main">
  <?php while ( have_posts() ) : the_post(); ?>
    <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">

      <div id="cardBody" class="bg-white approach-content"
        data-center="transform: translate(0px, 0px);"
        data-end="transform: translate(0px, -100px);">

            <?php
            // check if the flexible content field has rows of data
            if( have_rows('approach_content') ):
              // loop through the rows of data
              while ( have_rows('approach_content') ) : the_row();
                if( get_row_layout() == 'row_no_graphic' ): ?>
                  <div class="row">
                    <div class="small-11 columns">
                      <h2><?php the_sub_field('headline'); ?></h2>
                      <?php the_sub_field('description'); ?>
                    </div>
                  </div>
                <?php elseif( get_row_layout() == 'row_w_graphic' ):
                  $graphic = get_sub_field('graphic');
                ?>
                  <div class="row expand graphic-row">
                    <div class="small-6 medium-5 large-4 columns">
                      <?php if( !empty($graphic) ): ?>
                        <div class="graphic-container">
                          <div class="graphic-image-container">
                            <div class="graphic" style="background-image: url(<?php echo $graphic['url']; ?>);"></div>
                          </div>
                          <div class="graphic-color-container">
                            <div class="graphic-color" style="background-color: <?php the_sub_field('color'); ?>"></div>
                          </div>
                        </div>
                      <?php endif; ?>
                    </div>
                    <div class="small-12 medium-7 large-8 columns">
                      <h2><?php the_sub_field('headline'); ?></h2>
                      <?php the_sub_field('description'); ?>
                    </div>
                  </div>
                <?php endif;
               endwhile;
               else :
                 // no layouts found
               endif;
            ?>

      </div>

      <div class="cta">
  			<?php get_template_part( 'template-parts/cta' ); ?>
  		</div>

    </article>

  <?php endwhile;?>
</div><!-- Close Approach page -->

<?php get_footer(); ?>
