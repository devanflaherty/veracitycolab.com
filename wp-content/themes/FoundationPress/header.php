<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
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
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="google-site-verification" content="D75mcBbFpurEh5x_YA2-r91ntoWT4_SZxcXTSiTLcUQ">

    <!-- Facebook Pixel Code -->
    <script>
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '613751512109020');
    fbq('track', "PageView");
    </script>
    <noscript>&lt;img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=613751512109020&amp;ev=PageView&amp;noscript=1"/&gt;</noscript>
    <!-- End Facebook Pixel Code -->

		<?php wp_head(); ?>
		<script src="https://use.typekit.net/kud3sdw.js"></script>
		<script>try{Typekit.load({ async: true });}catch(e){}</script>

    <?php if ( is_post_type_archive('team'))  : ?>
      <script src="https://npmcdn.com/imagesloaded@4.1/imagesloaded.pkgd.min.js"></script>
      <script src="https://npmcdn.com/isotope-layout@3.0/dist/isotope.pkgd.js"></script>
    <?php endif; ?>

		<style>
			.top-bar .menu .colorize a, .home-link.colorize path {
				color: <?= $primaryColor ?>;
				fill: <?= $primaryColor ?>;
			}
			.top-bar .menu .colorize a:hover, .home-link.colorize:hover path {
		    color: <?= $secondaryColor ?>;
				fill: <?= $secondaryColor ?>;
		  }
      #mobileMenu, #mobileMenu ul {
        background-color: <?= $primaryColor ?>;
      }
      #mobileToggle.menu-icon::after {
        background: <?= $primaryColor ?>;
        box-shadow: 0 7px 0 <?= $primaryColor ?>, 0 14px 0 <?= $primaryColor ?>;
      }
			h1 {
				color: <?= $primaryColor ?>
			}
      .main-content blockquote {
        border-color: <?= $primaryColor ?>
      }
      .main-content .social-nav a:hover {
        color: <?= $primaryColor ?>!important;
      }
      .feature-overlay {
        background: <?= $primaryColor ?>;
      }
    </style>
	</head>
	<body <?php body_class(); ?>>
	<div id="skrollr-body">
	<?php do_action( 'foundationpress_after_body' ); ?>

	<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
	<div class="off-canvas-wrapper">
		<div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
		<?php get_template_part( 'template-parts/mobile-off-canvas' ); ?>
	<?php endif; ?>

	<?php do_action( 'foundationpress_layout_start' ); ?>

	<!-- Contact -->
	<section id="contactForm" style="background-color: <?= $primaryColor ?>; display: none;">
		<div class="row align-center">
			<div class="small-10 medium-6 large-4 columns text-center">
				<h5 class="contrast-text upper"><strong>Pleased to meet you</strong></h5>
				<br><br>
				<form>
					<div class="inputs">
						<div class="field">
							<input id="contactName" class="float-input" type="text" name="name" placeholder="Full Name" />
							<label for="name">Full Name</label>
						</div>
						<div class="field">
							<input id="contactEmail" class="float-input" type="email" name="email" placeholder="Email Address" />
							<label for="email">Email Address</label>
						</div>
						<textarea id="contactMessage" placeholder="I'm Contacting Because..."></textarea>
					</div>
					<input id="formSubmit" value="Send" name="send" class="button white hollow expanded disabled" />
				</form>
				<button class="button round secondary" id="closeForm">X</button>
			</div>
		</div>
	</section>

  <section id="mobileMenu" class="menu" style="display:none;">
    <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) == 'topbar' ) : ?>
      <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
    <?php endif; ?>
  </section>

  <div id="navBar" data-sticky-container style="height:87px">
  	<header id="masthead" class="site-header" role="banner" data-sticky data-options="marginTop:0;">
      <div id="loadBar">
    		<span style="background-color: <?= $primaryColor ?>;width: 0">&nbsp;</span>
    	</div>
  		<div class="title-bar" data-responsive-toggle="site-navigation">
  			<div class="title-bar-title">
          <a class="home-link" href="/home">
            <svg width="26px" height="35px" viewBox="0 0 26 35">
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="screenshot" transform="translate(-138.000000, -95.000000)" fill="#231F20">
                        <path d="M138.077431,95.0380317 L148.763833,95.0380317 L143.083885,120.890652 L138.077431,95.0380317 Z M153.114935,95.1115839 L163.983754,95.1115839 L156.862665,129.098589 L145.269203,129.098589 L153.114935,95.1115839 Z" id="veracityLogo" class="veracity-logo"></path>
                    </g>
                </g>
            </svg>
          </a>
  			</div>
        <button id="mobileToggle" class="menu-icon" type="button"></button>
  		</div>

  		<nav id="site-navigation" class="main-navigation top-bar" role="navigation" style="width:100%">
  			<div class="top-bar-left">
  				<ul class="menu">
  					<li class="home-link">
  						<!-- LOGO -->
  						<a href="/home">
  							<svg width="26px" height="35px" viewBox="0 0 26 35">
  							    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
  							        <g id="screenshot" transform="translate(-138.000000, -95.000000)" fill="#231F20">
  							            <path d="M138.077431,95.0380317 L148.763833,95.0380317 L143.083885,120.890652 L138.077431,95.0380317 Z M153.114935,95.1115839 L163.983754,95.1115839 L156.862665,129.098589 L145.269203,129.098589 L153.114935,95.1115839 Z" id="veracityLogo" class="veracity-logo"></path>
  							        </g>
  							    </g>
  							</svg>
  						</a>
  				  </li>
  				</ul>
  			</div>
  			<div class="top-bar-right">
  				<?php foundationpress_top_bar_r(); ?>
  			</div>
  		</nav>
  	</header>
  </div>

	<section class="container">
		<div class="overlay"></div>
		<?php do_action( 'foundationpress_after_header' );
