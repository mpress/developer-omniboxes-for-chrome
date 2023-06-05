all: man.zip java.zip gwt.zip guava.zip gae.zip py.zip py3.zip spring.zip pygdata.zip stl.zip droid.zip js.zip closure.zip jq.zip php.zip as3.zip rb.zip rails.zip mysql.zip boost.zip jee.zip groovy.zip qt.zip matlab.zip

.build/man:
	@ mkdir -p ./.build/man
	@ rm -f build
	@ ln -s .build build
	@ cp ./man/manifest.json ./.build/man/manifest.json
	@ cp ./man/background.html ./.build/man/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./man/background.js --externs externs.js --js_output_file ./.build/man/background.js
	@ pngcrush -d ./.build/man -rem alla -reduce -brute icon.png man/icon.png >/dev/null
	@ pngcrush -d ./.build/man -rem alla -reduce -brute icon128.png man/icon128.png >/dev/null
	@ pngcrush -d ./.build/man -rem alla -reduce -brute icon32.png man/icon32.png >/dev/null
	@ pngcrush -d ./.build/man -rem alla -reduce -brute icon16.png man/icon16.png >/dev/null

man.zip: .build/man
	@ (cd ./.build; zip -r9 man.zip man) >/dev/null
	@ cp ./.build/man.zip ./man.zip
	@ rm -f build
	@ ln -s .build build

.build/java:
	@ mkdir -p ./.build/java
	@ rm -f build
	@ ln -s .build build
	@ cp ./java/manifest.json ./.build/java/manifest.json
	@ cp ./java/background.html ./.build/java/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./java/background.js --externs externs.js --js_output_file ./.build/java/background.js
	@ pngcrush -d ./.build/java -rem alla -reduce -brute icon.png java/icon.png >/dev/null
	@ pngcrush -d ./.build/java -rem alla -reduce -brute icon128.png java/icon128.png >/dev/null
	@ pngcrush -d ./.build/java -rem alla -reduce -brute icon32.png java/icon32.png >/dev/null
	@ pngcrush -d ./.build/java -rem alla -reduce -brute icon16.png java/icon16.png >/dev/null

java.zip: .build/java
	@ (cd ./.build; zip -r9 java.zip java) >/dev/null
	@ cp ./.build/java.zip ./java.zip
	@ rm -f build
	@ ln -s .build build

.build/gwt:
	@ mkdir -p ./.build/gwt
	@ rm -f build
	@ ln -s .build build
	@ cp ./gwt/manifest.json ./.build/gwt/manifest.json
	@ cp ./gwt/background.html ./.build/gwt/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./gwt/background.js --externs externs.js --js_output_file ./.build/gwt/background.js
	@ pngcrush -d ./.build/gwt -rem alla -reduce -brute icon.png gwt/icon.png >/dev/null
	@ pngcrush -d ./.build/gwt -rem alla -reduce -brute icon128.png gwt/icon128.png >/dev/null
	@ pngcrush -d ./.build/gwt -rem alla -reduce -brute icon32.png gwt/icon32.png >/dev/null
	@ pngcrush -d ./.build/gwt -rem alla -reduce -brute icon16.png gwt/icon16.png >/dev/null

gwt.zip: .build/gwt
	@ (cd ./.build; zip -r9 gwt.zip gwt) >/dev/null
	@ cp ./.build/gwt.zip ./gwt.zip
	@ rm -f build
	@ ln -s .build build

.build/guava:
	@ mkdir -p ./.build/guava
	@ rm -f build
	@ ln -s .build build
	@ cp ./guava/manifest.json ./.build/guava/manifest.json
	@ cp ./guava/background.html ./.build/guava/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./guava/background.js --externs externs.js --js_output_file ./.build/guava/background.js
	@ pngcrush -d ./.build/guava -rem alla -reduce -brute icon.png guava/icon.png >/dev/null
	@ pngcrush -d ./.build/guava -rem alla -reduce -brute icon128.png guava/icon128.png >/dev/null
	@ pngcrush -d ./.build/guava -rem alla -reduce -brute icon32.png guava/icon32.png >/dev/null
	@ pngcrush -d ./.build/guava -rem alla -reduce -brute icon16.png guava/icon16.png >/dev/null

guava.zip: .build/guava
	@ (cd ./.build; zip -r9 guava.zip guava) >/dev/null
	@ cp ./.build/guava.zip ./guava.zip
	@ rm -f build
	@ ln -s .build build

