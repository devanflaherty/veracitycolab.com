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

<section id="archiveTeam" class="wrapper" role="main">
	<!-- HEADLINE -->
	<header class="headline pad"
		data-0="transform: translate(0px, 0px)"
		data-200="transform: translate(0px, -50px)"
		data-249="transform: translate(0px, -50px)"
		data-250="transform: translate(0px, -250px)">
		<div class="row align-center">
			<div class="columns">
				<h2><?php the_field("team_headline", "option"); ?></h2>
			</div>

			<div class="columns flex">
				<div class="row button-group filter-button-group">
					<button data-filter="*" class="is-checked">All</button>
					<?php
						$taxonomies = get_the_terms( $post->ID, 'team-filters');
						foreach($taxonomies as $term) {
							$slug = $term->slug;
							echo "<button data-filter=\".$slug\">$slug</button> ";
						}
					?>
				</div>
			</div>
		</div>
	</header>
	<!-- CLOSE HEADLINE -->

	<article class="main-content pad"
	data-500-end="transform: translate(0px, 0px)"
	data-end="transform: translate(0px, -100px)">
	<?php if ( have_posts() ) : ?>
		<div class="row small-up-2 team-grid grid">

		<?php while ( have_posts() ) : the_post(); ?>
		  <div class="column
			<?php
				$taxonomies = get_the_terms( $post->ID, 'team-filters');
				foreach($taxonomies as $term) {
					$slug = $term->slug;
					echo $slug . " ";
				}
			?>">
				<div class="team-block">
					<a href="<?php the_permalink(); ?>">
						<div class="thumbnail-overlay" style="background-color: <?php echo $primary; ?>">
							<div class="play row align-middle">
								<div class="columns">
								</div>
							</div>
						</div>
						<div class="team-meta row align-middle">
							<div class="columns">
								<h4 style="color:<?php the_field( 'primary_color' ) ?>"><?php the_title(); ?></h4>
							</div>
						</div>
						<?php
							if ( has_post_thumbnail() ) {
								the_post_thumbnail();
							}
						?>
					</a>
				</div>
			</div>
		<?php endwhile; ?>

		<?php else : ?>
			<?php get_template_part( 'template-parts/content', 'none' ); ?>
		</div>

		<?php endif; // End have_posts() check. ?>


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
