var util =      require('util');
var db =        require('./mongox.js');
var http =      require('http');
var col =       'tdb';


/*

                            init() -> getsummary() -> getmatch() -> insert
                                                  /
            id -> gethh() -> check() -> getss() -/
               / 
    getids() -/

*/



process.argv.forEach(function(val, index, array) {

    var s = val.split('=');    
    switch(s[0]){

    case "i":    
        init(0); 
        setTimeout( (function(){ process.exit(1) }) , 5*60000 ); //exit in 2mins
        break;

    case "init":    
        init(s[1] || 0); 
        setTimeout( (function(){ process.exit(1) }) , 5*60000 ); //exit in 2mins
        break;
        
    case "hh":      
        getids(); 
        break;
        
    }
    
});


//init();
//getsummary(id, 'su');
//getmatch(id);
//gethh(id);
//getss(id);
//getstats(id, 'st');
//getids();


/*

    ** !!!
    get all ids
    ** !!!
    
    get ALL ids and feed to gethh

*/
function getids(){

    var t = {};
    var p = { '_id': 1 };
    var l = 5;
    var s = { 'rtime':-1 };
    
    var d = 100000;
    var r = 1;
                    
    db.collection(col).find(t, p).limit(l).sort(s).toArray(function(err, docs) {
    if (err) console.log(err);
            
        if(docs){
            docs.forEach(function (doc, i, o) {
                                
                if(doc){

                    r = Math.floor((Math.random() * 10) + 5);
                    setTimeout( function(){ 
    									
						console.log('getids: '+doc._id);
                        gethh(doc._id); 
                         
                    }, (i * d * r));  
                    //gethh(doc._id);
                        
                }
                
            });
                    
        }

    });
            
}


/*

    
    fetch all match for day


*/
function init(d) {

    var days = d || 0;   //days ago
    var type = 'su';

    getpage(days, function(y) {

        var JS_ROW_END = '~';
        var JS_CELL_END = '¬';
        var JS_INDEX = '÷';
        
        var id, p1, p2, done, rtime;

        var rows = y.split(JS_ROW_END);

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i].split(JS_CELL_END);

            for (var j = 0; j < row.length; j++) {
                var r = row[j].split(JS_INDEX);

                // AA - match id -          GGrbtDO2
                // AD - match time -        1443496200
                // AB - completed -         1:not completed, 2:completed, 3:completed
                // AE - 1st player(s) -     Volandri F. (Ita)
                // AF - 2nd player(s) -     Viola M. (Ita)


                if (r[0] == 'AA')
                    id = r[1];

                else
                if (r[0] == 'AD')
                    rtime = r[1];   

                else
                if (r[0] == 'AE')
                    p1 = r[1];

                else
                if (r[0] == 'AF')
                    p2 = r[1];

                else
                if (r[0] == 'AB')
                    if (r[1] == '2' || r[1] == '3')
                        done = r[1];
                        
                if(id && p1 && p2){

                    var c1 = p1 && p1.indexOf('(') > 0 ? p1.substr(p1.length - 4,3) : '';
                    var c2 = p2 && p2.indexOf('(') > 0 ? p2.substr(p2.length - 4,3) : '';
    
                    //getsummary(id, type, c1, c2, rtime);
                    initdelay(i, id, type, c1, c2, rtime);
  
                    id = p1 = p2 = rtime = 0;
                
                }

            }

        }

    });

}
function initdelay(i, id, type, c1, c2, rtime){
    
    //set random delay
    var q = 500;
    var r = Math.floor((Math.random() * 10) + 1);
         
    setTimeout( 
        function(){
        getsummary(id, type, c1, c2, rtime);
        },
    i * r * q);

}



