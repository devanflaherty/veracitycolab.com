<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * e.g., it puts together the home page when no home.php file exists.
 *
 * Learn more: {@link https://codex.wordpress.org/Template_Hierarchy}
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
			<?php if( is_home()) : ?>
				<div class="small-12 medium-4 columns">
					<h2><?php the_field('blog_title', 'option'); ?></h2>
				</div>
				<div class="small-12 medium-8 columns button-jar">
					<a class="headline-link" href="/blog">All</a>
					<?php
						$taxonomies = get_categories();
						foreach($taxonomies as $term) {
							if ($term->slug != 'all') {
								$slug = $term->slug;
								$name = $term->name;
								echo "<a class='headline-link' href=\"/blog/filter/$slug\">$name</a> ";
							}
						}
					?>
				</div>
			<?php elseif( is_category()) : ?>
				<div class="small-12 medium-4 columns">
					<h5><span class="subheader"><?php single_term_title(); ?></span></h5>
					<h2><?php the_field('blog_title', 'option'); ?></h2>
				</div>
				<div class="small-12 medium-8 columns button-jar">
					<a class="headline-link" href="/blog">All</a>
					<?php
						$taxonomies = get_categories();
						foreach($taxonomies as $term) {
							if ($term->slug != 'all') {
								$slug = $term->slug;
								$name = $term->name;
								$current = single_term_title("",false);
								if ($current == $name) {
									$checked = "is-checked";
								} else {
									$checked = "";
								}
								echo "<a class='headline-link $checked' href=\"/blog/filter/$slug\">$name</a> ";
							}
						}
					?>
				</div>
			<?php elseif( is_archive()) : ?>
				<div class="small-12 medium-4 columns">
					<h2><?php the_field('blog_title', 'option'); ?></h2>
				</div>
				<div class="small-12 medium-8 columns button-jar">
					<a class="headline-link" href="/blog">All</a>
					<?php
						$taxonomies = get_categories();
						foreach($taxonomies as $term) {
							if ($term->slug != 'all') {
								$slug = $term->slug;
								$name = $term->name;
								echo "<a class='headline-link' href=\"/blog/filter/$slug\">$name</a> ";
							}
						}
					?>
				</div>
			<?php endif; ?>
		</div>
	</header>
	<!-- CLOSE HEADLINE -->

	<article class="main-cards pad"
	data-500-end="transform: translate(0px, 0px)"
	data-end="transform: translate(0px, -100px)">
	<?php if ( have_posts() ) : ?>
		<div class="row post-grid present">
		<?php while ( have_posts() ) : the_post(); ?>
			<div class="columns small-12">
				<?php get_template_part( 'template-parts/blog-content' ); ?>
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
