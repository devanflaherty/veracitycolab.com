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
            'query_var' => 'team-filters',
            'rewrite' => array(
                'slug' => 'team/filter/', // This controls the base slug that will display before each term
                'with_front' => true // Don't display the category base before
            )
        )
    );
}
add_action( 'init', 'team_taxonomy');

function taxonomy_slug_rewrite($wp_rewrite) {
    $rules = array();
    // get all custom taxonomies
    $taxonomies = get_taxonomies(array('_builtin' => false), 'objects');
    // get all custom post types
    $post_types = get_post_types(array('public' => true, '_builtin' => false), 'objects');
    
    foreach ($post_types as $post_type) {
        foreach ($taxonomies as $taxonomy) {
	    
            // go through all post types which this taxonomy is assigned to
            foreach ($taxonomy->object_type as $object_type) {
                
                // check if taxonomy is registered for this custom type
                if ($object_type == $post_type->rewrite['slug']) {
		    
                    // get category objects
                    $terms = get_categories(array('type' => $object_type, 'taxonomy' => $taxonomy->name, 'hide_empty' => 0));
		    
                    // make rules
                    foreach ($terms as $term) {
                        $rules[$object_type . '/filter/' . $term->slug . '/?$'] = 'index.php?' . $term->taxonomy . '=' . $term->slug;
                    }
                }
            }
        }
    }
    // merge with global rules
    $wp_rewrite->rules = $rules + $wp_rewrite->rules;
}
add_filter('generate_rewrite_rules', 'taxonomy_slug_rewrite');

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


// Set post amount for blogs so pagination is bajoinked on CPT
function set_home_pagesize( $query )
{
    if ( is_admin() || !$query->is_main_query() )
        return;

    if ( is_home() )
    {
        $query->set( 'posts_per_page', 8 );
        return;
    }

    if ( is_archive('podcast') )
    {
        $query->set( 'posts_per_page', 8 );
        return;
    }

    if ( is_archive('work') )
    {
        $query->set( 'posts_per_page', 8 );
        return;
    }

}
add_action( 'pre_get_posts', 'set_home_pagesize', 1 );


// function toolset_fix_custom_posts_per_page( $query_string ){
//     if( is_admin() || ! is_array( $query_string ) )
//         return $query_string;
//
//     $post_types_to_fix = array(
//         array(
//             'post_type' => 'podcast',
//             'posts_per_page' => 8
//         ),
//
//         array(
//             'post_type' => 'work',
//             'posts_per_page' => 8
//         ),
//
//     );
//
//     foreach( $post_types_to_fix as $fix ) {
//         if( array_key_exists( 'post_type', $query_string )
//             && $query_string['post_type'] == $fix['post_type']
//         ) {
//             $query_string['posts_per_page'] = $fix['posts_per_page'];
//             return $query_string;
//         }
//     }
//
//     return $query_string;
// }
//
// add_filter( 'request', 'toolset_fix_custom_posts_per_page' );
