<?php
	$colors = getColors();
	$primaryColor = $colors['primary'];
	$secondaryColor = $colors['secondary'];

	// If a feature image is set, get the id, so it can be injected as a css background property
	if(is_archive()) {
		$style = "background-color:" . $primaryColor . ";";
	} elseif ( has_post_thumbnail( $post->ID ) ) {
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
		$image = $image[0];
		$style = "background-image: url('" . $image . "')";
	} else {
		$style = "background-color:" . $primaryColor . ";";
	}

	if(is_post_type_archive( 'work' ) || is_post_type_archive( 'podcast' ))  {
		$hidden = "hidden";
	}
?>

<!-- HERO!! DUH DUH DUUUUN -->
<header id="featured-hero" role="banner" class="<?= $hidden; ?>" style="<?php echo $style ?>">
<?php
	if ( is_post_type_archive( 'work' ) || is_post_type_archive( 'podcast' ) || is_singular( 'work' ) || is_singular( 'example' )) :
		if(get_field('video_id')) {
			$video = get_field('video_id');
		} else {
			$video = 'o3wjbaj9xc';
		}
	?>

	<?php if(!is_singular( 'example' ) && !empty(get_field('video_id'))) : ?>
		<div class="feature-play"><i class="fa fa-play" aria-hidden="true"></i></div>
	<?php endif; ?>

		<div class="feature-overlay"></div>

		<div id="featureVideo" class="row collapse video-container align-center">
		  <div class="small-11 columns">
				<div class="wistia_embed wistia_async_<?= $video; ?> videoFoam=true playerColor=<?= $secondaryColor; ?>" style="height:720px;width:1280px">&nbsp;</div>
				<!-- WISTIA EMBED CODE BYE BYE -->
			</div>
			<div class="small-11 columns">
				<div class="row align-center" style="margin-top: 24px">
					<div class="small-6 medium-3 columns">
						<a class="button expanded hollow upper white" href="#close">Close</a>
					</div>
					<?php if(is_post_type_archive( 'work' ) || is_singular( 'example' )) : ?>
						<div class="small-6 medium-3 columns">
							<a class="button expanded hollow upper white" id="seeProject" href="#">See Project</a>
						</div>
					<?php elseif(is_post_type_archive( 'podcast' )) : ?>
						<div class="small-6 medium-3 columns">
							<a class="button expanded hollow upper white" id="seeProject" href="#">Go to Post</a>
						</div>
					<?php endif; ?>
				</div>
		  </div>
		</div>

<?php endif; ?>
</header>
<!-- CLOSE HERO!! -->
