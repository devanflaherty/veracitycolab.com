<!-- SHARE SECTION -->
<?php
  // Set twitter compose text
  if(is_singular('post')) {
    $twitter = "This is a great read! " . get_the_title() . " by " . get_the_author() . " from @VeracityColab.";
  } elseif(is_singular('work')) {
    $client = getClient();
    $twitter = "Check out the " . get_the_title() . " project for " . $client . " by @VeracityColab.";
  } elseif(is_singular('podcast')) {
    $twitter = "Watch Episode " . get_field('episode') . " on Play It Forward by @VeracityColab to get great video insights for your business.";
  }
?>
<div class="sidebar-social">
  <nav>
    <a target="_blank" href="http://twitter.com/share?url=<?php echo get_permalink(); ?>
&amp;text=<?= urlencode($twitter); ?>">
      <i class="fa fa-twitter" aria-hidden="true"></i> Share on Twitter
    </a>
    <a target="_blank" href="http://www.facebook.com/sharer/sharer.php?u=<?php echo get_permalink(); ?>">
      <i class="fa fa-facebook-official" aria-hidden="true"></i> Share on Facebook
    </a>

    <?php if(is_singular('work')) : ?>
      <?php if(get_field('youtube') && get_field('youtube') !== "") : ?>
        <a target="_blank" href="<?php the_field( 'youtube' ); ?>">
          <i class="fa fa-youtube-play"></i> Like on Youtube
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
