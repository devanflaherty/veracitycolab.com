<?php
/**
 * The template for displaying all work single posts
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

get_header(); ?>

<?php get_template_part( 'template-parts/featured-image' ); ?>

<section id="singleWork" class="align-center" role="main">
	<?php while ( have_posts() ) : the_post(); // While we have a post let's show it off?>

	<!-- MAIN CONTENT : Skrollr animation set to parralax the article up -->
	<article class="main-content" id="post-<?php the_ID(); ?>"
    data-0="margin-top: -60px;"
    data-top-bottom="margin-top: -800px;">
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
				<h1 class="entry-title"><?php the_title(); ?> <span style="color: #ccc"><?= $client; ?></span></h1>
			</header>

			<!-- Note: #contentBody is heavily formatted by javascript cause of the returned MarkDown -->
			<?php the_content(); ?>

			<footer id="contentFooter">
				<?php wp_link_pages( array('before' => '<nav id="page-nav"><p>' . __( 'Pages:', 'foundationpress' ), 'after' => '</p></nav>' ) ); ?>
				<p><?php the_tags(); ?></p>
			</footer>
		</div>
		<?php do_action( 'foundationpress_post_before_comments' ); ?>
		<?php comments_template(); ?>
		<?php do_action( 'foundationpress_post_after_comments' ); ?>
	</article>
	<!-- CLOSE MAIN CONTENT -->
<?php endwhile;?>

<!-- SIDEBAR -->
<aside class="sidebar show-for-large" id="workSidebar">
  <div clas="row" data-sticky-container>
    <div class="sticky" data-sticky data-top-anchor="workSidebar:top" data-btm-anchor="contentFooter:top" data-check-every="0" data-options="marginTop:6;">
      <span><?php the_field('completion_date'); ?></span><br>

			<!-- CREDITS SECTION -->
			<?php
				if( have_rows('credits') ) {
					echo "<div class='credits'>";
					while ( have_rows('credits') ) { the_row();
						$title = get_sub_field('title');
						if (get_sub_field('veracity_employee') == true) {
								// If Creditor is a Veracity Employee we grab information from the associated relationship
								$posts = get_sub_field('team_member');
								if( $posts ){
									foreach( $posts as $p ) {
										$permalink = get_permalink( $p->ID );
										$name = get_the_title( $p->ID );
										echo '<span>' . $title . ': <strong>' . $name . '</strong></span><br>';
									}
								}
						} else {
							// If Creditor isn't an employee we just plop out their name
							$name = get_sub_field('name');
							echo '<span>' . $title . ': <strong>' . $name . '</strong></span><br>';
						}
					}
					echo "</div>";
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
    </div>
  </div>
</aside>
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
