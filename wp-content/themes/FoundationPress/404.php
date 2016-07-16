<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<div id="fourohfour" role="main" style="padding: 40px 0 60px">
	<div class="row align-center">
		<div class="small-9 medium-5 large-4 columns">
			<img src="<?php the_field('404_image', 'option') ?>">
		</div>
	</div>
	<div class="row align-center text-center">
		<div class="small-11 medium-7 columns">
			<h3 class="entry-title"><?php the_field('404_title', 'option') ?></h3>

			<div class="error">
				<p class="bottom"><?php the_field('404_content', 'option') ?></p>
			</div>

			<?php /*
			<p><?php _e( 'Please try the following:', 'foundationpress' ); ?></p>
			<ul>
				<li><?php _e( 'Check your spelling', 'foundationpress' ); ?></li>
				<li><?php printf( __( 'Return to the <a href="%s">home page</a>', 'foundationpress' ), home_url() ); ?></li>
				<li><?php _e( 'Click the <a href="javascript:history.back()">Back</a> button', 'foundationpress' ); ?></li>
			</ul> */
			?>
		</div>
	</div>
</div>

<?php get_footer();
