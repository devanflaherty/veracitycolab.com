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

<section id="singleWork" class="wrapper align-center" role="main">
	<?php while ( have_posts() ) : the_post(); // While we have a post let's show it off?>

	<!-- MAIN CONTENT : Skrollr animation set to parralax the article up -->
	<article class="main-content <?= $contentMargin; ?>" id="post-<?php the_ID(); ?>"
		data-0="transform: translate(0px , 0px);"
		data-end="transform: translate(0px , -100px);"
		>
		<div id="contentBody" class="entry-content">
			<?php
				$clients = get_field('client');
				if( $clients ) {
					foreach( $clients as $p ) {
						$client = get_the_title( $p->ID );
					}
				}
			?>
			<header id="contentHeader">
				<h6><?= $client; ?></h6>
				<h1 class="entry-title"><?php the_title(); ?></h1>
			</header>

			<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
			<?php the_content(); ?>

			<footer id="contentFooter">
				<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
				<p><?php the_tags(); ?></p>
			</footer>
		</div>
	</article>
	<!-- CLOSE MAIN CONTENT -->
<?php endwhile;?>


<?php if(get_field('show_sidebar') == true) : ?>
<!-- SIDEBAR -->
<aside class="sidebar show-for-large" id="workSidebar">
  <div clas="row" data-sticky-container>
    <div class="sticky" data-sticky data-top-anchor="workSidebar:top" data-btm-anchor="contentFooter:top" data-check-every="0" data-options="marginTop:6;">
      <span><?php the_field('completion_date'); ?></span><br>

			<!-- CREDITS SECTION -->
			<?php
				if( have_rows('credits') ) {
					echo "<ul class='credits'>";
					while ( have_rows('credits') ) { the_row();
						$title = get_sub_field('title');
						if (get_sub_field('veracity_employee') == true) {
								// If Creditor is a Veracity Employee we grab information from the associated relationship
								$posts = get_sub_field('team_member');
								if( $posts ){
									foreach( $posts as $p ) {
										$permalink = get_permalink( $p->ID );
										$name = get_the_title( $p->ID );
										echo '<li><span>' . $title . ':</span> <a href="' . $permalink . '"><strong>' . $name . '</strong></a></li>';
									}
								}
						} else {
							// If Creditor isn't an employee we just plop out their name
							$name = get_sub_field('name');
							$link = get_sub_field('link');
							if (get_sub_field('link')) {
								echo '<li><span>' . $title . ':</span> <a href="' . $link . '"><strong>' . $name . '</strong></a></li>';
							} else {
								echo '<li><span>' . $title . ':</span> <strong>' . $name . '</strong></li>';
							}
						}
					}
					echo "</ul>";
				}
			?>

			<!-- CATEGORIES SECTION -->
			<?php
				$terms = get_field('categories');
				if( $terms ): ?>
					<div class="categories">
						<span>Categories:</span><br>
						<?php foreach( $terms as $term ): ?>
							<a href="<?php echo get_term_link( $term ); ?>"><?php echo $term->name; ?></a>,
						<?php endforeach; ?>
					</div>
				<?php endif; ?>

				<!-- SHARE SECTION TODO: Need to figure this out still-->
				<span>Share:</span><br>
				<nav>
					<a target="_blank" href="http://twitter.com/share?url=<?php echo get_permalink(); ?>
&amp;text=Look at this awesome work done by the @veracityColab team for <?= $client; ?>"><i class="fa fa-twitter" aria-hidden="true"></i></a>
					<a target="_blank" href="http://www.facebook.com/sharer.php?u=http:<?php echo get_permalink(); ?>"><i class="fa fa-facebook-official" aria-hidden="true"></i></a>
				</nav>
    </div>
  </div>
</aside>
<?php else :?>
	<?php $sideBar = "align-center"; ?>
<?php endif; ?>
<!-- CLOSE SIDEBAR -->

<div class="row cta-row <?= $sideBar; ?>">
	<div class="columns small-12 medium-11 large-8">
		<?php get_template_part( 'template-parts/cta' ); ?>
	</div>
</div>

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
