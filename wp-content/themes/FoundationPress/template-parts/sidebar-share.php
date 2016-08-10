<!-- SHARE SECTION -->
<div class="sidebar-social">
  <nav>
    <a target="_blank" href="http://twitter.com/share?url=<?php echo get_permalink(); ?>
&amp;text=<?php the_title(); ?> : Awesome post by the @veracityColab team.">
      <i class="fa fa-twitter" aria-hidden="true"></i> Share on Twitter
    </a>
    <a target="_blank" href="http://www.facebook.com/sharer.php?u=http:<?php echo get_permalink(); ?>">
      <i class="fa fa-facebook-official" aria-hidden="true"></i> Share on Facebook
    </a>

    <?php if(is_singular('work')) : ?>
      <?php if(get_field('youtube') && get_field('youtube') !== "") : ?>
        <a target="_blank" href="<?php the_field( 'youtube' ); ?>">
          <i class="fa fa-youtube"></i> Like on Youtube
        </a>
      <?php endif;?>
      <?php if(get_field('vimeo') && get_field('vimeo') !== "") : ?>
        <a target="_blank" href="<?php the_field( 'vimeo' ); ?>">
          <i class="fa fa-vimeo"></i> Like on Vimeo
        </a>
      <?php endif;?>
    <?php endif; ?>
    
    <?php if(is_singular('podcast')) : ?>
      <a target="_blank" href="<?php the_field( 'podcast_subscribe', 'options' ); ?>">
        <i class="fa fa-music"></i> Listen on iTunes
      </a>
    <?php endif; ?>
  </nav>
</div>
