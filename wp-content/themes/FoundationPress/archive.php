<?php
/**
 * The template for displaying archive pages
 *
 * Used to display archive-type pages if nothing more specific matches a query.
 * For example, puts together date-based pages if no date.php file exists.
 *
 * If you'd like to further customize these archive views, you may create a
 * new template file for each one. For example, tag.php (Tag archives),
 * category.php (Category archives), author.php (Author archives), etc.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<section id="blog" class="wrapper" role="main">
	<!-- HEADLINE -->
		<header class="headline pad"
			data-0="transform: translate(0px, 0px)"
			data-200="transform: translate(0px, -50px)"
			data-249="transform: translate(0px, -50px)"
			data-250="transform: translate(0px, -250px)">
		<div class="row align-center">
			<div class="small-12 medium-4 columns">
				<h2><?php the_field('blog_title', 'option'); ?></h2>
			</div>
			<div class="small-12 medium-8 columns button-jar">
			<?php
				$taxonomies = get_categories();
				foreach($taxonomies as $term) {
					if ($term->slug != 'uncategorized') {
						$slug = $term->slug;
						echo "<a class='headline-link' href=\"/category/$slug\">$slug</a> ";
					}
				}
			?>
			</div>
		</div>
	</header>
	<!-- CLOSE HEADLINE -->

	<article class="main-cards pad"
	data-500-end="transform: translate(0px, 0px)"
	data-end="transform: translate(0px, -100px)">
	<?php if ( have_posts() ) : ?>
		<div class="row post-grid present">
		<?php while ( have_posts() ) : the_post(); ?>
			<?php
				// Set Post Colors
				if (get_field( 'primary_color' ) && get_field( 'secondary_color' )) {
					$primaryColor = get_field( 'primary_color' );
					$secondaryColor = get_field( 'secondary_color' );
				 } else {
					 $primaryColor = get_field( 'global_primary_color', 'options' );
					 $secondaryColor = get_field( 'global_secondary_color', 'options' );
				 }
				// Setting up some variabels to make life a little easier
				$setColor =  $primaryColor;
				$color = $setColor;
				$primary = foundationpress_hex2rgba($color, 0.8);
				$secondary = substr($secondaryColor, 1);

				// Have to do a lil loop to get the a-singular client
					$categories = get_the_category();
					$i = 0;
					foreach($categories as $term) {
						$i++;
						if ($i == 1) {
							$slug = $term->slug;
						}
					}
			?>
			<div class="columns small-12">
				<a href="<?php the_permalink(); ?>" class="permalink bloglink">
					<div class="hover-indicator" style="background-color: <?= $primaryColor; ?>"></div>
					<div class="post-meta">
						<h3><?php the_title(); ?></h3>
					</div>
					<?php if ( has_post_thumbnail() )  : ?>
						<div class="post-block" style="background-image: url(<?php the_post_thumbnail_url( 'large' ); ?>)">
					<?php else : ?>
						<div class="post-block" style="background-color: <?= $primary; ?>">
					<?php endif; ?>
						<div class="thumbnail-overlay" style="background-color: <?= $primary; ?>">
							<div class="row excerpt">
								<div class="columns small-12 medium-6">
									<div>
										<?php the_excerpt(); ?>
										<span><?= $slug; ?></span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</a>
			</div>
		<?php endwhile; ?>
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
