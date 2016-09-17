<?php
/**
 * Author: Ole Fredrik Lie
 * URL: http://olefredrik.com
 *
 * FoundationPress functions and definitions
 *
 * Set up the theme and provides some helper functions, which are used in the
 * theme as custom template tags. Others are attached to action and filter
 * hooks in WordPress to change core functionality.
 *
 * @link https://codex.wordpress.org/Theme_Development
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

/** Various clean up functions */
require_once( 'library/cleanup.php' );

/** Required for Foundation to work properly */
require_once( 'library/foundation.php' );

/** Register all navigation menus */
require_once( 'library/navigation.php' );

/** Add menu walkers for top-bar and off-canvas */
require_once( 'library/menu-walkers.php' );

/** Create widget areas in sidebar and footer */
require_once( 'library/widget-areas.php' );

/** Return entry meta information for posts */
require_once( 'library/entry-meta.php' );

/** Enqueue scripts */
require_once( 'library/enqueue-scripts.php' );

/** Add theme support */
require_once( 'library/theme-support.php' );

/** Add Nav Options to Customer */
require_once( 'library/custom-nav.php' );

/** Change WP's sticky post class */
require_once( 'library/sticky-posts.php' );

/** Configure responsive image sizes */
require_once( 'library/responsive-images.php' );

/** Configure convert color to hex */
require_once( 'library/hex.php' );

/** Get The Client for work posts */
require_once( 'library/get-client.php' );

/** Get site colors */
require_once( 'library/colors.php' );
/** Get site colors */
require_once( 'library/get-cta.php' );

/** If your site requires protocol relative url's for theme assets, uncomment the line below */
// require_once( 'library/protocol-relative-theme-assets.php' );


// Fixes taxonomy so display on CPT archive
function team_taxonomy() {
    register_taxonomy(
        'team-filters',  //The name of the taxonomy. Name should be in slug form (must not contain capital letters or spaces).
        'team',        //post type name
        array(
            'hierarchical' => true,
            'label' => 'Team Filters',  //Display name
            'query_var' => true,
            'rewrite' => array(
                'slug' => 'filter', // This controls the base slug that will display before each term
                'with_front' => false // Don't display the category base before
            )
        )
    );
}
add_action( 'init', 'team_taxonomy');

// CUSTOM FIELD functions
if( function_exists('acf_add_options_page') ) {

	acf_add_options_page(array(
		'page_title' 	=> 'Design',
		'menu_title'	=> 'Design',
		'menu_slug' 	=> 'design',
		'icon_url' => 'dashicons-edit',
		'capability'	=> 'edit_posts',
		'redirect'		=> true
	));

	acf_add_options_sub_page(array(
		'page_title' 	=> 'Page Theme Settings',
		'menu_title'	=> 'Page Themes',
		'parent_slug'	=> 'design',
		'redirect'		=> false
	));

	acf_add_options_sub_page(array(
		'page_title' 	=> 'Content Settings',
		'menu_title'	=> 'Content Settings',
		'parent_slug'	=> 'design',
		'redirect'		=> false
	));

	acf_add_options_sub_page(array(
		'page_title' 	=> 'Call To Action Settings',
		'menu_title'	=> 'CTAs',
		'parent_slug'	=> 'design',
		'redirect'		=> false
	));

}
