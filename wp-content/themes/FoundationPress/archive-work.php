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

<?php
	$posts = get_posts(array(
		'numberposts'	=> 1,
		'post_type'		=> 'work',
		'meta_key'		=> 'visibility',
		'meta_value'	=> 'featured'
	));

	if( $posts ) {
		foreach( $posts as $post ) {
			$i++;
			setup_postdata( $post );
			if ($i == 1) {
				$initVideo = 'o3wjbaj9xc';
			}
		}
	}
	wp_reset_postdata();
?>

<!-- VIDEO CONTAINER -->
<header id="featured-hero" class="hidden" role="banner" style="background-color:#222">

	<div class="feature-overlay"></div>
	<div id="featureVideo" class="row collapse video-container align-center">
		<div class="large-11 columns">
			<div class="flex-video widescreen">
				<div class="wistia_embed wistia_async_<?php echo $initVideo; ?> videoFoam=true" style="height:720px;width:1280px">&nbsp;</div>
			</div>
		</div>
	</div>

</header>
<!-- CLOSE VIDEO CONTAINER -->

<section id="archiveWork" class="wrapper" role="main">
	<!-- HEADLINE -->
	<header class="headline pad"
	data-0="transform: translate(0px, 0px);opacity: 1;"
	data-200="transform: translate(0px, -50px); opacity: 1;"
	data-300="transform: translate(0px, -50px); opacity: 0;">
	  <div class="row align-center">
	    <div class="small-12 medium-6 columns">
	      <h2><?php the_field("work_headline", "option"); ?></h2>
	    </div>

	    <?php if( have_rows('work_ctas', "option") ) : ?>
	      <div class="small-12 medium-6 columns button-jar">
	      <?php while ( have_rows('work_ctas', "option") ) : the_row(); ?>
					<?php
						$buttonLink = get_sub_field('button_url');
						if(get_sub_field('is_video') == true) {
							$buttonClass = "play";
							$link = "#wistia_" . $buttonLink . "?videoFoam=true&playerColor=dd3333&videoQuality=hd-only";
						} else {
							$buttonClass = "";
							$link = $buttonLink;
						}
					?>
	        <a class="headline-link <?= $buttonClass; ?>" href="<?= $Link; ?>"><?php if(get_sub_field('button_icon')) {the_sub_field('button_icon');} ?> <?php the_sub_field('button_value'); ?></a>
	      <?php endwhile; ?>
	      </div>
	    <?php endif; ?>
	  </div>
	</header>
	<!-- CLOSE HEADLINE -->


	<article class="main-cards pad" id="workPosts"
		data-500-end="transform: translate(0px, 0px)"
		data-end="transform: translate(0px, -100px)">

		<?php
			$posts = get_posts(array(
				'numberposts'	=> -1,
				'post_type'		=> 'work',
				'meta_key'		=> 'visibility',
				'meta_value'	=> 'featured'
			));

			if( $posts ):
		?>
		<div class="row post-grid present">

			<?php foreach( $posts as $post ):
				setup_postdata( $post )
			?>
			<?php
				// Setting up some variabels to make life a little easier
				$setColor =  get_field('primary_color');
				$color = $setColor;
				$primary = foundationpress_hex2rgba($color, 0.8);
				$secondary = substr(get_field( 'secondary_color'), 1);
				$video =  get_field('video_id');

				// Have to do a lil loop to get the a-singular client
				$clients = get_field('client');
				if( $clients ) {
					foreach( $clients as $p ) {
			    	$client = get_the_title( $p->ID );
					}
				}
			?>
			<div class="columns small-12 feature-post">
				<a href="<?php the_permalink(); ?>" class="permalink">
					<div class="hover-indicator" style="background: <?php the_field( 'primary_color' ) ?>"></div>
					<div class="post-meta">
						<h5><span><?= $client ?></span></h5>
						<h3><?php the_title(); ?></h3>
					</div>
				</a>
				<?php if ( has_post_thumbnail() )  : ?>
					<div class="post-block" style="background-image: url(<?php the_post_thumbnail_url( 'large' ); ?>)">
				<?php else : ?>
					<div class="post-block" style="background-color: <?= $primary; ?>">
				<?php endif; ?>
					<a href="#wistia_<?= $video; ?>?videoFoam=true&playerColor=<?= $secondary; ?>&videoQuality=hd-only">
						<div class="thumbnail-overlay play" style="background-color: <?= $primary; ?>">
							<span><i class="fa fa-play" aria-hidden="true"></i></span>
						</div>
					</a>
				</div>
			</div>
		<?php endforeach; ?>

		</div>
		<?php wp_reset_postdata(); ?>
		<?php endif; // End have_posts() check. ?>

		<?php
			$posts = get_posts(array(
				'numberposts'	=> -1,
				'post_type'		=> 'work',
				'meta_key'		=> 'visibility',
				'meta_value'	=> 'default'
			));

			if( $posts ):
		?>
		<div class="row small-up-1 medium-up-2 post-grid present">
			<?php foreach( $posts as $post ):
				setup_postdata( $post )
			?>

			<?php
				// Setting up some variabels to make life a little easier
				$setColor =  get_field('primary_color');
				$color = $setColor;
				$primary = foundationpress_hex2rgba($color, 0.8);
				$secondary = substr(get_field( 'secondary_color'), 1);
				$video =  get_field('video_id');

				// Have to do a lil loop to get the a-singular client
				$clients = get_field('client');
				if( $clients ) {
					foreach( $clients as $p ) {
			    	$client = get_the_title( $p->ID );
					}
				}
			?>
			<div class="column">
				<a href="<?php the_permalink(); ?>" class="permalink">
					<div class="hover-indicator" style="background: <?php the_field( 'primary_color' ) ?>"></div>
					<div class="post-meta">
						<h5><span><?= $client ?></span></h5>
						<h3><?php the_title(); ?></h3>
					</div>
				</a>
			<?php if ( has_post_thumbnail() )  : ?>
				<div class="post-block" style="background-image: url(<?php the_post_thumbnail_url( 'large' ); ?>)">
			<?php else : ?>
				<div class="post-block" style="background-color: <?= $primary; ?>">
			<?php endif; ?>
					<a href="#wistia_<?= $video; ?>?videoFoam=true&playerColor=<?= $secondary; ?>&videoQuality=hd-only">
						<div class="thumbnail-overlay play" style="background-color: <?= $primary; ?>">
							<span><i class="fa fa-play" aria-hidden="true"></i></span>
						</div>
					</a>
				</div>
			</div>
		<?php endforeach; ?>

		</div>
		<?php wp_reset_postdata(); ?>
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
