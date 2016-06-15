<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

 if ( is_post_type_archive('work') ) {
	 $primaryColor = get_field( 'work_primary_color', 'option' );
	 $secondaryColor = get_field( 'work_secondary_color', 'option' );
 } elseif ( is_post_type_archive('team') ) {
	 $primaryColor = get_field( 'team_primary_color', 'option' );
	 $secondaryColor = get_field( 'team_secondary_color', 'option' );
 } elseif (get_field( 'primary_color' ) && get_field( 'secondary_color' )) {
	 $primaryColor = get_field( 'primary_color' );
	 $secondaryColor = get_field( 'secondary_color' );
 } else {
   $primaryColor = get_field( 'global_primary_color', 'options' );
   $secondaryColor = get_field( 'global_secondary_color', 'options' );
 }

?>
		</section>
		<div id="footer-container" style="background-color: <?= $secondaryColor; ?>">
			<footer id="footer" class="row expand">
				<div class="small-12 large-9 columns">
					<h2><?php the_field( 'footer_headline', 'option' ); ?></h2>
					<div class="footer-info float-left">
						<span>VERACITYCOLAB</span><br><br>
						<span><?php the_field( 'company_address', 'option' ); ?></span><br><br>
						<a href="tel:<?php the_field( 'company_phone', 'option' ); ?>"><?php the_field( 'company_phone', 'option' ); ?></a>
					</div>
					<div class="footer-menu float-left">
						<?php foundationpress_footer_nav(); ?>
					</div>
				</div>
				<div class="small-12 large-3 columns">
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
				<?php do_action( 'foundationpress_before_footer' ); ?>
				<?php dynamic_sidebar( 'footer-widgets' ); ?>
				<?php do_action( 'foundationpress_after_footer' ); ?>
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

<!-- TRACKING SCRIPTS -->
<!-- DO NOT COPY THIS SNIPPET! HubSpot User Identification Code -->
<script type="text/javascript">
(function(d,w) {
var match = d.cookie.match('(^|;) ?hubspotutk=([^;]*)(;|$)');
if (match && match[2] == "1df787dd84224c6ce4eb5bd6d73d9bf5") {
w._hsq = w._hsq || [];
w._hsq.push(["identify", {
  "email" : "tannershaffer1@gmail.com",
  "name" : "Developer",
  "id" : "d44d621ef3f52eb97f03835a32ef69f2"
}]);
}
})(document, window);
</script>
<!-- End of HubSpot User Identification Code DO NOT COPY THIS SNIPPET! -->
<!-- Start of Async HubSpot Analytics Code for WordPress v1.0.0 -->
<script type="text/javascript">
var _hsq = _hsq || [];
_hsq.push(["setContentType", "listing-page"]);
(function(d,s,i,r) {
  if (d.getElementById(i)){return;}
  var n = d.createElement(s),e = document.getElementsByTagName(s)[0];
  n.id=i;n.src = '//js.hs-analytics.net/analytics/'+(Math.ceil(new Date()/r)*r)+'/604644.js';
  e.parentNode.insertBefore(n, e);
})(document, "script", "hs-analytics", 300000);
</script>
<!-- End of Async HubSpot Analytics Code -->
<script src="//fast.wistia.com/static/integrations-hubspot-v1.js" async></script>

<script>
window.addEventListener("load", function(){
var timer = setInterval(function(){
if(jQuery('.submitted-message').is(":visible") == true){
ga('send','event','Form','Click','Contact Us')
clearInterval(timer);
}
},1000);
});
</script>

<!-- ADROLL -->
<script type="text/javascript">
   adroll_adv_id = "L7B67TPDMNCY3O3CHXP4NE";
   adroll_pix_id = "XNK73F3IZNCJ5AOPCLGOZL";
   /* OPTIONAL: provide email to improve user identification */
   /* adroll_email = "username@example.com"; */
   (function () {
       var _onload = function(){
           if (document.readyState && !/loaded|complete/.test(document.readyState)){setTimeout(_onload, 10);return}
           if (!window.__adroll_loaded){__adroll_loaded=true;setTimeout(_onload, 50);return}
           var scr = document.createElement("script");
           var host = (("https:" == document.location.protocol) ? "https://s.adroll.com" : "http://a.adroll.com");
           scr.setAttribute('async', 'true');
           scr.type = "text/javascript";
           scr.src = host + "/j/roundtrip.js";
           ((document.getElementsByTagName('head') || [null])[0] ||
               document.getElementsByTagName('script')[0].parentNode).appendChild(scr);
       };
       if (window.addEventListener) {window.addEventListener('load', _onload, false);}
       else {window.attachEvent('onload', _onload)}
   }());
</script>

</body>
</html>
