<?php
/**
 * The template for displaying all work single posts
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<section id="singleWork" class="wrapper align-center" role="main">
	<?php while ( have_posts() ) : the_post(); // While we have a post let's show it off?>

	<?php if(get_field( 'pull_quote' ) && !empty(get_field( 'pull_quote' ))) : ?>
	<!-- MAIN CONTENT : Skrollr animation set to parralax the article up -->
	<article
		data-0="transform: translate(0px , 0px);"
		data-end="transform: translate(0px , -100px);">
	<?php else : ?>
		<article
			data-0="transform: translate(0px , 0px);"
			data-end="transform: translate(0px , -100px);">
	<?php endif; ?>
		<div class="main-content" id="post-<?php the_ID(); ?>">
			<div id="contentBody" class="entry-content">
				<header id="contentHeader">
					<h1 class="entry-title"><?php the_title(); ?></h1>
				</header>

				<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
				<?php the_content(); ?>
			</div>

			<div class="advance-posts">
				<h3><?php the_field('headline'); ?></h3>
			<?php // RELATED POSTS ?>
			<?php
				$posts = get_field('related_work');

				if( $posts ): ?>
					<div class="row small-up-1 medium-up-2 post-grid">
						<?php foreach( $posts as $post): // variable must be called $post (IMPORTANT) ?>
							<?php setup_postdata($post); ?>
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
									<div class="permalink-overlay"></div>
									<a class="play" href="#wistia_<?= $video; ?>?videoFoam=true&playerColor=<?= $secondary; ?>&videoQuality=hd-only">
										<div class="thumbnail-overlay" style="background-color: <?= $primary; ?>">
											<span><i class="fa fa-play" aria-hidden="true"></i></span>
										</div>
									</a>
								</div>
							</div>
					<?php endforeach; ?>
					</div>
					<?php wp_reset_postdata(); // IMPORTANT - reset the $post object so the rest of the page works correctly ?>
				<?php endif; ?>
			</div>
			<footer id="contentFooter">
			</footer>
		</div>
	</article>
	<!-- CLOSE MAIN CONTENT -->
<?php endwhile;?>


<?php if(get_field('pull_quote') && !empty(get_field( 'pull_quote' ))) : ?>
<!-- SIDEBAR -->
<aside class="sidebar show-for-large" id="workSidebar">
  <div clas="row" data-sticky-container>
    <div class="sticky" data-sticky data-anchor="workSidebar" data-check-every="0" data-options="marginTop:7;">
      <h3><?php the_field('pull_quote'); ?></h3>

			<?php if( have_rows('buttons') ) : ?>
	      <div class="button-wrapper">
	      <?php while ( have_rows("buttons") ) : the_row(); ?>
					<?php
						$buttonLink = get_sub_field('button_url');
					?>
	        <a class="headline-link button round expanded" href="<?= $buttonLink; ?>"><?php if(get_sub_field('button_icon')) {the_sub_field('button_icon');} ?> <?php the_sub_field('button_value'); ?></a>
	      <?php endwhile; ?>
	      </div>
	    <?php endif; ?>
    </div>
  </div>
</aside>
<?php endif; ?>
<!-- CLOSE SIDEBAR -->
</section>

<script>
	// This script allows us to bind the "play" function for the Wistia embed to a "click". How fun.
	window._wq = window._wq || [];
	_wq.push({ "<?php the_field('video_id'); ?>": function(video) {
	  $(".feature-play").click(function(){
	    video.play();
	  });
	}});
</script>

<?php get_footer();