/*


    get match summary for id from init


*/
function getsummary(id, type, c1, c2, rtime) {

    getmatches(id, type, function(y) {

        var c = /(?:>)((<sup>)*[\w\s].*?(<\/sup>)*)(?=<)/g.execAll(y);

        //console.log(c.length);
        var e = {
            '_id':      id,
            'g1score':  [],
            'g1cntry':  c1,
            'g2score':  [],
            'g2cntry':  c2,
            'time':     [],
            'rtime':    rtime,
        };
        var r = 'g1score';

        for (var i = 2; i < c.length; i++) {

            //match points, including duece
            if ( !isNaN(parseInt(c[i][1], 10)) )

                if (   i + 1 < c.length 
                    && c[i + 1][1] 
                    && c[i + 1][1].indexOf("<sup>") === 0 ) 
                    e[r].push( c[i][1] + '.' + c[i + 1][1].substring(5, c[i + 1][1].length - 6) );
                    //e[r].push(parseFloat(c[i][1] + '.' + c[i + 1][1].substring(5, c[i + 1][1].length - 6), 10));
                
                else 
                    e[r].push(c[i][1]);
                    //e[r].push(parseInt(c[i][1], 10));
                

            //skip artefacts
            if (   c[i][1].indexOf(" (") === 0 
                || c[i][1].indexOf(" /") === 0 ) 
                continue;
            

            //player name
            //switch array push
            if (   isNaN(parseInt(c[i][1], 10)) 
                && c[i][1].indexOf("<sup>") !== 0 
                && c[i][1].indexOf(" (") !== 0 && i > 4 ) 
                r = 'g2score';

            
            //match times
            if (c[i][1] == "Match time:"){ 
                for (var j = 1; j < e.g1score[0] + e.g2score[0] + 2; j++) 
                    if( c[i + j] && c[i + j][1] )
                    e.time.push(c[i + j][1]);
                
                break;
            }
            
        }
        
        //console.log( e ); 
        if(e)
            getmatch(id, e);
        
    });

}






