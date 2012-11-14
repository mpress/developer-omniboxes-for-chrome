	
var currentTab;

function onRequest( request, sender, sendResponse ) {
 
	currentTab = sender.tab.id;
	
	if( localStorage[ 'locale' ] != "en_US" ) {
	
		setIcon();
	}
	
	chrome.pageAction.show( currentTab );

	sendResponse( {} );
};

chrome.extension.onRequest.addListener( onRequest );


function setIcon(){

	var details = {};
	details.path = 'action/flags/19/' + localStorage[ 'locale' ] + '.jpg';
	details.tabId = currentTab;
	
	chrome.pageAction.setIcon( details );	
}

if( window.addEventListener ) {

	window.addEventListener( "storage", setIcon, false );
}
