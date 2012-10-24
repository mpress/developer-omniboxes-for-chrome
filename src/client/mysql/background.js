// == Helper Prototype Extensions ==
Storage.prototype.setObject = function(key, value, opt_expiration) {
    var expiration = opt_expiration || 3e9; // defaults to a little bit more than 1 month
    if (expiration > 0) {
        expiration += Date.now();
    }
    this.setItem(key, JSON.stringify(value));
    this.setItem(key + "__expiration", expiration);
};
Storage.prototype.getObject = function(key) {
    return JSON.parse(this.getItem(key));
};
Storage.prototype.hasUnexpired = function(key) {
    if (!this.getItem(key + "__expiration") || !this.getItem(key)) {
        return false;
    }
    var expiration = +this.getItem(key + "__expiration");
    return expiration < Date.now();
};
String.prototype.startsWith = function(str) {
    if (str.length > this.length) {
        return false;
    }
    return (String(this).substr(0, str.length) == str);
};
String.prototype.endsWith = function(str) {
    if (str.length > this.length) {
        return false;
    }
    return (String(this).substr(this.length - str.length, this.length) == str);
};
String.prototype.encode = function() {
    return encodeURIComponent(String(this));
};
String.prototype.strip = function() {
    var str = String(this);
    if (!str) {
        return "";
    }
    var startidx=0;
    var lastidx=str.length-1;
    while ((startidx<str.length)&&(str.charAt(startidx)==' ')){
        startidx++;
    }
    while ((lastidx>=startidx)&&(str.charAt(lastidx)==' ')){
        lastidx--;
    }
    if (lastidx < startidx) {
        return "";
    }
    return str.substring(startidx, lastidx+1);
};

