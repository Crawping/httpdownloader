function GetMedia()
{
	var urls_string = "";
	var urls = document.body.getElementsByTagName( "source" );
	var num_urls = urls.length;

	for ( var i = 0; i < num_urls; ++i )
	{
		if ( urls[ i ].href != "" )
		{
			urls_string += urls[ i ].href + "\r\n";
		}
	}

	return urls_string;
}

GetMedia();
