  <div class="row collapse align-center align-middle">

    <?php if(is_singular('post')) : // BLOG ?>
      <!-- BLOG AUTHOR -->
      <?php
        $author_id = get_the_author_meta('ID');

        $posts = get_field('team_member', 'user_'. $author_id);
        if( $posts ){
          foreach( $posts as $p ) :
            $permalink = get_permalink( $p->ID );
            $name = get_the_title( $p->ID );
            $title = get_field('title', $p->ID );
            $image = wp_get_attachment_image_src( get_post_thumbnail_id( $p->ID ), 'single-post-thumbnail' );
        		$image = $image[0];
          ?>
            <div class="columns author-image shrink">
              <a href="<?= $permalink; ?>"><div class="author-avatar" style="background-image: url(<?= $image; ?>);"></div></a>
            </div>

            <div class="columns author-meta">
              <span>Written by</span>
              <a href="<?= $permalink; ?>"><span><strong><?= $name; ?></strong></span></a>
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
      <!-- CREDITS SECTION -->
			<?php /*
				if( have_rows('credits') ) {
					echo "<ul class='credits'>";
					while ( have_rows('credits') ) { the_row();
						$title = get_sub_field('title');
						if (get_sub_field('veracity_employee') == true) {
								// If Creditor is a Veracity Employee we grab information from the associated relationship
								$posts = get_sub_field('team_member');
								if( $posts ){
									foreach( $posts as $p ) {
										$permalink = get_permalink( $p->ID );
										$name = get_the_title( $p->ID );
										echo '<li><span>' . $title . ':</span> <a href="' . $permalink . '"><strong>' . $name . '</strong></a></li>';
									}
								}
						} else {
							// If Creditor isn't an employee we just plop out their name
							$name = get_sub_field('name');
							$link = get_sub_field('link');
							if (get_sub_field('link')) {
								echo '<li><span>' . $title . ':</span> <a href="' . $link . '"><strong>' . $name . '</strong></a></li>';
							} else {
								echo '<li><span>' . $title . ':</span> <strong>' . $name . '</strong></li>';
							}
						}
					}
					echo "</ul>";
				}
			*/ ?>

      <!-- CATEGORIES and DATE SECTION -->
      <div class="columns small-12 medium-6 large-12 show-for-large">
        <span class="post-date"><?php the_field('completion_date'); ?></span>
        <?php
          $taxonomies = get_terms('work-categories');
          $current = $wp_query->query_vars['work-categories'];
          if ($taxonomies) {
            $i = 0;
            $c = count($taxonomies);
            foreach($taxonomies as $term) {
              $i++;
              $name = $term->name;
              $slug = $term->slug;
              echo "<span>$name</span>";
              if($c >> $i) {
                echo ", ";
              }
            }
          }
        ?>
        <?php get_template_part( 'template-parts/sidebar-share' ); ?>
      </div>
    <?php endif; ?>

  </div><!-- close row-->
