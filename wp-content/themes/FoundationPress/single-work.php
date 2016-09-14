<?php
/**
 * The template for displaying all work single posts
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php
	if ( get_field('choose_cta') !== "Hide" ) {
		$contentMargin = "no-marg-bottom";
	}
?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<section id="singleWork" class="wrapper" role="main">
	<?php while ( have_posts() ) : the_post(); // While we have a post let's show it off?>

	<!-- MAIN CONTENT : Skrollr animation set to parralax the article up -->
	<article
		data-0="transform: translate(0px , 0px);"
		data-end="transform: translate(0px , -100px);">
		<div class="main-content <?= $contentMargin; ?>" id="post-<?php the_ID(); ?>">
			<?php
				$client = getClient();
			?>
			<header id="contentHeader">
				<h6><?= $client; ?></h6>
				<h1 class="entry-title"><?php the_title(); ?></h1>
				<?php get_template_part( 'template-parts/single-meta' ); ?>
			</header>

			<div id="contentBody" class="entry-content">
				<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
				<?php the_content(); ?>
			</div>

			<footer id="contentFooter">
				<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
				<p><?php the_tags(); ?></p>
			</footer>
		</div>

		<div class="cta">
			<?php get_template_part( 'template-parts/cta' ); ?>
		</div>
	</article>
	<!-- CLOSE MAIN CONTENT -->
<?php endwhile;?>

<?php if(get_field('show_sidebar') == true) : ?>
	<!-- SIDEBAR -->
	<?php if(get_field('unstick') == true) : ?>
		<aside class="sidebar show-for-large" id="sidebar">
	    <div class="side-wrap">
				<?php get_template_part( 'template-parts/sidebar' ); ?>
			</div>
		</aside>
	<?php else : ?>
		<aside class="sidebar show-for-large" id="sidebar">
		  <div data-sticky-container>
		    <div class="sticky side-wrap" data-sticky data-anchor="singleWork" data-check-every="0" data-options="marginTop:7;" data-sticky-on="large">
					<?php get_template_part( 'template-parts/sidebar' ); ?>
				</div>
			</div>
		</aside>
	<?php endif; ?>
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
