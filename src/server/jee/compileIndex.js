var http = require( 'http' );

var fs = require( 'fs' );

eval( fs.readFileSync( '../common/String.js' ) + '' );

var TARGET_PATH = '/javaee/6/api/allclasses-frame.html';

var TARGET_HOST = 'docs.oracle.com';


if ( fs.existsSync('./result.tmp' ) ) {

    fs.writeFile( './result.tmp', '', function( error ) {
    } );
} else {

    fs.open( './result.tmp', 'w' );
}

if ( fs.existsSync( 'index.js') ) {

    fs.writeFile('index.js', '', function( error ) {
    } );
}

var downloaded = false;

var scrapeData = function() {

    java6_ee_api_ = [];
    var text = fs.readFileSync( './result.tmp', 'utf8' );
   
   
 	var italic_begin = new RegExp( "<I>", "g" );
    var italic_end = new RegExp( "</I>", "g" );
    var slashes = new RegExp( "/", "g" );
    var dothtml = new RegExp( ".html", "g" );
    var matches = text.match( new RegExp( "<A HREF=\".*\" title=\".*\" target=\"classFrame\">.*</A>", "g" ) );
                
    for( var i = 0; i < matches.length; ++i ) {
        
		var match = matches[ i ];
        var hrefstartidx = match.indexOf( "HREF=\"" ) + 6;
        var hrefendidx = match.indexOf( "\"", hrefstartidx );
        var href = match.substring( hrefstartidx, hrefendidx );
        var titlestartidx = match.indexOf( "title=\"" ) + 7;
        var titleendidx = match.indexOf( "\"", titlestartidx );
        var title = match.substring( titlestartidx, titleendidx );
        var contentstartidx = match.indexOf( ">", titleendidx ) + 1;
        var contentendidx = match.indexOf( "</A>", contentstartidx );
        var content = match.substring( contentstartidx, contentendidx ).replace( italic_begin, "" ).replace( italic_end, "" );
        var type = title.substring( 0, title.indexOf(" in ") ).strip();
        type = type.charAt( 0 ).toUpperCase() + type.substr( 1 );
        var fqn = href.replace( slashes, "." ).replace( dothtml, "" );
        java6_ee_api_.push(
        	{ "name" : content, 
        	  "fqn" : fqn, 
        	  "url" : href, 
        	  "type" : type }
        );
    }
    
    console.log( "oops i did it again!" );
    fs.appendFileSync( 'index.js', "var index = " + JSON.stringify( java6_ee_api_, null, '\t' ) );

}
var options = {
    host : TARGET_HOST,
    port : 80,
    path : TARGET_PATH
};

var req = http.get( options, function( res ) {

    // console.log( 'STATUS: ' + res.statusCode );
    // console.log( 'HEADERS: ' + JSON.stringify( res.headers ) );
    res.setEncoding( 'utf8' );

    res.on( 'data', function( chunk ) {

        fs.appendFile( './result.tmp', chunk, function( error ) {

            if ( error ) {

                console.log( error );
            } else {

                if ( downloaded ){

                    scrapeData();

                   // fs.unlinkSync('./result.tmp');
                }
            }
        } );
    } );

    res.on( 'end', function() {

        downloaded = true;
    } );
} );

req.on( 'error', function( e ) {

    console.log( 'problem with request: ' + e.message );
} );