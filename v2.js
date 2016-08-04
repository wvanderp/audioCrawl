'use strict';

var request = require('sync-request');
var linkscrape = require("linkscrape");
var fs = require("fs");
const execSync = require('child_process').execSync;
var md5 = require('md5');
const urlParse = require('url');

// --------------------------------------------------------------------------

var acoustidKey = "RPP8Za7Vnd";
var acoustidUrl = "http://api.acoustid.org/v2/lookup";
var acoustidParam = "?client="+acoustidKey+"&format=json&meta=recordingids";

//var ownDomain = "http://cwms.cc/audioCrawl/api/";
var ownDomain = "http://localhost/audioCrawl/api/";

var addMatchApi = ownDomain + "addMatch.php";
var addUrlApi = ownDomain + "addUrl.php";
var getTaskApi = ownDomain + "getTask.php";
var markDoneApi = ownDomain + "markDone.php";
var noMatchApi = ownDomain + "noMatch.php";


var includeExt = ["mp3", "htm", "html", "php", "asp", "jsp", "mhtml", "shtml", "aspx", "ashx", "cgi", "cshtml", "jspx", "phtml", "xhtml", "html5"];
//var ignoredExt = ["jpeg", "css", "deb", "sig", "mov", "rss", "vcf", "gpg", "JPG", "m4a", "rpm", "xml", "jpg", "gif", "pdf", "png", "mp4", "uts", "atom", "wmv", "avi", "wma", "flac", "db", "tar", "gz", "bz2", "ini", "flv", "txt", "doc", "docx", "iso", "zip", "exe", "rtf", "cab", "bmp"];

start();
// --------------------------------------------------------------------------

function start(){
    while(true) {
        var url = getTaskApiCall();

        parseUrl(url);
        markDoneApiCall(url);
    }
}

function getPage(url){
    console.log("downloading: "+url);
    var res = request('GET', url);
    if (res.statusCode != 200) {
        throw "error received while fetching page: "+ res.statusCode;
    }

    return res.getBody().toString("utf-8");
}

function parseUrl(url) {
    var mp3Regex = /.+?\.mp3$/gim;
    if(mp3Regex.test(url)){
        // console.log("it is a mp3");
        getSongs(url, page);
    }else{

        try {
            var page = getPage(url);
        } catch (e) {
            console.log(e);
            markDoneApiCall(url);
            return;
        }

        linkscrape(url, page, function(links, $) {
            for(var i in links){
                var link = links[i].link;
                if (link === null){
                    continue;
                }
                addUrl(link);
            }
        });
    }
}


function addUrl(url){
    // console.log("it is a normal url");
    var urlObj = urlParse.parse(url);

    var path = urlObj.pathname;

    var isGood = false;

    for(var i in includeExt) {
        var ext = includeExt[i];
        var extRegex = new RegExp("/.+?\." + ext + "$");
        if (extRegex.test(url)) {
            isGood = true;
            //console.log("found good extention: "+ ext);
        }
    }

    if (path == null){
        isGood = true;
        //console.log("is root: "+ url);
    }

    if(!isGood && path.substr(-1) === "/"){
        isGood = true;
        //console.log("ended on /");
    }

    if(!isGood && path.indexOf(".") == -1){
        isGood = true;
        //console.log("no points in the path");
    }

    if(path !== null && path.indexOf("mailto:") == -1){
        isGood = false;
        //console.log("mail to found");
    }

    if(isGood) {
        console.log("adding url to db");
        addUrlApiCall("{\"urls\":[\"" + url + "\"]}");
    }else{
        //console.log("ended on : " + path.substr(-4))
    }
}

function getSongs(url) {
    console.log("downloading: "+url);
    var res = request('GET', url);
    if (res.statusCode != 200) {
        console.log("error received while fetching mp3: " + res.statusCode);
        return;
    }

    var song = res.getBody();


    fs.writeFileSync("test.mp3", song);

    console.log("calculating fingerprint");
    try {
        var result = execSync("fpcalc test.mp3");
    }catch(e) {
        //console.log(e);
        markDoneApiCall(url);
        return;
    }

    var string = result.toString('utf-8');
    var parts = string.split("\n");

    var duration = parts[1];
    var fingerprint = parts[2];

    duration = duration.replace("DURATION=", "");
    fingerprint = fingerprint.replace("FINGERPRINT=", "");

    var hash = md5(song);

    findSong(duration, fingerprint, hash, url);
}

function findSong(duration, fingerprint, hash, url) {
    var recordIds = acoustidApiCall(duration, fingerprint);

    if (recordIds.length === 0){
        console.log("no matches found");
        noMatchApiCall(url);
        return;
    }

    console.log("adding "+ recordIds.length +" matches to the db")

    for(var i in recordIds){
        var mbid = recordIds[i].id;

        addMatchApiCall(url, mbid, hash);
    }
}

// --------------------------------------------------------------------------
// api calls

function addMatchApiCall(urls, mbid, hash){
	var url = addMatchApi+"?url="+urls+"&mbid="+mbid+"&hash="+hash;
    
    var res = request('GET', url);
    if (res.statusCode != 200) {
    	throw "error received from own server: "+ res.statusCode;
    }
}

function addUrlApiCall(urls){
	var url = addUrlApi+"?urls="+urls;

    var res = request('GET', url);
    if (res.statusCode != 200) {
    	throw "error received from own server: "+ res.statusCode;
    }
    //console.log(res.getBody().toString("utf-8"));
}

function getTaskApiCall(){
    var res = request('GET', getTaskApi);
    if (res.statusCode != 200) {
    	throw "error received from own server: "+ res.statusCode;
    }

    var body = res.getBody().toString("utf-8");

    return JSON.parse(body).url;
}

function markDoneApiCall(urls){
    var url = markDoneApi+"?url="+urls;

    var res = request('GET', url);
    if (res.statusCode != 200) {
        throw "error received from own server: "+ res.statusCode;
    }
}

function noMatchApiCall(urls){
    var url = noMatchApi+"?url="+urls;

    var res = request('GET', url);
    if (res.statusCode != 200) {
        throw "error received from own server: "+ res.statusCode;
    }
}

function acoustidApiCall(duration, fingerprint){
    var fullUrl = acoustidUrl + acoustidParam + "&duration="+duration+"&fingerprint="+fingerprint;

    var res = request('GET', fullUrl);

    if (res.statusCode != 200) {
    	throw "error received from acoustid server: "+ res.statusCode;
    }

    var resp =  res.getBody();
    var json = JSON.parse(resp.toString('utf-8'));

    console.log(json);

    if (json.results.length == 0){
        return [];
    }

    if (json.results.length == 1){
        return json.results;
    }

    return json.results[0].recordings;
}