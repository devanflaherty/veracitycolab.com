<?php
/**
 * The template for displaying archive podcast posts
 *
 *
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<section id="archiveWork" class="wrapper" role="main">
	<!-- HEADLINE -->
	<header class="headline pad"
	data-0="transform: translate(0px, 0px);opacity: 1;"
	data-200="transform: translate(0px, -50px); opacity: 1;"
	data-300="transform: translate(0px, -50px); opacity: 0;">
	  <div class="row align-center">
	    <div class="small-12 medium-6 columns">
	      <h2><?php the_field("podcast_headline", "option"); ?></h2>
	    </div>

	    <?php if( have_rows('work_ctas', "option") ) : ?>
	      <div class="small-12 medium-6 columns button-jar">
	      <?php while ( have_rows('podcast_button', "option") ) : the_row(); ?>
					<?php
						$buttonLink = get_sub_field('button_url');
						if(get_sub_field('is_video') == true) {
							$buttonClass = "play iplay reel";
							$link = "#wistia_" . $buttonLink . "?videoFoam=true&playerColor=dd3333&videoQuality=hd-only";
						} else {
							$buttonClass = "";
							$link = $buttonLink;
						}
					?>
	        <a class="headline-link <?= $buttonClass; ?>" href="<?= $link; ?>"><?php if(get_sub_field('button_icon')) {the_sub_field('button_icon');} ?> <?php the_sub_field('button_value'); ?></a>
	      <?php endwhile; ?>
	      </div>
	    <?php endif; ?>
	  </div>
	</header>
	<!-- CLOSE HEADLINE -->

	<?php
		$args = array(
			'posts_per_page' => 8,
			'post_type'		=> 'podcast',
			'paged' => $paged
		);

		$the_query = new WP_Query( $args );
	?>
  <article class="main-cards pad" id="workPosts"
  data-500-end="transform: translate(0px, 0px)"
  data-end="transform: translate(0px, -100px)">

	<?php if( $the_query->have_posts() ): ?>
		<div class="row small-up-1 medium-up-2 post-grid present">
			<?php while( $the_query->have_posts() ) : $the_query->the_post(); ?>

			<?php
				// Setting up some variabels to make life a little easier
				$setColor =  get_field('podcast_primary_color', 'option');
				$color = $setColor;
				$primary = foundationpress_hex2rgba($color, 0.8);
				$secondary = substr(get_field( 'podcast_secondary_color', 'option'), 1);
				$video =  get_field('video_id');

				// Have to do a lil loop to get the a-singular client
				$episode = get_field('episode');
			?>
			<div class="column">
				<div class="post-block" style="background-color: <?= $primary; ?>">
					<a href="<?php the_permalink(); ?>" class="permalink">
						<div class="hover-indicator" style="background: <?php the_field( 'podcast_primary_color', 'option' ) ?>"></div>
						<div class="post-meta">
							<h5><span>Episode <?= $episode; ?></span></h5>
							<h3><?php the_title(); ?></h3>
						</div>
					</a>
				<?php if ( has_post_thumbnail() )  : ?>
					<a class="play"
						style="background-image: url(<?php the_post_thumbnail_url( 'large' ); ?>)"
						href="#wistia_<?= $video; ?>?videoFoam=true&amp;playerColor=<?= $secondary; ?>&amp;videoQuality=hd-only" data-permalink="<?php the_permalink(); ?>">
				<?php else : ?>
					<a class="play" href="#wistia_<?= $video; ?>?videoFoam=true&amp;playerColor=<?= $secondary; ?>&amp;videoQuality=hd-only" data-permalink="<?php the_permalink(); ?>">
				<?php endif; ?>
						<div class="permalink-overlay"></div>
						<div class="thumbnail-overlay" style="background-color: <?= $primary; ?>">
							<span><i class="fa fa-play iplay" aria-hidden="true"></i></span>
						</div>
					</a>
				</div>
			</div>
			<?php endwhile; ?>
		</div>
		<?php endif; // End have_posts() check. ?>
		<?php wp_reset_query();	 // Restore global post data stomped by the_post(). ?>

		<div class="cta row">
			<div class="columns">
				<?php get_template_part( 'template-parts/cta' ); ?>
			</div>
		</div>

	</article>
</section>

<?php /* Display navigation to next/previous pages when applicable */ ?>
<?php if ( function_exists( 'foundationpress_pagination' ) ) { foundationpress_pagination(); } else if ( is_paged() ) { ?>
	<nav id="post-nav">
		<div class="post-previous"><?php next_posts_link( __( '&larr; Older posts', 'foundationpress' ) ); ?></div>
		<div class="post-next"><?php previous_posts_link( __( 'Newer posts &rarr;', 'foundationpress' ) ); ?></div>
	</nav>
<?php } ?>

<?php get_footer();
