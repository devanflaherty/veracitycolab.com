<?php
	if ( is_post_type_archive('work') ) {
		$primaryColor = get_field( 'work_primary_color', 'option' );
		$secondaryColor = get_field( 'work_secondary_color', 'option' );
	} elseif ( is_post_type_archive('team') ) {
		$primaryColor = get_field( 'team_primary_color', 'option' );
		$secondaryColor = get_field( 'team_secondary_color', 'option' );
	} else {
		$primaryColor = substr(get_field( 'primary_color' ), 1);
		$secondaryColor = substr(get_field( 'secondary_color' ), 1);
	}
?>