.build/gae:
	@ mkdir -p ./.build/gae
	@ rm -f build
	@ ln -s .build build
	@ cp ./gae/manifest.json ./.build/gae/manifest.json
	@ cp ./gae/background.html ./.build/gae/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./gae/background.js --externs externs.js --js_output_file ./.build/gae/background.js
	@ pngcrush -d ./.build/gae -rem alla -reduce -brute icon.png gae/icon.png >/dev/null
	@ pngcrush -d ./.build/gae -rem alla -reduce -brute icon128.png gae/icon128.png >/dev/null
	@ pngcrush -d ./.build/gae -rem alla -reduce -brute icon32.png gae/icon32.png >/dev/null
	@ pngcrush -d ./.build/gae -rem alla -reduce -brute icon16.png gae/icon16.png >/dev/null

gae.zip: .build/gae
	@ (cd ./.build; zip -r9 gae.zip gae) >/dev/null
	@ cp ./.build/gae.zip ./gae.zip
	@ rm -f build
	@ ln -s .build build

.build/py:
	@ mkdir -p ./.build/py
	@ rm -f build
	@ ln -s .build build
	@ cp ./py/manifest.json ./.build/py/manifest.json
	@ cp ./py/background.html ./.build/py/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./py/background.js --externs externs.js --js_output_file ./.build/py/background.js
	@ pngcrush -d ./.build/py -rem alla -reduce -brute icon.png py/icon.png >/dev/null
	@ pngcrush -d ./.build/py -rem alla -reduce -brute icon128.png py/icon128.png >/dev/null
	@ pngcrush -d ./.build/py -rem alla -reduce -brute icon32.png py/icon32.png >/dev/null
	@ pngcrush -d ./.build/py -rem alla -reduce -brute icon16.png py/icon16.png >/dev/null

py.zip: .build/py
	@ (cd ./.build; zip -r9 py.zip py) >/dev/null
	@ cp ./.build/py.zip ./py.zip
	@ rm -f build
	@ ln -s .build build

.build/py3:
	@ mkdir -p ./.build/py3
	@ rm -f build
	@ ln -s .build build
	@ cp ./py3/manifest.json ./.build/py3/manifest.json
	@ cp ./py3/background.html ./.build/py3/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./py3/background.js --externs externs.js --js_output_file ./.build/py3/background.js
	@ pngcrush -d ./.build/py3 -rem alla -reduce -brute icon.png py3/icon.png >/dev/null
	@ pngcrush -d ./.build/py3 -rem alla -reduce -brute icon128.png py3/icon128.png >/dev/null
	@ pngcrush -d ./.build/py3 -rem alla -reduce -brute icon32.png py3/icon32.png >/dev/null
	@ pngcrush -d ./.build/py3 -rem alla -reduce -brute icon16.png py3/icon16.png >/dev/null

py3.zip: .build/py3
	@ (cd ./.build; zip -r9 py3.zip py3) >/dev/null
	@ cp ./.build/py3.zip ./py3.zip
	@ rm -f build
	@ ln -s .build build

.build/spring:
	@ mkdir -p ./.build/spring
	@ rm -f build
	@ ln -s .build build
	@ cp ./spring/manifest.json ./.build/spring/manifest.json
	@ cp ./spring/background.html ./.build/spring/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./spring/background.js --externs externs.js --js_output_file ./.build/spring/background.js
	@ pngcrush -d ./.build/spring -rem alla -reduce -brute icon.png spring/icon.png >/dev/null
	@ pngcrush -d ./.build/spring -rem alla -reduce -brute icon128.png spring/icon128.png >/dev/null
	@ pngcrush -d ./.build/spring -rem alla -reduce -brute icon32.png spring/icon32.png >/dev/null
	@ pngcrush -d ./.build/spring -rem alla -reduce -brute icon16.png spring/icon16.png >/dev/null

spring.zip: .build/spring
	@ (cd ./.build; zip -r9 spring.zip spring) >/dev/null
	@ cp ./.build/spring.zip ./spring.zip
	@ rm -f build
	@ ln -s .build build

