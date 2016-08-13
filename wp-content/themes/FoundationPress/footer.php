<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

 $colors = getColors();
 $primaryColor = $colors['primary'];
 $secondaryColor = $colors['secondary'];

?>
  	</section>
  	<div id="footer-container" style="background-color: <?= $secondaryColor; ?>">
  		<footer id="footer" class="row expand">
  			<div class="small-12 medium-9 large-9 columns">
  				<h2><?php the_field( 'footer_headline', 'option' ); ?></h2>
  				<div class="footer-info float-left">
  					<span>VERACITYCOLAB</span><br><br>
  					<span><?php the_field( 'company_address', 'option' ); ?></span><br><br>
  					<a href="tel:<?php the_field( 'phone_number', 'option' ); ?>"><?php the_field( 'phone_number', 'option' ); ?></a>
            <br><br>
            <div class="team-social">
    					<?php
    						if( have_rows('footer_social', 'option') ) {
    							echo "<nav class=\"social-nav\">";
    							while ( have_rows('footer_social', 'option') ) { the_row();
    								$url = get_sub_field('url');
    								echo "<a href=\"" . $url . "\" target=\"_blank\">";
    								the_sub_field('icon');
    								echo "</a>";
    							}
    							echo "</nav>";
    						}
    					?>
            </div>
  				</div>
  				<div class="footer-menu float-left">
  					<?php foundationpress_footer_nav(); ?>
  				</div>
  			</div>
  			<div class="small-12 medium-3 large-3 columns">
          <img class="show-for-medium" src="<?php the_field( 'footer_logo', 'option' ); ?>">
  			</div>
  		</footer>
  	</div>

  	<?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
		</div><!-- Close off-canvas wrapper inner -->
	</div><!-- Close off-canvas wrapper -->
</div><!-- Close off-canvas content wrapper -->
<?php endif; ?>


<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>
</div><!-- CLOSE SKROLLR -->

<?php get_template_part( 'template-parts/scripts' ); ?>
</body>
</html>