/*


    fetch all ids in head to head tab for a given id


*/
function gethh(id) {

    getmatches(id, 'hh', function(y) {

        var c = /(g_0_([\w\d]{8})\')/g.execAll(y);
                
        
        console.log(c.length);                
        for(var i=0; i<c.length; i++){
            
            //console.log( c[i][2] );   
            getssdelay(i, (c[i][2]));                          
            
        }
        
    });

}
function getssdelay(i,z) {
    
    //set random delay
    var r = Math.floor((Math.random() * 10) + 1);
 
    setTimeout( function(){ check(z, getss) }, ( i * 5000 * r ) );  
  
}



/*

    check for missing ids

*/
function check(id, callback){
        
    var t = { '_id': id };
    var p = { '_id': 1 };
    var l = 1;
    var s = {};
                    
    db.collection(col).find(t, p).limit(l).sort(s).toArray(function(err, docs) {
    if (err) console.log(err);
    
        //console.log(docs.length); 
        if( !docs.length )
        callback(id);
        
    });
            
}




/*
    
    get match summary for a single id

*/
function getss(id) {    

    getmatches(id, 'su', function(y) {

        var c = /(?:>)((<sup>)*[\w\s].*?(<\/sup>)*)(?=<)/g.execAll(y);

        //console.log(c.length);
        var e = {
            '_id':      id,
            'g1score':  [],
            'g1cntry':  '',
            'g2score':  [],
            'g2cntry':  '',
            'time':     [],
            'rtime':    '',
        };
        e.g1cntry = c[0] && c[1] && c[1][0] && c[1][1] && c[1][1].indexOf("(") >= 0 ? c[1][1].substr(c[1][1].length - 4,3) : '';
        var r = 'g1score';
        
    
        for (var i = 2; i < c.length; i++) {


            // ** DO NOT PARSE SCORE
            // ** SCORE IS STRING
            // ** DEUCE EG: 7.7            
            //match points, including duece
            if ( !isNaN(parseInt(c[i][1], 10)) )

                if (   i + 1 < c.length 
                    && c[i + 1][1] 
                    && c[i + 1][1].indexOf("<sup>") === 0 ) 
                    e[r].push( c[i][1] + '.' + c[i + 1][1].substring(5, c[i + 1][1].length - 6) );
                    //e[r].push(parseFloat(c[i][1] + '.' + c[i + 1][1].substring(5, c[i + 1][1].length - 6), 10));
                
                else 
                    e[r].push(c[i][1]);
                    //e[r].push(parseInt(c[i][1], 10));
                

            //skip artefacts
            if (   c[i][1].indexOf(" (") === 0 
                || c[i][1].indexOf(" /") === 0 ) 
                continue;
            

            //player name
            //switch array push
            if (   isNaN(parseInt(c[i][1], 10)) 
                && c[i][1].indexOf("<sup>") !== 0 
                && c[i][1].indexOf(" (") !== 0 
                && c[i][1].indexOf(":") < 0 
                && i > 4 ){ 
                r = 'g2score';
                
                e.g2cntry = c[i][1] && c[i][1].indexOf("(") >= 0 ? c[i][1].substr(c[i][1].length - 4,3) : '';
            }

            
            //match times
            if (c[i][1] == "Match time:"){ 
                for (var j = 1; j < e.g1score[0] + e.g2score[0] + 2; j++) 
                    if( c[i + j] && c[i + j][1] )
                    e.time.push(c[i + j][1]);
                
                break;
            }
            
        }
        
        //console.log( e ); 
        if(e)
            getmatch(id, e);
        
    });

}





/*

    get match details for a given id

*/
function getmatch(id, e) {

    match(id, function(y) {

        var utime = y.match(/game_utime\s=\s([\d]{10});/);
        //console.log( utime[1] ); 


        var c = /(?!>Loading)(?!>Finished)(?!>Bet\s\$)>[^#\t\n\r\s><&$"'()-].*?</g.execAll(y);
        //console.log(c.length);


        //remove < >
        for (var i = 0; i < c.length; i++){
            c[i] = c[i][0].replace(/</g, '').replace(/>/g, '');
            //console.log(i + ': ' + c[i]);
        }


        var z = {
            '_id': id,
            'atp': 0,
            'singles': 0,
            'tourn': 0,
            'ground': 0,
            'finals': 0,
            'rtime': 0,
            'time': 0,

            'g1': 0,
            'g1rank': 0,
            'g1cntry': 0,
            'g1score': 0,
            'g1bet': 0,

            'g2': 0,
            'g2rank': 0,
            'g2cntry': 0,
            'g2score': 0,
            'g2bet': 0
        };

        var atp, tourn, g1rank, g2rank, gplayer, court, bet;


        //get bets if any
        if (c.indexOf("bet365") > 0) {
            bet = c.indexOf("bet365");
            z.g1bet = c[bet + 1] ? c[bet + 1] : 0;
            z.g2bet = c[bet + 2] ? c[bet + 2] : 0;
        }

        
        //get rank if any
        var at = getAllIndexes(c, "ATP");
        var wt = getAllIndexes(c, "WTA");
        if (at.length || wt.length) {
            var rankings = at.length ? at : wt;

            g1rank = rankings[0] ? parseInt(c[rankings[0] + 1].substring(2, c[rankings[0] + 1].length - 1), 10) : 0;
            z.g1rank = g1rank ? g1rank : 0;

            g2rank = rankings[1] ? parseInt(c[rankings[1] + 1].substring(2, c[rankings[1] + 1].length - 1), 10) : 0;
            z.g2rank = g2rank ? g2rank : 0;
        }


        //get player names, first and last
        if (c[0]) {
            gplayer = c[0].split(' | ');
            gplayer = gplayer[1].split(' - ');

            z.g1 = gplayer[0] || 0;
            z.g2 = gplayer[1] || 0;
        }


        //court and tournament details
        if (c[1]) {
            atp = c[1].split(' - ');
            tourn = c[2].split(', ');
            court = tourn[1] ? tourn[1].split(' - ') : '';

            z.atp = atp[0] || 0;
            z.singles = atp[1] || 0;
            z.tourn = tourn[0] || 0;
            z.ground = court[0] || 0;
            z.finals = court[1] || 0;
        }


        //get remaining match details
        z.rtime = e.rtime || utime[1] || 0;
        z.time = e.time || 0;

        z.g1cntry = e.g1cntry || 0;
        z.g1score = e.g1score || 0;
        z.g2cntry = e.g2cntry || 0;
        z.g2score = e.g2score || 0;


        //write
        db.collection(col).update(
            { '_id': id },
            z, 
            { 'upsert': true }
        ,function(err, rec, val){
            
            if(err)
                console.log('err: ' + err);
            if(rec)
                console.log('rec: ' + rec);
            if(val)
                console.log('val: ' + val);       
                        
        });
        
        console.log('insert: ' + id);


    });

}


function getAllIndexes(arr, val) {
    var indexes = [], i = -1;
    while ((i = arr.indexOf(val, i+1)) != -1){
        indexes.push(i);
    }
    return indexes;
}








/*

  
    fetch match stats for a given id


*/
function getstats(id, type) {

    getmatches(id, type, function(y) {


        y = /(?!>)\w+\s*\w*%?\s*\w*\w*\s*:*\w*(?=<)/g.execAll(y);


        var o = 0;
        var t = [];
        for (var i = 0; i < y.length && o < 34; i = i + 2) {
            //y.length-7


            if (
                y[i] != 'odd' &&
                y[i] != 'h-part' &&
                y[i] != 'even' &&
                y[i] != 'Points' &&
                y[i] != 'Games' &&
                y[i] != 'Return' &&
                y[i] != 'Service' &&
                y[i] != 'undefined' &&
                y[i] != 'Match' &&
                y[i] != 'Set 1' &&
                y[i] != 'Set 2' &&
                y[i] != 'Set 3' &&
                y[i] != 'Set 4' &&
                y[i] != 'Set 5' &&
                y[i]
            ) {

                y[i] = y[i].toString().replace('%', '');
                y[i] = y[i].toString().replace('(', '');
                y[i] = y[i].toString().replace(')', '');
                y[i] = y[i].toString().replace('/', ' ');

                y[i] = y[i].toString().split(' ');


                //console.log(i, o++, y[i]); 

                t.push(y[i]);

            }

        }

        var merged = [];
        merged = merged.concat.apply(merged, t);


        console.log(merged.length, merged);


    });

}








/*


    fetch webpages
    www.flashscore.com.au/match/' + id 


*/
function match(id, callback) {

    var data;

    //setup options
    var get_options = {
        port: '80',
        host: 'www.flashscore.com.au',
        path: '/match/' + id + '/',
        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36',

            'Host': 'www.flashscore.com.au',
            'Pragma': 'no-cache',
            'Referer': 'http://www.flashscore.com.au/tennis/',
            'Upgrade-Insecure-Requests': '1',
        }
    };

    //setup request
    var get_req = http.get(get_options, function(res) {

        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', function(chunk) {

            //save and return res
            data += chunk;

        });

        res.on('end', function() {

            callback(data);

        });
    });
}



