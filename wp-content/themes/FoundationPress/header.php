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

 $description = "VeracityColab is a video production & motion graphics agency based in Newport Beach, CA. We make live action & motion graphic brand videos!";

?>
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="google-site-verification" content="D75mcBbFpurEh5x_YA2-r91ntoWT4_SZxcXTSiTLcUQ">

  <?php if(is_front_page() ) : ?>
    <title>VeracityColab | Motion Graphics Design + Corporate Video Production Company | Newport Beach, CA</title>
  <?php endif; ?>
    <meta name="description" content="<?= $description; ?>">
  <?php if ( is_singular('advance'))  : ?>
    <meta name="robots" content="noindex">
  <?php else: ?>
    <meta name="robots" content="all">
  <?php endif; ?>
    <meta name="zipcode" content="92658">

  <?php if ( is_post_type_archive('work'))  : ?>
    <meta property="og:description" content="Check out <?php the_title(); ?>, some awesome work from VeracityColab. <?= $description; ?>">
  <?php else: ?>
    <meta property="og:description" content="<?= $description; ?>">
  <?php endif; ?>
  <?php
    if ( has_post_thumbnail( $post->ID ) ) {
      if(! is_front_page() ) {
    		$fbImage = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
    		$fbImage = $fbImage[0];
      } else {
        $fbImage = get_field('facebook_image', 'option');
      }
  	} else {
  		$fbImage = get_field('facebook_image', 'option');
  	}
  ?>
    <meta property="og:image" content="<?= $fbImage; ?>"/>
    <meta property="og:title" content="<?php the_title(); ?> - VeracityColab"/>
    <meta property="og:url" content="<?php echo get_permalink(); ?>"/>
    <meta property="og:site_name" content="VeracityColab"/>
    <meta property="og:type" content="blog"/>

		<?php wp_head(); ?>
		<script src="https://use.typekit.net/kud3sdw.js"></script>
		<script>try{Typekit.load({ async: true });}catch(e){}</script>

    <!-- WISTIA EMBED CODE -->
    <script charset="ISO-8859-1" src="//fast.wistia.com/assets/external/E-v1.js" async></script>
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
    <!-- Hotjar Tracking Code for http://www.veracitycolab.com -->
    <script>
      (function(h,o,t,j,a,r){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:232315,hjsv:5};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
      })(window,document,'//static.hotjar.com/c/hotjar-','.js?sv=');
    </script>
    <!-- CALL RAIL -->
    <script src="//cdn.callrail.com/companies/176691639/d7e924485e706ce162f8/12/swap.js"></script>

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
      #mobileToggle span {
        background: <?= $primaryColor ?>;
      }
			#contentBody h1, #contentBody h6 {
				color: <?= $primaryColor ?>!important;
			}
      #contentBody blockquote {
        border-color: <?= $primaryColor ?>
      }
      .main-content .social-nav a:hover {
        color: <?= $primaryColor ?>!important;
      }
      .feature-overlay {
        background: <?= $primaryColor ?>;
      }
      .pagination .current {
        background: <?= $secondaryColor ?>!important;
      }
      .pagination a:hover {
        border-color: <?= $secondaryColor ?>!important;
      }
      #closeForm {
        background: <?= $secondaryColor ?>;
      }
      .sidebar h3 {
        color: <?= $primaryColor ?>;
      }
      .sidebar .button-wrapper a {
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
  	<section id="contactForm" style="background-color: <?= $primaryColor ?>;">
  		<div class="row align-center">
  			<div class="small-10 medium-6 large-4 columns text-center">
  				<h5 id="message" class="contrast-text upper"><strong>Pleased to meet you</strong></h5>
  				<br><br>

  				<form action="/wp-content/themes/FoundationPress/form-submit.php" method="POST" id="contact">
  					<div class="inputs">
  						<div class="field" id="nameInput">
  							<input id="contactName" class="float-input" type="text" name="firstname" placeholder="Full Name" />
  							<label for="name">Full Name</label>
  						</div>
  						<div class="field" id="emailInput">
  							<input id="contactEmail" class="float-input" type="email" name="email" placeholder="Email Address" />
  							<label for="email">Email Address</label>
  						</div>
              <div class="field" id="commentInput">
    						<textarea id="contactMessage" placeholder="I'm Contacting Because..." name="comment"></textarea>
              </div>
  					</div>
  					<button type="submit" id="formSubmit" name="send" class="button white hollow expanded disabled" />Send</button>
  				</form>
  				<button class="button round" id="closeForm">X</button>
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
          <button id="mobileToggle" class="menu-hamburger" type="button">
            <span></span>
            <span></span>
            <span></span>
          </button>
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
