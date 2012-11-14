function selectionChanged() {
    
    var selectedOption = this.options[ this.selectedIndex ];
    var value = selectedOption.value;
    
    localStorage[ 'previousLocale' ] = localStorage[ 'locale' ];
    localStorage[ 'locale' ] = value;
};


var locales = [
	{ "locale": "cs_CZ", "language" : "Czech" },
	{ "locale": "de_DE", "language" : "German" },
	{ "locale": "en_US", "language" : "English" },
	{ "locale": "es_ES", "language" : "Spanish" },
	{ "locale": "fr_FR", "language" : "French" },
	{ "locale": "it_IT", "language" : "Italian" },
	{ "locale": "ja_JP", "language" : "Japanese" },
	{ "locale": "ko_KR", "language" : "Korean" },
	{ "locale": "nl_NL", "language" : "Dutch" },
	{ "locale": "pl_PL", "language" : "Polish" },
	{ "locale": "pt_BR", "language" : "Portugese" },
	{ "locale": "ru_RU", "language" : "Russian" },
	{ "locale": "sv_SE", "language" : "Swedish" },
	{ "locale": "tr_TR", "language" : "Turkish" },
	{ "locale": "zh_CN", "language" : "Chinese (China)" },
	{ "locale": "zh_TW", "language" : "Chinese (Taiwan)" }
];

function sortByLanguage( a, b ){

	if( a.language > b.language ){
		
		return 1;
	}
	return -1;	
}

locales.sort( sortByLanguage );

var dropDown = document.getElementById( "languageDropdown" );
var locale;
for ( var i = 0; i < locales.length; i++ ) {
  
  	locale = locales[ i ];
  	var option = document.createElement( "option" );
  	option.value = locale.locale;
  	option.text = locale.language;
  	
  	if( option.value === localStorage[ 'locale' ] ){
  	
  		option.selected = true;	
  	}
  
  	dropDown.add( option );
};

dropDown.onchange = selectionChanged;