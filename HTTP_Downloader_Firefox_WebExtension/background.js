var g_open_windows = [];

function OnGetOptions( options )
{
	if ( !options.server )
	{
		options.server = "http://localhost:80/";
	}

	if ( !options.username )
	{
		options.username = "";
	}

	if ( !options.password )
	{
		options.password = "";
	}

	if ( !options.parts )
	{
		options.parts = "1";
	}

	return options;
}

function OnGetCookieString( cookies )
{
	var cookie_string = "";
	var cookies_length = cookies.length;

	if ( cookies_length > 0 )
	{
		cookie_string = cookies[ 0 ].name + ": " + cookies[ 0 ].value;

		for ( var i = 1; i < cookies_length; ++i )
		{
			cookie_string += "; " + cookies[ i ].name + ": " + cookies[ i ].value;
		}
	}

	return cookie_string;
}

browser.contextMenus.create(
{
	id: "download-link",
	title: "Download Link...",
	contexts: [ "link" ]
} );

browser.contextMenus.create(
{
	id: "download-image",
	title: "Download Image...",
	contexts: [ "image" ]
} );

browser.contextMenus.create(
{
	id: "download-audio",
	title: "Download Audio...",
	contexts: [ "audio" ]
} );

browser.contextMenus.create(
{
	id: "download-video",
	title: "Download Video...",
	contexts: [ "video" ]
} );

browser.contextMenus.create(
{
	id: "separator-1",
	type: "separator",
	contexts: [ "link", "image", "audio", "video" ]
} );

browser.contextMenus.create(
{
	id: "download-all-images",
	title: "Download All Images...",
	contexts: [ "page", "frame", "link", "image", "audio", "video" ]
} );

browser.contextMenus.create(
{
	id: "download-all-media",
	title: "Download All Media...",
	contexts: [ "page", "frame", "link", "image", "audio", "video" ]
} );

browser.contextMenus.create(
{
	id: "download-all-links",
	title: "Download All Links...",
	contexts: [ "page", "frame", "link", "image", "audio", "video" ]
} );

browser.contextMenus.create(
{
	id: "separator-2",
	type: "separator",
	contexts: [ "page", "frame", "link", "image", "audio", "video" ]
} );

browser.contextMenus.create(
{
	id: "download-page",
	title: "Download Page...",
	contexts: [ "page", "frame", "link", "image", "audio", "video" ]
} );

function HandleMessages( request, sender, sendResponse )
{
	if ( request.type == "loading" )
	{
		for ( i = 0; i < g_open_windows.length; ++i )
		{
			if ( g_open_windows[ i ][ 0 ] == request.window_id )
			{
				var window = g_open_windows[ i ];
				g_open_windows.splice( i, 1 );

				sendResponse(
				{
					server: window[ 1 ],
					username: window[ 2 ],
					password: window[ 3 ],
					parts: window[ 4 ],
					urls: window[ 5 ],
					cookies: window[ 6 ]
				} );

				break;
			}
		}
	}
	else if ( request.type == "server_info" )
	{
		browser.storage.local.get().then( OnGetOptions )
		.then( function( options )
		{
			sendResponse(
			{
				server: options.server,
				username: options.username,
				password: options.password
			} );
		} );
	}

	return true;
}

browser.contextMenus.onClicked.addListener( ( info, tab ) =>
{
	if ( info.menuItemId == "download-all-images" ||
		 info.menuItemId == "download-all-media" ||
		 info.menuItemId == "download-all-links" )
	{
		var script_file = "";

		if ( info.menuItemId == "download-all-images" )
		{
			script_file = "get_images.js"
		}
		else if ( info.menuItemId == "download-all-media" )
		{
			script_file = "get_media.js"
		}
		else
		{
			script_file = "get_links.js"
		}

		browser.tabs.executeScript( { file: script_file } )
		.then( function( urls )
		{
			browser.storage.local.get().then( OnGetOptions )
			.then( function( options )
			{
				browser.windows.create(
				{
					url: browser.extension.getURL( "download.html" ),
					type: "popup",
					left: ( ( screen.width - 200 ) / 2 ),
					top: ( ( screen.height - 200 ) / 2 ),
					width: 600,
					height: 295
				} )
				.then( function( window_info )
				{
					if ( window_info )
					{
						g_open_windows.push(
						[
							window_info.id,
							options.server,
							options.username,
							options.password,
							options.parts,
							urls
						] );
					}
				} );
			} );
		} );
	}
	else
	{
		var url = "";

		if ( info.menuItemId == "download-link" )
		{
			url = info.linkUrl;
		}
		else if ( info.menuItemId == "download-image" ||
				  info.menuItemId == "download-audio" ||
				  info.menuItemId == "download-video" )
		{
			url = info.srcUrl;
		}
		else
		{
			url = info.pageUrl;
		}

		var parsed_url = document.createElement( "a" );
		parsed_url.href = url;
		var domain = parsed_url.hostname;
		var domain_parts = domain.split( "." );
		if ( domain_parts.length > 2 )
		{
			domain = domain_parts[ domain_parts.length - 2 ] + "." + domain_parts[ domain_parts.length - 1 ];
		}

		browser.storage.local.get().then( OnGetOptions )
		.then( function( options )
		{
			browser.cookies.getAll( { domain: "." + domain } ).then( OnGetCookieString )
			.then( function( cookie_string )
			{
				browser.windows.create(
				{
					url: browser.extension.getURL( "download.html" ),
					type: "popup",
					left: ( ( screen.width - 200 ) / 2 ),
					top: ( ( screen.height - 200 ) / 2 ),
					width: 640,
					height: 295
				} )
				.then( function( window_info )
				{
					if ( window_info )
					{
						g_open_windows.push(
						[
							window_info.id,
							options.server,
							options.username,
							options.password,
							options.parts,
							url,
							cookie_string
						] );
					}
				} );
			} );
		} );
	}
} );

browser.runtime.onMessage.addListener( HandleMessages );
