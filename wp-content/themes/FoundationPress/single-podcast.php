<?php
/**
 * The template for displaying all single posts and attachments
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

<?php if(get_field('show_featured_image') == true) : ?>
  <?php $pullUp = "-100"; ?>
 <?php get_template_part( 'template-parts/featured-image' ); ?>
<?php else: ?>
  <?php $pullUp = "0"; ?>
<?php endif; ?>

<section id="single-post" class="wrapper align-center" role="main">

<?php while ( have_posts() ) : the_post(); ?>
	<article
		data-0="transform: translate(0px , 0px); margin-bottom: 0px"
		data-end="transform: translate(0px , <?= $pullUp; ?>px); margin-bottom: 60px">
		<div class="main-content <?= $contentMargin; ?>" id="post-<?php the_ID(); ?>"
			style="margin-top: <?= $pullUp; ?>">
			<div id="contentBody" class="entry-content">
				<header id="contentHeader">
					<h6>Episode <?php the_field('episode'); ?></h6>
					<h1 class="entry-title"><?php the_title(); ?></h1>
          <?php get_template_part( 'template-parts/single-meta' ); ?>
				</header>

				<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
				<?php the_content(); ?>

				<footer id="contentFooter"></footer>
			</div>
		</div>
		<!-- <footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer> -->
	</article>

	<!-- SIDEBAR -->
	<aside class="sidebar show-for-large" id="sidebar">
	  <div data-sticky-container>
	    <div class="sticky side-wrap" data-sticky data-top-anchor="sidebar:top" data-btm-anchor="contentFooter:top" data-check-every="0" data-options="marginTop:7;" data-sticky-on="large">
				<?php get_template_part( 'template-parts/sidebar' ); ?>
			</div>
		</div>
	</aside>

	<div class="cta">
		<?php get_template_part( 'template-parts/cta' ); ?>
	</div>
<?php endwhile;?>

</section>
<?php get_footer();