// == Autocompletion Chrome Extension ==
(function(){
    // Issue a new GET request
    function xhr(url, ifexists, ifnotexists, retry_interval) {
        var retry_time = retry_interval || 5;
        var req = new XMLHttpRequest();
        console.log("Fetching: " + url);
        req.open("GET", url);
        req.onreadystatechange=function(){
            if (req.readyState == 4){
                var status=req.status;
                if ((status == 200) || (status == 301) || (status == 302)) {
                    ifexists(url, req);
                } else {
                    ifnotexists(url, req);
                    setTimeout(function() { xhr(url, ifexists, ifnotexists, retry_time + 5).send(null); }, retry_time);
                }
            }
        };
        return req;
    };
    
    // Navigates to the specified URL.
    function nav(url) {
        console.log("Navigating to: " + url);
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.update(tab.id, {url: url});
        });
    };
    
    // Sets the the default styling for the first search item
    function setDefaultSuggestion(text) {
        if (text) {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>MySQL Search</match></url> " + text});
        } else {
            chrome.omnibox.setDefaultSuggestion({"description":"<url><match>MySQL Search</match></url>"});
        }
    };
    
    chrome.omnibox.onInputStarted.addListener(function(){
        console.log("Input started");
        setDefaultSuggestion('');
    });
    
    chrome.omnibox.onInputCancelled.addListener(function() {
        console.log("Input cancelled.");
        setDefaultSuggestion('');
    });
    
    setDefaultSuggestion('');
    
    var commands = [
        ['ALTER DATABASE', 'http://dev.mysql.com/doc/refman/5.5/en/alter-database.html'],
        ['ALTER EVENT', 'http://dev.mysql.com/doc/refman/5.5/en/alter-event.html'],
        ['ALTER FUNCTION', 'http://dev.mysql.com/doc/refman/5.5/en/alter-function.html'],
        ['ALTER PROCEDURE', 'http://dev.mysql.com/doc/refman/5.5/en/alter-procedure.html'],
        ['ALTER SCHEMA', 'http://dev.mysql.com/doc/refman/5.5/en/alter-database.html'],
        ['ALTER SERVER', 'http://dev.mysql.com/doc/refman/5.5/en/alter-server.html'],
        ['ALTER TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/alter-table.html'],
        ['ALTER VIEW', 'http://dev.mysql.com/doc/refman/5.5/en/alter-view.html'],
        ['ANALYZE TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/analyze-table.html'],
        ['BEGIN ... END', 'http://dev.mysql.com/doc/refman/5.5/en/begin-end.html'],
        ['BEGIN WORK', 'http://dev.mysql.com/doc/refman/5.5/en/commit.html'],
        ['BINLOG', 'http://dev.mysql.com/doc/refman/5.5/en/binlog.html'],
        ['CACHE INDEX', 'http://dev.mysql.com/doc/refman/5.5/en/cache-index.html'],
        ['CALL', 'http://dev.mysql.com/doc/refman/5.5/en/call.html'],
        ['CASE', 'http://dev.mysql.com/doc/refman/5.5/en/case-statement.html'],
        ['CHANGE MASTER TO', 'http://dev.mysql.com/doc/refman/5.5/en/change-master-to.html'],
        ['CHECK TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/check-table.html'],
        ['CHECKSUM TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/checksum-table.html'],
        ['CLOSE', 'http://dev.mysql.com/doc/refman/5.5/en/close.html'],
        ['COMMIT', 'http://dev.mysql.com/doc/refman/5.5/en/commit.html'],
        ['CREATE DATABASE', 'http://dev.mysql.com/doc/refman/5.5/en/create-database.html'],
        ['CREATE EVENT', 'http://dev.mysql.com/doc/refman/5.5/en/create-event.html'],
        ['CREATE FUNCTION', 'http://dev.mysql.com/doc/refman/5.5/en/create-procedure.html'],
        ['CREATE INDEX', 'http://dev.mysql.com/doc/refman/5.5/en/create-index.html'],
        ['CREATE VIEW', 'http://dev.mysql.com/doc/refman/5.5/en/create-view.html'],
        ['CREATE PROCEDURE', 'http://dev.mysql.com/doc/refman/5.5/en/create-procedure.html'],
        ['CREATE SCHEMA', 'http://dev.mysql.com/doc/refman/5.5/en/create-database.html'],
        ['CREATE SERVER', 'http://dev.mysql.com/doc/refman/5.5/en/create-server.html'],
        ['CREATE TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/create-table.html'],
        ['CREATE TRIGGER', 'http://dev.mysql.com/doc/refman/5.5/en/create-trigger.html'],
        ['CREATE USER', 'http://dev.mysql.com/doc/refman/5.5/en/create-user.html'],
        ['CREATE VIEW', 'http://dev.mysql.com/doc/refman/5.5/en/create-view.html'],
        ['DEALLOCATE PREPARE', 'http://dev.mysql.com/doc/refman/5.5/en/deallocate-prepare.html'],
        ['DECLARE', 'http://dev.mysql.com/doc/refman/5.5/en/declare.html'],
        ['DELETE', 'http://dev.mysql.com/doc/refman/5.5/en/delete.html'],
        ['DESCRIBE', 'http://dev.mysql.com/doc/refman/5.5/en/describe.html'],
        ['DO', 'http://dev.mysql.com/doc/refman/5.5/en/do.html'],
        ['DROP DATABASE', 'http://dev.mysql.com/doc/refman/5.5/en/drop-database.html'],
        ['DROP EVENT', 'http://dev.mysql.com/doc/refman/5.5/en/drop-event.html'],
        ['DROP FUNCTION', 'http://dev.mysql.com/doc/refman/5.5/en/drop-procedure.html'],
        ['DROP INDEX', 'http://dev.mysql.com/doc/refman/5.5/en/drop-index.html'],
        ['DROP PROCEDURE', 'http://dev.mysql.com/doc/refman/5.5/en/drop-procedure.html'],
        ['DROP SCHEMA', 'http://dev.mysql.com/doc/refman/5.5/en/drop-database.html'],
        ['DROP SERVER', 'http://dev.mysql.com/doc/refman/5.5/en/drop-server.html'],
        ['DROP TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/drop-table.html'],
        ['DROP TRIGGER', 'http://dev.mysql.com/doc/refman/5.5/en/drop-trigger.html'],
        ['DROP USER', 'http://dev.mysql.com/doc/refman/5.5/en/drop-user.html'],
        ['DROP VIEW', 'http://dev.mysql.com/doc/refman/5.5/en/drop-view.html'],
        ['EXECUTE', 'http://dev.mysql.com/doc/refman/5.5/en/execute.html'],
        ['EXPLAIN', 'http://dev.mysql.com/doc/refman/5.5/en/explain.html'],
        ['FETCH', 'http://dev.mysql.com/doc/refman/5.5/en/fetch.html'],
        ['FLUSH', 'http://dev.mysql.com/doc/refman/5.5/en/flush.html'],
        ['GRANT', 'http://dev.mysql.com/doc/refman/5.5/en/grant.html'],
        ['HANDLER', 'http://dev.mysql.com/doc/refman/5.5/en/handler.html'],
        ['HELP', 'http://dev.mysql.com/doc/refman/5.5/en/help.html'],
        ['IF', 'http://dev.mysql.com/doc/refman/5.5/en/if-statement.html'],
        ['INSERT', 'http://dev.mysql.com/doc/refman/5.5/en/insert.html'],
        ['INSTALL PLUGIN', 'http://dev.mysql.com/doc/refman/5.5/en/install-plugin.html'],
        ['ITERATE', 'http://dev.mysql.com/doc/refman/5.5/en/iterate-statement.html'],
        ['KILL', 'http://dev.mysql.com/doc/refman/5.5/en/kill.html'],
        ['LEAVE', 'http://dev.mysql.com/doc/refman/5.5/en/leave-statement.html'],
        ['LOAD DATA', 'http://dev.mysql.com/doc/refman/5.5/en/load-data.html'],
        ['LOAD XML', 'http://dev.mysql.com/doc/refman/5.5/en/load-xml.html'],
        ['LOCK TABLES', 'http://dev.mysql.com/doc/refman/5.5/en/lock-tables.html'],
        ['LOOP', 'http://dev.mysql.com/doc/refman/5.5/en/loop-statement.html'],
        ['OPEN', 'http://dev.mysql.com/doc/refman/5.5/en/open.html'],
        ['OPTIMIZE TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/optimize-table.html'],
        ['PREPARE', 'http://dev.mysql.com/doc/refman/5.5/en/prepare.html'],
        ['PURGE BINARY LOGS', 'http://dev.mysql.com/doc/refman/5.5/en/purge-binary-logs.html'],
        ['RELEASE SAVEPOINT', 'http://dev.mysql.com/doc/refman/5.5/en/savepoint.html'],
        ['RENAME TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/rename-table.html'],
        ['RENAME USER', 'http://dev.mysql.com/doc/refman/5.5/en/rename-user.html'],
        ['REPAIR TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/repair-table.html'],
        ['REPEAT', 'http://dev.mysql.com/doc/refman/5.5/en/repeat-statement.html'],
        ['REPLACE', 'http://dev.mysql.com/doc/refman/5.5/en/replace.html'],
        ['RESET', 'http://dev.mysql.com/doc/refman/5.5/en/reset.html'],
        ['RESIGNAL', 'http://dev.mysql.com/doc/refman/5.5/en/resignal.html'],
        ['RETURN', 'http://dev.mysql.com/doc/refman/5.5/en/return.html'],
        ['REVOKE', 'http://dev.mysql.com/doc/refman/5.5/en/revoke.html'],
        ['ROLLBACK', 'http://dev.mysql.com/doc/refman/5.5/en/commit.html'],
        ['ROLLBACK TO SAVEPOINT', 'http://dev.mysql.com/doc/refman/5.5/en/savepoint.html'],
        ['SAVEPOINT', 'http://dev.mysql.com/doc/refman/5.5/en/savepoint.html'],
        ['SELECT', 'http://dev.mysql.com/doc/refman/5.5/en/select.html'],
        ['SET', 'http://dev.mysql.com/doc/refman/5.5/en/set-option.html'],
        ['SET PASSWORD', 'http://dev.mysql.com/doc/refman/5.5/en/set-password.html'],
        ['SET TRANSACTION', 'http://dev.mysql.com/doc/refman/5.5/en/set-transaction.html'],
        ['SHOW', 'http://dev.mysql.com/doc/refman/5.5/en/show.html'],
        ['SIGNAL', 'http://dev.mysql.com/doc/refman/5.5/en/signal.html'],
        ['START SLAVE', 'http://dev.mysql.com/doc/refman/5.5/en/start-slave.html'],
        ['START TRANSACTION', 'http://dev.mysql.com/doc/refman/5.5/en/commit.html'],
        ['STOP SLAVE', 'http://dev.mysql.com/doc/refman/5.5/en/stop-slave.html'],
        ['TRUNCATE TABLE', 'http://dev.mysql.com/doc/refman/5.5/en/truncate-table.html'],
        ['UNINSTALL PLUGIN', 'http://dev.mysql.com/doc/refman/5.5/en/uninstall-plugin.html'],
        ['UNION', 'http://dev.mysql.com/doc/refman/5.5/en/union.html'],
        ['UNLOCK TABLES', 'http://dev.mysql.com/doc/refman/5.5/en/lock-tables.html'],
        ['UPDATE', 'http://dev.mysql.com/doc/refman/5.5/en/update.html'],
        ['USE', 'http://dev.mysql.com/doc/refman/5.5/en/use.html'],
        ['WHILE', 'http://dev.mysql.com/doc/refman/5.5/en/while-statement.html']
    ];
    
    chrome.omnibox.onInputChanged.addListener(function(text, suggest_callback) {
        setDefaultSuggestion(text);
        if (!text) {
            return;
        }
        
        var kMaxSuggestions = 10;
        var suggestions = [];
        var stripped_text = text.strip();
        if (!stripped_text) {
            return;
        }
        var qlower = stripped_text.toLowerCase();
        
        var second = [];
        for (var i = 0; i < commands.length; ++i) {
            var entry = commands[i];
            var name = entry[0];
            var url = entry[1];
            var namelower = name.toLowerCase();
            var index = namelower.indexOf(qlower);
            if (index != -1) {
                var obj = {
                    "content":url,
                    "description":["<match>", name, "</match> command syntax - <url>", url, "</url>"].join('')};
                if (index == 0) {
                    suggestions.push(obj);
                } else {
                    second.push(obj);
                }
            }
            
            if (suggestions.length > kMaxSuggestions) {
                break;
            }
        }
        
        if (suggestions.length < kMaxSuggestions) {
            for (var i = 0; i < second.length; ++i) {
                suggestions.push(second[i]);
                if (suggestions.length > kMaxSuggestions) {
                    break;
                }
            }
        }
        
        
        if (stripped_text.length >= 2) {
            suggestions.push({"content":stripped_text +  " [Google Code Search]", 
                "description":["Search for \"<match>", stripped_text, "</match> <dim>lang:sql</dim>\" using <match><url>Google Code Search</url></match> - <url>http://code.google.com/codesearch#search/&amp;q=", encodeURIComponent(stripped_text + " lang:sql"), "</url>"].join('')}); 
            suggestions.push({"content":stripped_text +  " [Development and Coding Search]", 
                "description":["Search for \"<dim>MySQL</dim> <match>", stripped_text, "</match>\" using <match><url>Develoment and Coding Search</url></match> - <url>http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&amp;q=", encodeURIComponent("MySQL "+stripped_text), "</url>"].join('')});
        }
        suggest_callback(suggestions);
    });
    
    chrome.omnibox.onInputEntered.addListener(function(text) {
        console.log("Input entered: " + text);
        if (!text) {
            nav("http://dev.mysql.com/doc/refman/5.5/en/");
            return;
        }
        
        var stripped_text = text.strip();
        if (!stripped_text) {
            nav("http://dev.mysql.com/doc/refman/5.5/en/");
            return;
        }
        
        if (stripped_text.startsWith("http://") || stripped_text.startsWith("https://")) {
            nav(stripped_text);
            return;
        }
        
        if (stripped_text.startsWith("www.") || stripped_text.endsWith(".com") || stripped_text.endsWith(".net") || stripped_text.endsWith(".org") || stripped_text.endsWith(".edu")) {
            nav("http://" + stripped_text);
            return;
        }
                
        var google_codesearch_suffix = " [Google Code Search]";
        if (stripped_text.endsWith(google_codesearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - google_codesearch_suffix.length).strip();
            nav("http://code.google.com/codesearch#search/&q=" + encodeURIComponent(newquery + " lang:sql"));
            return;
        }
        
        var devsearch_suffix = " [Development and Coding Search]";
        if (stripped_text.endsWith(devsearch_suffix)) {
            var newquery = stripped_text.substring(0, stripped_text.length - devsearch_suffix.length).strip();
            nav("http://www.google.com/cse?cx=005154715738920500810:fmizctlroiw&q=" + encodeURIComponent("MySQL "+newquery));
            return;
        }
        
        var qlower = stripped_text.toLowerCase();
        for (var i = 0; i < commands.length; ++i) {
            var entry = commands[i];
            var name = entry[0];
            var url = entry[1];
            if (name.toLowerCase() == qlower) {
                nav(url);
                return;
            }
        };
        
        nav("http://www.google.com/search?q=" + encodeURIComponent("MySQL "+stripped_text));
    });
})();