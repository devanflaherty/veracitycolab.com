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
		data-0="transform: translate(0px, 0px);opacity: 1;"
		data-100="transform: translate(0px, -50px); opacity: 1;"
		data-200="transform: translate(0px, -50px); opacity: 0;"
		data-210="transform: translate(0px, -250px); opacity: 0;">
		<div class="row align-center stacked-medium">
			<div class="small-12 large-3 columns">
				<h2><?php the_field("team_headline", "option"); ?></h2>
			</div>
			<div class="small-12 large-9 columns filter-button-group button-jar wrap">
					<a class="headline-link" href="/team">All</a>
					<?php
						$taxonomies = get_terms('team-filters');
						$current = $wp_query->query_vars['team-filters'];
						if ($taxonomies) {
							foreach($taxonomies as $term) {
								$name = $term->name;
								$slug = $term->slug;
								echo "<a class=\"headline-link\" href=\"/filter/$slug\">$name</a> ";
							}
						}
						echo $current;
					?>
			</div>
		</div>
	</header>
	<!-- CLOSE HEADLINE -->

	<article class="main-cards pad">
	<?php
		global $query_string;
		query_posts( $query_string . '&posts_per_page=-1' );
		if ( have_posts() ) : ?>
		<div class="row small-up-2 medium-up-4 team-grid present">

		<?php while ( have_posts() ) : the_post(); ?>
		  <div class="column
				<?php
					$taxonomies = get_the_terms( $post->ID, 'team-filters');
					if ($taxonomies) {
						foreach($taxonomies as $term) {
							$slug = $term->slug;
							echo $slug . " ";
						}
					}
				?>">
					<div class="team-block">
						<a href="<?php the_permalink(); ?>">
							<div class="avatar">
							<?php
								if (get_field( 'avatar' )) {
									$avatar = get_field( 'avatar' );
								} else {
									$avatar = get_field( 'team_default_avatar', 'option' );
								}
							?>
								<div class="thumbnail-overlay" style="background-image: url(<?= $avatar; ?>)"></div>
								<div class="thumbnail-overlay-hover" style="background-image: url(<?= $avatar; ?>)"></div>
							</div>
							<div class="team-meta row align-middle">
								<div class="columns">
									<h4 style="color:<?php the_field( 'primary_color' ) ?>"><?php the_title(); ?></h4>
									<h5 style="color:<?php the_field( 'primary_color' ) ?>"><?php the_field('title'); ?></h5>
								</div>
							</div>
						</a>
					</div>
				</div>
			<?php endwhile; ?>

			<?php else : ?>
				<?php get_template_part( 'template-parts/content', 'none' ); ?>
		</div>

		<?php endif; // End have_posts() check. ?>

	</article>
	<?php /* Display navigation to next/previous pages when applicable */ ?>
	<?php if ( function_exists( 'foundationpress_pagination' ) ) { foundationpress_pagination(); } else if ( is_paged() ) { ?>
		<nav id="post-nav">
			<div class="post-previous"><?php next_posts_link( __( '&larr; Older posts', 'foundationpress' ) ); ?></div>
			<div class="post-next"><?php previous_posts_link( __( 'Newer posts &rarr;', 'foundationpress' ) ); ?></div>
		</nav>
	<?php } ?>
</section>

<?php get_footer();
