<div class="row single-meta align-middle hide-for-large">

  <?php if(is_singular('post')) : // BLOG ?>
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
        <div class="columns shrink">
          <a href="<?= $permalink; ?>"><div class="author-avatar" style="background-image: url(<?= $image; ?>);"></div></a>
        </div>
        <div class="columns meta-column">
          <span>Written by <a href="<?= $permalink; ?>"><?= $name; ?> </a></span><br>
          on <span class="post-date"><?php the_time('F j, Y'); ?></span><br>
        </div>
        <div class="small-12 columns meta-column">
          <?php get_template_part( 'template-parts/sidebar-share' ); ?>
        </div>
      <?php
        endforeach;
      } ?>
  <?php endif; ?>

  <?php if(is_singular('podcast')) : ?>
    <div class="columns meta-column">
      <span class="post-date"><?php the_time('F j, Y'); ?></span>

      <?php get_template_part( 'template-parts/sidebar-share' ); ?>
    </div>
  <?php endif; ?>

  <?php if(is_singular('work')) : ?>
    <div class="columns meta-column">
      <span class="post-date"><?php the_field('completion_date'); ?></span>

      <?php get_template_part( 'template-parts/sidebar-share' ); ?>
    </div>
  <?php endif; ?>
</div>