.build/pygdata:
	@ mkdir -p ./.build/pygdata
	@ rm -f build
	@ ln -s .build build
	@ cp ./pygdata/manifest.json ./.build/pygdata/manifest.json
	@ cp ./pygdata/background.html ./.build/pygdata/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./pygdata/background.js --externs externs.js --js_output_file ./.build/pygdata/background.js
	@ pngcrush -d ./.build/pygdata -rem alla -reduce -brute icon.png pygdata/icon.png >/dev/null
	@ pngcrush -d ./.build/pygdata -rem alla -reduce -brute icon128.png pygdata/icon128.png >/dev/null
	@ pngcrush -d ./.build/pygdata -rem alla -reduce -brute icon32.png pygdata/icon32.png >/dev/null
	@ pngcrush -d ./.build/pygdata -rem alla -reduce -brute icon16.png pygdata/icon16.png >/dev/null

pygdata.zip: .build/pygdata
	@ (cd ./.build; zip -r9 pygdata.zip pygdata) >/dev/null
	@ cp ./.build/pygdata.zip ./pygdata.zip
	@ rm -f build
	@ ln -s .build build

.build/stl:
	@ mkdir -p ./.build/stl
	@ rm -f build
	@ ln -s .build build
	@ cp ./stl/manifest.json ./.build/stl/manifest.json
	@ cp ./stl/background.html ./.build/stl/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./stl/background.js --externs externs.js --js_output_file ./.build/stl/background.js
	@ pngcrush -d ./.build/stl -rem alla -reduce -brute icon.png stl/icon.png >/dev/null
	@ pngcrush -d ./.build/stl -rem alla -reduce -brute icon128.png stl/icon128.png >/dev/null
	@ pngcrush -d ./.build/stl -rem alla -reduce -brute icon32.png stl/icon32.png >/dev/null
	@ pngcrush -d ./.build/stl -rem alla -reduce -brute icon16.png stl/icon16.png >/dev/null

stl.zip: .build/stl
	@ (cd ./.build; zip -r9 stl.zip stl) >/dev/null
	@ cp ./.build/stl.zip ./stl.zip
	@ rm -f build
	@ ln -s .build build

.build/droid:
	@ mkdir -p ./.build/droid
	@ rm -f build
	@ ln -s .build build
	@ cp ./droid/manifest.json ./.build/droid/manifest.json
	@ cp ./droid/background.html ./.build/droid/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./droid/background.js --externs externs.js --js_output_file ./.build/droid/background.js
	@ pngcrush -d ./.build/droid -rem alla -reduce -brute icon.png droid/icon.png >/dev/null
	@ pngcrush -d ./.build/droid -rem alla -reduce -brute icon128.png droid/icon128.png >/dev/null
	@ pngcrush -d ./.build/droid -rem alla -reduce -brute icon32.png droid/icon32.png >/dev/null
	@ pngcrush -d ./.build/droid -rem alla -reduce -brute icon16.png droid/icon16.png >/dev/null

droid.zip: .build/droid
	@ (cd ./.build; zip -r9 droid.zip droid) >/dev/null
	@ cp ./.build/droid.zip ./droid.zip
	@ rm -f build
	@ ln -s .build build

.build/js:
	@ mkdir -p ./.build/js
	@ rm -f build
	@ ln -s .build build
	@ cp ./js/manifest.json ./.build/js/manifest.json
	@ cp ./js/background.html ./.build/js/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./js/background.js --externs externs.js --js_output_file ./.build/js/background.js
	@ pngcrush -d ./.build/js -rem alla -reduce -brute icon.png js/icon.png >/dev/null
	@ pngcrush -d ./.build/js -rem alla -reduce -brute icon128.png js/icon128.png >/dev/null
	@ pngcrush -d ./.build/js -rem alla -reduce -brute icon32.png js/icon32.png >/dev/null
	@ pngcrush -d ./.build/js -rem alla -reduce -brute icon16.png js/icon16.png >/dev/null

js.zip: .build/js
	@ (cd ./.build; zip -r9 js.zip js) >/dev/null
	@ cp ./.build/js.zip ./js.zip
	@ rm -f build
	@ ln -s .build build

.build/closure:
	@ mkdir -p ./.build/closure
	@ rm -f build
	@ ln -s .build build
	@ cp ./closure/manifest.json ./.build/closure/manifest.json
	@ cp ./closure/background.html ./.build/closure/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./closure/background.js --externs externs.js --js_output_file ./.build/closure/background.js
	@ pngcrush -d ./.build/closure -rem alla -reduce -brute icon.png closure/icon.png >/dev/null
	@ pngcrush -d ./.build/closure -rem alla -reduce -brute icon128.png closure/icon128.png >/dev/null
	@ pngcrush -d ./.build/closure -rem alla -reduce -brute icon32.png closure/icon32.png >/dev/null
	@ pngcrush -d ./.build/closure -rem alla -reduce -brute icon16.png closure/icon16.png >/dev/null

