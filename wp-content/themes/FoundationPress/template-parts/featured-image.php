<?php
if ( is_post_type_archive('work') ) {
	$primaryColor = get_field( 'work_primary_color', 'option' );
	$secondaryColor = get_field( 'work_secondary_color', 'option' );
} elseif ( is_post_type_archive('team') ) {
	$primaryColor = get_field( 'team_primary_color', 'option' );
	$secondaryColor = get_field( 'team_secondary_color', 'option' );
} elseif (get_field( 'primary_color' ) && get_field( 'secondary_color' )) {
	$primaryColor = get_field( 'primary_color' );
	$secondaryColor = get_field( 'secondary_color' );
} else {
	$primaryColor = get_field( 'global_primary_color', 'options' );
	$secondaryColor = get_field( 'global_secondary_color', 'options' );
}

	// If a feature image is set, get the id, so it can be injected as a css background property
	if ( has_post_thumbnail( $post->ID ) ) {
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
		$image = $image[0];
		$style = "background-image: url('" . $image . "')";
	} else {
		$style = "background-color:" . $primaryColor . ";";
	}
?>

<!-- HERO!! DUH DUH DUUUUN -->
<header id="featured-hero" role="banner" style="<?php echo $style ?>">
	<?php if ( get_field( 'video_id' ) && !empty(get_field( 'video_id' ))) :
		// So if we can't find the "video_id" associated with the post, nothing after this comment will be seen. Sad.
	?>

		<div class="feature-play"><i class="fa fa-play" aria-hidden="true"></i></div>
		<div class="feature-overlay"></div>

		<div id="featureVideo" class="row collapse video-container align-center">
		  <div class="small-11 columns">
		    <div class="flex-video widescreen">
					<!-- WISTIA EMBED CODE -->
					<script charset="ISO-8859-1" src="//fast.wistia.com/assets/external/E-v1.js" async></script>
					<div class="wistia_embed wistia_async_<?php echo get_field( 'video_id' );?> videoFoam=true playerColor=<?= $secondaryColor; ?>" style="height:720px;width:1280px">&nbsp;</div>
					<!-- WISTIA EMBED CODE BYE BYE -->
		    </div>
		  </div>
		</div>

	<?php endif; ?>
</header>
<!-- CLOSE HERO!! -->
