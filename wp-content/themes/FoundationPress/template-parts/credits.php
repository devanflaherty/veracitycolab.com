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
            if (get_post_status( $p->ID ) != 'publish' ) {
              $pStart = '<a href="';
              $permalink = get_permalink( $p->ID );
              $pCap = '">';
              $pEnd = '</a>'
            }
            $permalink = get_permalink( $p->ID );
            $name = get_the_title( $p->ID );
            echo '<li><span>hi'. get_post_status( $p->ID ) . $title . ':</span>' . $pStart . $permalink . $pCap .'<strong>' . $name . '</strong>'.$pEnd.'</li>';
          }
        }
    } else {
      // If Creditor isn't an employee we just plop out their name
      $name = get_sub_field('name');
      $link = get_sub_field('link');
      if (get_sub_field('link')) {
        echo '<li><span>' . $title . ':hi</span> <a href="' . $link . '"><strong>' . $name . '</strong></a></li>';
      } else {
        echo '<li><span>' . $title . ':</span> <strong>' . $name . '</strong></li>';
      }
    }
  }
  echo "</ul>";
}
?>