closure.zip: .build/closure
	@ (cd ./.build; zip -r9 closure.zip closure) >/dev/null
	@ cp ./.build/closure.zip ./closure.zip
	@ rm -f build
	@ ln -s .build build

.build/jq:
	@ mkdir -p ./.build/jq
	@ rm -f build
	@ ln -s .build build
	@ cp ./jq/manifest.json ./.build/jq/manifest.json
	@ cp ./jq/background.html ./.build/jq/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./jq/background.js --externs externs.js --js_output_file ./.build/jq/background.js
	@ pngcrush -d ./.build/jq -rem alla -reduce -brute icon.png jq/icon.png >/dev/null
	@ pngcrush -d ./.build/jq -rem alla -reduce -brute icon128.png jq/icon128.png >/dev/null
	@ pngcrush -d ./.build/jq -rem alla -reduce -brute icon32.png jq/icon32.png >/dev/null
	@ pngcrush -d ./.build/jq -rem alla -reduce -brute icon16.png jq/icon16.png >/dev/null

jq.zip: .build/jq
	@ (cd ./.build; zip -r9 jq.zip jq) >/dev/null
	@ cp ./.build/jq.zip ./jq.zip
	@ rm -f build
	@ ln -s .build build

.build/php:
	@ mkdir -p ./.build/php
	@ rm -f build
	@ ln -s .build build
	@ cp ./php/manifest.json ./.build/php/manifest.json
	@ cp ./php/background.html ./.build/php/background.html
	@ cp ./php/options.html ./.build/php/options.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./php/background.js --externs externs.js --js_output_file ./.build/php/background.js
	@ pngcrush -d ./.build/php -rem alla -reduce -brute icon.png php/icon.png >/dev/null
	@ pngcrush -d ./.build/php -rem alla -reduce -brute icon128.png php/icon128.png >/dev/null
	@ pngcrush -d ./.build/php -rem alla -reduce -brute icon32.png php/icon32.png >/dev/null
	@ pngcrush -d ./.build/php -rem alla -reduce -brute icon16.png php/icon16.png >/dev/null

php.zip: .build/php
	@ (cd ./.build; zip -r9 php.zip php) >/dev/null
	@ cp ./.build/php.zip ./php.zip
	@ rm -f build
	@ ln -s .build build

.build/as3:
	@ mkdir -p ./.build/as3
	@ rm -f build
	@ ln -s .build build
	@ cp ./as3/manifest.json ./.build/as3/manifest.json
	@ cp ./as3/background.html ./.build/as3/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./as3/background.js --externs externs.js --js_output_file ./.build/as3/background.js
	@ pngcrush -d ./.build/as3 -rem alla -reduce -brute icon.png as3/icon.png >/dev/null
	@ pngcrush -d ./.build/as3 -rem alla -reduce -brute icon128.png as3/icon128.png >/dev/null
	@ pngcrush -d ./.build/as3 -rem alla -reduce -brute icon32.png as3/icon32.png >/dev/null
	@ pngcrush -d ./.build/as3 -rem alla -reduce -brute icon16.png as3/icon16.png >/dev/null

as3.zip: .build/as3
	@ (cd ./.build; zip -r9 as3.zip as3) >/dev/null
	@ cp ./.build/as3.zip ./as3.zip
	@ rm -f build
	@ ln -s .build build

.build/rb:
	@ mkdir -p ./.build/rb
	@ rm -f build
	@ ln -s .build build
	@ cp ./rb/manifest.json ./.build/rb/manifest.json
	@ cp ./rb/background.html ./.build/rb/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./rb/background.js --externs externs.js --js_output_file ./.build/rb/background.js
	@ pngcrush -d ./.build/rb -rem alla -reduce -brute icon.png rb/icon.png >/dev/null
	@ pngcrush -d ./.build/rb -rem alla -reduce -brute icon128.png rb/icon128.png >/dev/null
	@ pngcrush -d ./.build/rb -rem alla -reduce -brute icon32.png rb/icon32.png >/dev/null
	@ pngcrush -d ./.build/rb -rem alla -reduce -brute icon16.png rb/icon16.png >/dev/null

