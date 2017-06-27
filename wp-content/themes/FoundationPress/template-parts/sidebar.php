  <div class="row collapse align-center align-middle">

    <?php if(is_singular('post')) : // BLOG ?>
      <!-- BLOG AUTHOR -->
      <?php
        $author_id = get_the_author_meta('ID');

        $posts = get_field('team_member', 'user_'. $author_id);
        if( $posts ){
          foreach( $posts as $p ) :
            $status = get_post_status( $p->ID );
            $permalink = get_permalink( $p->ID );
            $name = get_the_title( $p->ID );
            $title = get_field('title', $p->ID );
            $image = wp_get_attachment_image_src( get_post_thumbnail_id( $p->ID ), 'single-post-thumbnail' );
        		$image = $image[0];
          ?>
            <div class="columns author-image shrink">
              <?php if($status != 'publish') : ?>
                <a href="<?= $permalink; ?>">
              <?php endif;?>
                <div class="author-avatar" style="background-image: url(<?= $image; ?>);"></div>
              <?php if($status != 'publish') : ?>
                </a>
              <?php endif;?>
            </div>

            <div class="columns author-meta">
              <span>Written by</span>
              <?php if($status != 'publish') : ?>
                <a href="<?= $permalink; ?>">
              <?php endif;?>
                <span><strong><?= $name; ?></strong></span>
              <?php if($status != 'publish') : ?>
                </a>
              <?php endif;?>
              <span><?= $title; ?></span>
            </div>
        <?php
          endforeach;
          }
        ?>
        <!-- CATEGORIES and DATE SECTION -->
        <div class="sidebar-meta columns small-6 medium-12 large-12">
          <span class="post-date"><?php the_time('F j, Y'); ?></span>
    			<?php
            $categories = get_the_category();
            foreach($categories as $term) {
              if ($term->slug != "all") {
                $slug = $term->slug;
                $name = $term->name;
                echo "<a href=\"/category/" . $slug . "\">" . $name . "</a>";
              }
            }
          ?>
          <?php get_template_part( 'template-parts/sidebar-share' ); ?>
        </div>
    <?php endif; ?>

    <?php if(is_singular('podcast')) : ?>
      <!-- POST DATE -->
      <div class="sidebar-section columns small-12 medium-11 large-12">
        <span class="post-date"><?php the_time('F j, Y'); ?></span>

        <?php get_template_part( 'template-parts/sidebar-share' ); ?>
      </div>
    <?php endif; ?>

    <?php if(is_singular('work')) : ?>
      <!-- CATEGORIES and DATE SECTION -->
      <div class="columns small-12 medium-6 large-12 show-for-large">
        <span class="post-date"><?php the_field('completion_date'); ?></span>
        <?php
          $taxonomies = get_the_terms(get_the_ID(), 'work-categories');
          if ($taxonomies) {
            $i = 0;
            $c = count($taxonomies);
            foreach($taxonomies as $term) {
              $name = $term->name;
              $slug = $term->slug;
              echo "<span>$name</span>";
              if ($i < ($c - 1)) {
                echo ", ";
              }
              $i++;
            }
          }
        ?>

        <!-- CREDITS SECTION -->
  			<?php
  				if( have_rows('credits') ) {
  					echo "<ul class='credits'>";
  					while ( have_rows('credits') ) { the_row();
  						$role = get_sub_field('role');
  						$posts = get_sub_field('team_member');
  						if( $posts ){
                echo '<li><span>' . $role . ':</span><br>';
                $i = 0;
                $c = count($posts);
  							foreach( $posts as $p ) {
                  $status = get_post_status( $p->ID );
                  $name = get_the_title( $p->ID );
                  if(get_post_type( $p->ID ) == 'creditor') {
                    $permalink = get_field( 'website', $p->ID );
                    if($permalink) {
                      $creditor = ' <a href="' . $permalink . '" target="_blank">' . $name . '</a>';
                    } else {
                      $creditor = ' <span class="creditor">' . $name . '</span>';
                    }
                  } else {
                    if($status != 'publish') {
    				          $creditor = '<span class="creditor">' . $name . '</span>';
                    } else {
                      $permalink = get_permalink( $p->ID );
    				          $creditor = ' <a href="' . $permalink . '">' . $name . '</a>';
                    }
                  }
                  echo $creditor;

                  if ($i < ($c - 1)) {
                    echo ", ";
                  }

                  $i++;
  							}
                echo '</li>';
              }
  					}
  					echo "</ul>";
  				}
  			?>

        <?php get_template_part( 'template-parts/sidebar-share' ); ?>
      </div>
    <?php endif; ?>

  </div><!-- close row-->
