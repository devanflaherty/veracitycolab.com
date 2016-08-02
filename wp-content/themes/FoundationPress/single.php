<?php
/**
 * The template for displaying all single posts and attachments
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<?php
	if ( get_field('choose_cta') !== "Hide" ) {
		$contentMargin = "no-marg-bottom";
	}
?>

<section id="single-post" class="wrapper align-center" role="main">

<?php while ( have_posts() ) : the_post(); ?>
	<article
		data-0="transform: translate(0px , 0px);"
		data-end="transform: translate(0px , -100px);">
		<div class="main-content <?= $contentMargin; ?>" id="post-<?php the_ID(); ?>">
			<div id="contentBody" class="entry-content">
				<header id="contentHeader">
					<h1 class="entry-title"><?php the_title(); ?></h1>
				</header>

				<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
				<?php the_content(); ?>

				<footer id="contentFooter"></footer>
			</div>
		</div>
		<?php get_template_part( 'template-parts/cta' ); ?>
		<!-- <footer>
			<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
			<p><?php the_tags(); ?></p>
		</footer> -->
	</article>
<?php endwhile;?>

</section>
<?php get_footer();