rb.zip: .build/rb
	@ (cd ./.build; zip -r9 rb.zip rb) >/dev/null
	@ cp ./.build/rb.zip ./rb.zip
	@ rm -f build
	@ ln -s .build build

.build/rails:
	@ mkdir -p ./.build/rails
	@ rm -f build
	@ ln -s .build build
	@ cp ./rails/manifest.json ./.build/rails/manifest.json
	@ cp ./rails/background.html ./.build/rails/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./rails/background.js --externs externs.js --js_output_file ./.build/rails/background.js
	@ pngcrush -d ./.build/rails -rem alla -reduce -brute icon.png rails/icon.png >/dev/null
	@ pngcrush -d ./.build/rails -rem alla -reduce -brute icon128.png rails/icon128.png >/dev/null
	@ pngcrush -d ./.build/rails -rem alla -reduce -brute icon32.png rails/icon32.png >/dev/null
	@ pngcrush -d ./.build/rails -rem alla -reduce -brute icon16.png rails/icon16.png >/dev/null

rails.zip: .build/rails
	@ (cd ./.build; zip -r9 rails.zip rails) >/dev/null
	@ cp ./.build/rails.zip ./rails.zip
	@ rm -f build
	@ ln -s .build build

.build/mysql:
	@ mkdir -p ./.build/mysql
	@ rm -f build
	@ ln -s .build build
	@ cp ./mysql/manifest.json ./.build/mysql/manifest.json
	@ cp ./mysql/background.html ./.build/mysql/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./mysql/background.js --externs externs.js --js_output_file ./.build/mysql/background.js
	@ pngcrush -d ./.build/mysql -rem alla -reduce -brute icon.png mysql/icon.png >/dev/null
	@ pngcrush -d ./.build/mysql -rem alla -reduce -brute icon128.png mysql/icon128.png >/dev/null
	@ pngcrush -d ./.build/mysql -rem alla -reduce -brute icon32.png mysql/icon32.png >/dev/null
	@ pngcrush -d ./.build/mysql -rem alla -reduce -brute icon16.png mysql/icon16.png >/dev/null

mysql.zip: .build/mysql
	@ (cd ./.build; zip -r9 mysql.zip mysql) >/dev/null
	@ cp ./.build/mysql.zip ./mysql.zip
	@ rm -f build
	@ ln -s .build build

.build/boost:
	@ mkdir -p ./.build/boost
	@ rm -f build
	@ ln -s .build build
	@ cp ./boost/manifest.json ./.build/boost/manifest.json
	@ cp ./boost/background.html ./.build/boost/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./boost/background.js --externs externs.js --js_output_file ./.build/boost/background.js
	@ pngcrush -d ./.build/boost -rem alla -reduce -brute icon.png boost/icon.png >/dev/null
	@ pngcrush -d ./.build/boost -rem alla -reduce -brute icon128.png boost/icon128.png >/dev/null
	@ pngcrush -d ./.build/boost -rem alla -reduce -brute icon32.png boost/icon32.png >/dev/null
	@ pngcrush -d ./.build/boost -rem alla -reduce -brute icon16.png boost/icon16.png >/dev/null

boost.zip: .build/boost
	@ (cd ./.build; zip -r9 boost.zip boost) >/dev/null
	@ cp ./.build/boost.zip ./boost.zip
	@ rm -f build
	@ ln -s .build build

.build/jee:
	@ mkdir -p ./.build/jee
	@ rm -f build
	@ ln -s .build build
	@ cp ./jee/manifest.json ./.build/jee/manifest.json
	@ cp ./jee/background.html ./.build/jee/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./jee/background.js --externs externs.js --js_output_file ./.build/jee/background.js
	@ pngcrush -d ./.build/jee -rem alla -reduce -brute icon.png jee/icon.png >/dev/null
	@ pngcrush -d ./.build/jee -rem alla -reduce -brute icon128.png jee/icon128.png >/dev/null
	@ pngcrush -d ./.build/jee -rem alla -reduce -brute icon32.png jee/icon32.png >/dev/null
	@ pngcrush -d ./.build/jee -rem alla -reduce -brute icon16.png jee/icon16.png >/dev/null

jee.zip: .build/jee
	@ (cd ./.build; zip -r9 jee.zip jee) >/dev/null
	@ cp ./.build/jee.zip ./jee.zip
	@ rm -f build
	@ ln -s .build build