/*


    fetch webpages
    summary / head to head


*/
function getmatches(id, type, callback) {

    var data;

    //setup options
    var get_options = {
        port: '80',
        host: 'd.flashscore.com.au',
        path: '/x/feed/d_' + type + '_' + id + '_en-au_1',

        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36',

            'Host': 'd.flashscore.com.au',
            'Referer': 'http://d.flashscore.com.au/x/feed/proxy',
            'X-Fsign': 'SW9D1eZo'
        }
    };

    //setup request
    var get_req = http.get(get_options, function(res) {

        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', function(chunk) {

            //console.log('Response---------------------------------------------------------------------------------------------------------------------: ' + chunk);

            //save and return res
            data += chunk;

        });

        res.on('end', function() {

            callback(data);

        });
    });
}



/*


    fetch webpages
    all matches for the day


*/
function getpage(days, callback) {

    var data;

    //setup options
    var get_options = {
        host: 'd.flashscore.com.au',
        port: '80',
        path: '/x/feed/f_2_'+ days +'_10_en-au_1',

        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36',
            'Host': 'd.flashscore.com.au',
            'Referer': 'http://d.flashscore.com.au/x/feed/proxy',
            'X-Fsign': 'SW9D1eZo'
        }
    };

    //setup request
    var get_req = http.get(get_options, function(res) {

        //console.log('STATUS: ' + res.statusCode);
        //console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.setEncoding('utf8');
        res.on('data', function(chunk) {

            //save and return res
            data += chunk;

        });

        res.on('end', function() {

            callback(data);


        });
    });
}



RegExp.prototype.execAll = function(string) {
    var match = null;
    var matches = [];
    while (match = this.exec(string)) {
        var matchArray = [];
        for (var i in match) {
            if (parseInt(i, 10) == i) {
                matchArray.push(match[i]);
            }
        }
        matches.push(matchArray);
    }
    return matches;
};


