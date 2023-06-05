var http = require('https');

var fs = require('fs');

eval( fs.readFileSync( '../common/String.js' ) + '' );

var TARGET_PATH = '/en/java/javase/20/docs/api/allclasses-index.html';

var TARGET_HOST = 'docs.oracle.com';

if (fs.existsSync('./result.tmp') ) {

    fs.writeFile('./result.tmp', '', function(error) {
    });
} else {

    fs.open( './result.tmp', 'w', function( openError, fd ) {
        if ( openError ) {
            if ( callback ) callback( openError );
        } else {
          //  writeFd(fd, false);
        }
    });
}

if ( fs.existsSync( 'index.js' ) ) {

    fs.writeFile( 'index.js', '', function( error ) {
    } );
}

var downloaded = false;

var scrapeData = function() {

    java20_api_ = [];
    var text = fs.readFileSync( './result.tmp', 'utf8' );
    var italic_begin = new RegExp( "<I>", "g" );
    var italic_end = new RegExp( "</I>", "g" );
    var slashes = new RegExp("/", "g");
    var dothtml = new RegExp(".html", "g");
   // var matches = text.match(new RegExp("<a href=\".*\" title=\".*\" target=\"classFrame\">.*</a>", "g"));
    var matches = text.match(new RegExp("<a href=\".*\" title=\".*\">.*</a>", "g"));

    for (var i = 0; i < matches.length; i++) {

        var match = matches[ i ];
        var hrefstartidx = match.indexOf("href=\"") + 6;
        var hrefendidx = match.indexOf("\"", hrefstartidx);
        var href = match.substring(hrefstartidx, hrefendidx);
        var titlestartidx = match.indexOf("title=\"") + 7;
        var titleendidx = match.indexOf("\"", titlestartidx);
        var title = match.substring(titlestartidx, titleendidx);
        var contentstartidx = match.indexOf(">", titleendidx) + 1;
        var contentendidx = match.indexOf("</a>", contentstartidx);
        var content = match.substring(contentstartidx, contentendidx).replace(italic_begin, "").replace(italic_end, "");
        var type = title.substring(0, title.indexOf(" in ")).strip();
        type = type.charAt(0).toUpperCase() + type.substr(1);
        var fqn = href.replace(slashes, ".").replace(dothtml, "");
        
        java20_api_.push( {
            "name":content, 
            "fqn":fqn, 
            "url":href, 
            "type":type
        });
    }

   	fs.appendFileSync('index.js', "var index = " + JSON.stringify( java20_api_, null, '\t' ) );
}
var options = {
    host : TARGET_HOST,
    port : 443,
    path : TARGET_PATH
};

var req = http.get( options, function( res ) {

    const { statusCode } = res;
    res.setEncoding( 'utf8' );

    if( statusCode !== 200 ) { console.log( 'statusCode: ' + statusCode ) }

    res.on('data', function( chunk ) {

        fs.appendFile('./result.tmp', chunk, function( error ) {


            if (error) {

            console.log( error );
        } else {

            if (downloaded) {

                scrapeData();

                fs.unlinkSync('./result.tmp');
            }
        }
    });
    });
    res.on( 'end', function() {
        downloaded = true;
    });
});

req.on('error', function(e) {

    console.log('problem with request: ' + e.message);
});
