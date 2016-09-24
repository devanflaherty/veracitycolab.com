<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

$colors = getColors();
$primaryColor = $colors['primary'];
$secondaryColor = $colors['secondary'];

// Set Page title
// Display a special title for front page to help SEO
if(is_front_page() ) {
  $pageTitle = "VeracityColab | Motion Graphics Design + Corporate Video Production Company | Newport Beach, CA";
} elseif(is_singular('work')) {
  // Set a special title that displays the client for work posts
  $client = getClient();
  $pageTitle = $client . " | " . get_the_title() . " - " . get_bloginfo( 'name', 'display' );
} else {
  // Fallback title for all pages
  $pageTitle =  wp_title( '-', false, 'right' ) . get_bloginfo( 'name', 'display' );
}

// Set site description
$seoDesc = get_field('seo_description', 'option');
if($seoDesc && $seoDesc !== "") {
  $description = $seoDesc;
} else {
  $description = get_bloginfo( 'description', 'display' );
}
// If is post page and if the excerpt field has content change description
if ( is_singular('post') || is_singular('work'))  {
  $excerpt = get_field('excerpt');
  if($excerpt && $excerpt !== "") {
    $description = $excerpt;
  }
}
?>

<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="google-site-verification" content="D75mcBbFpurEh5x_YA2-r91ntoWT4_SZxcXTSiTLcUQ">

    <title><?= $pageTitle; ?></title>
    <meta name="description" content="<?= strip_tags($description); ?>">
  <?php if ( is_singular('example'))  : ?>
    <meta name="robots" content="noindex">
  <?php else: ?>
    <meta name="robots" content="all">
  <?php endif; ?>
    <meta name="zipcode" content="92658">

    <?php
      if ( has_post_thumbnail( $post->ID ) ) {
        if(! is_front_page() ) {
      		$seoImage = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
      		$seoImage = $seoImage[0];
        } else {
          $seoImage = get_field('facebook_image', 'option');
        }
    	} else {
    		$seoImage = get_field('facebook_image', 'option');
    	}
    ?>
    <meta property="og:image" content="<?= $seoImage; ?>"/>
    <meta property="og:title" content="<?= $pageTitle; ?>"/>
    <meta property="og:description" content="<?= strip_tags($description); ?>">
    <meta property="og:url" content="<?php echo get_permalink(); ?>"/>
    <meta property="og:site_name" content="<?php echo get_bloginfo( 'name', 'display' ); ?>"/>
    <meta property="og:type" content="blog"/>

    <!--  twitter card tags additive with the og: tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:domain" value="http://veracitycolab.com" />
    <meta name="twitter:title" value="<?= $pageTitle; ?>" />
    <meta name="twitter:description" value="<?= strip_tags($description); ?>" />
    <meta name="twitter:image" content="<?= $seoImage; ?>" />
    <meta name="twitter:url" value="<?php echo get_permalink(); ?>" />

    <!-- FAVICONS-->
    <link rel="apple-touch-icon-precomposed" sizes="57x57" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-57x57.png" />
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-114x114.png" />
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-72x72.png" />
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-144x144.png" />
    <link rel="apple-touch-icon-precomposed" sizes="60x60" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-60x60.png" />
    <link rel="apple-touch-icon-precomposed" sizes="120x120" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-120x120.png" />
    <link rel="apple-touch-icon-precomposed" sizes="76x76" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-76x76.png" />
    <link rel="apple-touch-icon-precomposed" sizes="152x152" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/apple-touch-icon-152x152.png" />
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon-196x196.png" sizes="196x196" />
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon-96x96.png" sizes="96x96" />
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon-16x16.png" sizes="16x16" />
    <link rel="icon" type="image/png" href="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon-128.png" sizes="128x128" />
    <link rel='mask-icon' href='<?php echo get_template_directory_uri(); ?>/assets/images/favicons/favicon.svg' color='#ff0000'>
    <meta name="application-name" content="&nbsp;"/>
    <meta name="msapplication-TileColor" content="#FFFFFF" />
    <meta name="msapplication-TileImage" content="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/mstile-144x144.png" />
    <meta name="msapplication-square70x70logo" content="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/mstile-70x70.png" />
    <meta name="msapplication-square150x150logo" content="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/mstile-150x150.png" />
    <meta name="msapplication-wide310x150logo" content="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/mstile-310x150.png" />
    <meta name="msapplication-square310x310logo" content="<?php echo get_template_directory_uri(); ?>/assets/images/favicons/mstile-310x310.png" />

		<?php wp_head(); ?>

    <!-- Fonts -->
		<script src="https://use.typekit.net/kud3sdw.js"></script>
		<script>try{Typekit.load({ async: true });}catch(e){}</script>
    <script src="https://use.fontawesome.com/771c954b4a.js"></script>

    <!-- wait for images -->
    <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery.waitforimages/1.5.0/jquery.waitforimages.min.js"></script>

    <!-- WISTIA EMBED CODE -->
    <script charset="ISO-8859-1" src="//fast.wistia.com/assets/external/E-v1.js" async></script>

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
  		<div class="row align-center align-middle">

        <div class="small-11 medium-5 large-4 columns">
					<h4>VERACITYCOLAB</h4>
          <h6><?php bloginfo('description'); ?></h6>
          <br>

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
        <div class="small-11 medium-5 large-4 columns">
          <?php foundationpress_contact_nav(); ?>
  			</div>

        <button class="button round" id="closeForm"><i class="fa fa-times" aria-hidden="true"></i></button>

  		</div>
  	</section>

    <section id="mobileMenu" class="menu" style="display:none;">
      <?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) == 'topbar' ) : ?>
        <?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
      <?php endif; ?>
    </section>

    <div id="navBar" data-sticky-container style="height:107px">
    	<header id="masthead" class="site-header" role="banner" data-sticky data-options="marginTop:0;">
        <div id="loadBar">
      		<span style="background-color: <?= $primaryColor ?>;width: 0">&nbsp;</span>
      	</div>
    		<div class="title-bar" data-responsive-toggle="site-navigation">
    			<div class="title-bar-title">
            <a class="home-link" href="/">
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
    						<a href="/">
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
  		<div class="overlay load"></div>
  		<?php do_action( 'foundationpress_after_header' );