.build/groovy:
	@ mkdir -p ./.build/groovy
	@ rm -f build
	@ ln -s .build build
	@ cp ./groovy/manifest.json ./.build/groovy/manifest.json
	@ cp ./groovy/background.html ./.build/groovy/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./groovy/background.js --externs externs.js --js_output_file ./.build/groovy/background.js
	@ pngcrush -d ./.build/groovy -rem alla -reduce -brute icon.png groovy/icon.png >/dev/null
	@ pngcrush -d ./.build/groovy -rem alla -reduce -brute icon128.png groovy/icon128.png >/dev/null
	@ pngcrush -d ./.build/groovy -rem alla -reduce -brute icon32.png groovy/icon32.png >/dev/null
	@ pngcrush -d ./.build/groovy -rem alla -reduce -brute icon16.png groovy/icon16.png >/dev/null

groovy.zip: .build/groovy
	@ (cd ./.build; zip -r9 groovy.zip groovy) >/dev/null
	@ cp ./.build/groovy.zip ./groovy.zip
	@ rm -f build
	@ ln -s .build build

.build/qt:
	@ mkdir -p ./.build/qt
	@ rm -f build
	@ ln -s .build build
	@ cp ./qt/manifest.json ./.build/qt/manifest.json
	@ cp ./qt/background.html ./.build/qt/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./qt/background.js --externs externs.js --js_output_file ./.build/qt/background.js
	@ pngcrush -d ./.build/qt -rem alla -reduce -brute icon.png qt/icon.png >/dev/null
	@ pngcrush -d ./.build/qt -rem alla -reduce -brute icon128.png qt/icon128.png >/dev/null
	@ pngcrush -d ./.build/qt -rem alla -reduce -brute icon32.png qt/icon32.png >/dev/null
	@ pngcrush -d ./.build/qt -rem alla -reduce -brute icon16.png qt/icon16.png >/dev/null

qt.zip: .build/qt
	@ (cd ./.build; zip -r9 qt.zip qt) >/dev/null
	@ cp ./.build/qt.zip ./qt.zip
	@ rm -f build
	@ ln -s .build build

.build/matlab:
	@ mkdir -p ./.build/matlab
	@ rm -f build
	@ ln -s .build build
	@ cp ./matlab/manifest.json ./.build/matlab/manifest.json
	@ cp ./matlab/background.html ./.build/matlab/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./matlab/background.js --externs externs.js --js_output_file ./.build/matlab/background.js
	@ pngcrush -d ./.build/matlab -rem alla -reduce -brute icon.png matlab/icon.png >/dev/null
	@ pngcrush -d ./.build/matlab -rem alla -reduce -brute icon128.png matlab/icon128.png >/dev/null
	@ pngcrush -d ./.build/matlab -rem alla -reduce -brute icon32.png matlab/icon32.png >/dev/null
	@ pngcrush -d ./.build/matlab -rem alla -reduce -brute icon16.png matlab/icon16.png >/dev/null

matlab.zip: .build/matlab
	@ (cd ./.build; zip -r9 matlab.zip matlab) >/dev/null
	@ cp ./.build/matlab.zip ./matlab.zip
	@ rm -f build
	@ ln -s .build build

.build/as3b:
	@ mkdir -p ./.build/as3b
	@ rm -f build
	@ ln -s .build build
	@ cp ./as3b/manifest.json ./.build/as3b/manifest.json
	@ cp ./as3b/background.html ./.build/as3b/background.html
	@ closure --compilation_level ADVANCED_OPTIMIZATIONS --js ./as3b/background.js --externs externs.js --js_output_file ./.build/as3b/background.js
	@ pngcrush -d ./.build/as3b -rem alla -reduce -brute icon.png as3b/icon.png >/dev/null
	@ pngcrush -d ./.build/as3b -rem alla -reduce -brute icon128.png as3b/icon128.png >/dev/null
	@ pngcrush -d ./.build/as3b -rem alla -reduce -brute icon32.png as3b/icon32.png >/dev/null
	@ pngcrush -d ./.build/as3b -rem alla -reduce -brute icon16.png as3b/icon16.png >/dev/null

as3b.zip: .build/as3b
	@ (cd ./.build; zip -r9 as3b.zip as3b) >/dev/null
	@ cp ./.build/as3b.zip ./as3b.zip
	@ rm -f build
	@ ln -s .build build

clean:
	@- rm -rf ./.build
	@- rm -f ./*.zip
	@- rm -f build
