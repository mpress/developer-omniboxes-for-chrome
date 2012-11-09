var http = require('http');

var fs = require('fs');

eval( fs.readFileSync( '../common/String.js' ) + '' );


var TARGET_PATH = '/en_US/FlashPlatform/reference/actionscript/3/class-summary.html';

var TARGET_HOST = 'help.adobe.com';



if (fs.existsSync('./result.tmp') ) {

    fs.writeFile('./result.tmp', '', function(error) {
    });
} else {

    fs.open('./result.tmp', 'w');
}

if (fs.existsSync('index.js')) {

    fs.writeFile('index.js', '', function(error) {
    });
}

var downloaded = false;

var scrapeData = function() {

    as3_ = [];
    var text = fs.readFileSync('./result.tmp', 'utf8');
    var slashes = new RegExp("/", "g");
    var dothtml = new RegExp(".html", "");
    var begin_italics = new RegExp("<I>", "g");
    var end_italics = new RegExp("</I>", "g");
    var begin_italics_lower = new RegExp("<i>", "g");
    var end_italics_lower = new RegExp("</i>", "g");
    var dotslash = new RegExp("^\.\/", "");
    var matches = text.match(new RegExp("<td class=\"summaryTableSecondCol\"><a(\\s+target=\"[^\"]*\")?(\\s+href=\"[^\"]*\")>(<i>)?[^<]*(</i>)?</a>(&nbsp;)?(<span(\\s+[^>]*)?>[^<]*</span>)?<br></td><td class=\"summaryTableCol\"><a(\\s+target=\"[^\"]*\")?(\\s+href=\"[^\"]*\")(\\s+onclick=\"[^\"]*\")?>(<i>)?[^<]*(</i>)?</a></td>", "g"));

    for (var i = 0; i < matches.length; i++) {

        var match = matches[i];
        var hrefidx = match.indexOf("href=\"");

        if (hrefidx == -1) {

            continue;
        }

        hrefidx += 6;
        var endhrefidx = match.indexOf("\">", hrefidx);
        var href = match.substring(hrefidx, endhrefidx).replace(dotslash, "").strip();
        var starta = match.indexOf(">", endhrefidx) + 1;
        var stopa = match.indexOf("</a>", starta);
        var classname = match.substring(starta, stopa).replace(begin_italics, "").replace(end_italics, "").replace(begin_italics_lower, "").replace(end_italics_lower, "").strip();
        var fqn = href.replace(dothtml, "").replace(slashes, ".").strip();
        as3_.push({
            "name" : classname,
            "fqn" : fqn,
            "url" : href
        });
    }

    fs.appendFileSync('index.js', "var index = " + JSON.stringify( as3_, null, '\t' ) );
}
var options = {
    host : TARGET_HOST,
    port : 80,
    path : TARGET_PATH
};

var req = http.get(options, function(res) {

    //console.log( 'STATUS: ' + res.statusCode );
    //console.log( 'HEADERS: ' + JSON.stringify( res.headers ) );
    res.setEncoding('utf8');

    res.on('data', function(chunk) {

        fs.appendFile('./result.tmp', chunk, function(error) {

            if (error) {

                console.log(error);
            } else {

                if (downloaded) {

                    scrapeData();

                   // fs.unlinkSync('./result.tmp');
                }
            }
        });
    });

    res.on('end', function() {

        downloaded = true;
    });
});

req.on('error', function(e) {

    console.log('problem with request: ' + e.message);
});
