<?php
/**
 * The default template for displaying content
 *
 * Used for both single and index/archive/search.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>
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
		foreach($categories as $term) {
			if ($term->slug != "all") {
				$slug = $term->slug;
			}
		}
?>

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
						<?php
							$excerpt = get_field('excerpt');
							if( $excerpt && $excerpt !== "" ) {
								echo $excerpt;
							} else {
								echo get_the_excerpt();
							} ?>
						<span><?= $slug; ?></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</a>
