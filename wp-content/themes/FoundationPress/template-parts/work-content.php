<?php
  // Setting up some variabels to make life a little easier
  $setColor =  get_field('primary_color');
  $color = $setColor;
  $primary = foundationpress_hex2rgba($color, 0.8);
  $secondary = substr(get_field( 'secondary_color'), 1);
  $video =  get_field('video_id');

  // Have to do a lil loop to get the a-singular client
  $client = getClient();
  $title = get_the_title();
  if (strpos($title, '|') !== false) {
    $title = strstr($title, '|');
    $title = substr($title, 1);
  }
?>
<div class="post-block" style="background-color: <?= $primary; ?>">
  <a class="permalink" href="<?php the_permalink(); ?>">
    <div class="hover-indicator" style="background: <?php the_field( 'primary_color' ) ?>"></div>
    <div class="post-meta">
      <h5>
        <?php if (get_field('episode')) : ?>
          <span>Episode <?php echo get_field('episode'); ?></span>
        <?php else : ?>
          <span><?= $client ?></span>
        <?php endif; ?>
      </h5>
      <h3><?php echo $title; ?></h3>
    </div>
  </a>
<?php if ( has_post_thumbnail() )  : ?>
  <a class="play"
    style="background-image: url(<?php the_post_thumbnail_url( 'large' ); ?>)"
    href="#wistia_<?= $video; ?>?videoFoam=true&amp;playerColor=<?= $secondary; ?>&amp;videoQuality=hd-only"
    data-permalink="<?php the_permalink(); ?>">
<?php else : ?>
  <a class="play"
    href="#wistia_<?= $video; ?>?videoFoam=true&amp;playerColor=<?= $secondary; ?>&amp;videoQuality=hd-only"
    data-permalink="<?php the_permalink(); ?>">
<?php endif; ?>
    <div class="permalink-overlay"></div>
    <div class="thumbnail-overlay" style="background-color: <?= $primary; ?>">
      <span><i class="fa fa-play iplay" aria-hidden="true"></i></span>
    </div>
  </a>
</div>
