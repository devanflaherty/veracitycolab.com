<?php
/**
 * The template for displaying archive work posts
 *
 *
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<section id="archiveWork" class="wrapper" role="main">
	<!-- HEADLINE -->
	<header class="headline pad"
	data-0="transform: translate(0px, 0px);opacity: 1;"
	data-200="transform: translate(0px, -50px); opacity: 1;"
	data-300="transform: translate(0px, -50px); opacity: 0;">
	  <div class="row align-center">
	    <div class="small-12 medium-6 columns">
				<h5><span class="subheader"><?php single_term_title(); ?></span></h5>
	      <h2><?php the_field("work_headline", "option"); ?></h2>
	    </div>

	    <?php if( have_rows('work_ctas', "option") ) : ?>
	      <div class="small-12 medium-6 columns button-jar">
	      <?php while ( have_rows('work_ctas', "option") ) : the_row(); ?>
					<?php
						$buttonLink = get_sub_field('button_url');
						if(get_sub_field('is_video') == true) {
							$buttonClass = "play iplay reel";
							$link = "#wistia_" . $buttonLink . "?videoFoam=true&playerColor=dd3333&videoQuality=hd-only";
						} else {
							$buttonClass = "";
							$link = $buttonLink;
						}
					?>
	        <a class="headline-link <?= $buttonClass; ?>" href="<?= $link; ?>"><?php if(get_sub_field('button_icon')) {the_sub_field('button_icon');} ?> <?php the_sub_field('button_value'); ?></a>
	      <?php endwhile; ?>
	      </div>
	    <?php endif; ?>
	  </div>
	</header>
	<!-- CLOSE HEADLINE -->

	<article class="main-cards pad" id="workPosts"
		data-500-end="transform: translate(0px, 0px)"
		data-end="transform: translate(0px, -100px)">


		<?php // DEFAULT POSTS ?>

		<?php
			$paged = ( get_query_var( 'paged' ) ) ? get_query_var( 'paged' ) : 1;

			global $query_string;
			query_posts( $query_string . '&posts_per_page=8&paged=' . $paged );
			if ( have_posts() ) :
		?>
		<div class="row small-up-1 medium-up-2 post-grid present">
			<?php while ( have_posts() ) : the_post(); ?>

			<div class="column">
				<?php get_template_part( 'template-parts/work-content' ); ?>
			</div>
		<?php endwhile; ?>

		</div>
		<?php endif; // End have_posts() check. ?>

		<div class="cta row">
			<div class="columns">
				<?php get_template_part( 'template-parts/cta' ); ?>
			</div>
		</div>

		<?php /* Display navigation to next/previous pages when applicable */ ?>
		<?php if ( function_exists( 'foundationpress_pagination' ) ) { foundationpress_pagination(); } else if ( is_paged() ) { ?>
			<nav id="post-nav">
				<div class="post-previous"><?php next_posts_link( __( '&larr; Older posts', 'foundationpress' ) ); ?></div>
				<div class="post-next"><?php previous_posts_link( __( 'Newer posts &rarr;', 'foundationpress' ) ); ?></div>
			</nav>
		<?php } ?>

	</article>
</section>

<?php get_footer();
