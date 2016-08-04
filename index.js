'use strict';
var request = require('sync-request');
var linkscrape = require("linkscrape");
var fs = require("fs");
const execSync = require('child_process').execSync;
var md5 = require('md5');

// ==========================================================

var apiKey = "RPP8Za7Vnd";
var apiBaseUrl = "http://api.acoustid.org/v2/lookup";
var apiBaseParam = "?client="+apiKey+"&format=json&meta=recordingids";

//var ownDomain = "http://cwms.cc/audioCrawl/api/";
var ownDomain = "http://localhost/audioCrawl/api/";

//var ownApiUrl = ownDomain + "add.php";
var ownApiUrl = ownDomain + "add.php";

var ignoredExt = ["jpeg","jpg", "gif", "pdf", "png", "mp4", "avi", "flv", "txt", "doc", "docx", "iso", "zip", "exe", "rtf", "cab", "bmp"];

start();

function start() {
    console.log("start crawling");
    while(true){
        var taskurl =
        crawl(queue[0]);
    }
}

function crawl(url) {
    console.log("requesting: "+url);
    var res = request('GET', url);
    var body = res.getBody();

    done.push(url);
    parse(body, url)

}


function parse(body, url) {
    linkscrape(url, body, function(links, $) {
        for(var i in links){
            var link = links[i].link;
            if (link == null){
                continue;
            }
            parseUrl(link)
        }
    });
}

function parseUrl(url) {
    var mp3Regex = /.+?\.mp3$/gim;
    if(mp3Regex.test(url)){
        // console.log("it is a mp3");
        getSongs(url);
    }else{
        // console.log("it is a normal url");
        for(var i in ignoredExt){
            var ext = ignoredExt[i];
            var extRegex =  new RegExp("/.+?\."+ext+"$");
            if(extRegex.test(url)){
                console.log("it is an unwanted file extention");
                return
            }
        }
        addUrlToQueue(url);
    }
}

function addUrlToQueue(url) {
    var urlApi = ownDomain + "url.php";
    var obj = JSON.stringify([url]);
    var requestUrl = urlApi + "?urls=" + obj;

    console.log(requestUrl);

    var res = request('GET', requestUrl);
}

function getSongs(url) {
    console.log("downloading mp3");
    var res = request('GET', url);
    var song = res.getBody();
    // console.log(song);
    fs.writeFileSync("test.mp3", song);

    console.log("calculating fingerprint");
    var result = execSync("fpcalc test.mp3");
    var string = result.toString('utf-8');
    var parts = string.split("\n");

    var duration = parts[1];
    var fingerprint = parts[2];

    duration = duration.replace("DURATION=", "");
    fingerprint = fingerprint.replace("FINGERPRINT=", "");

    var hash = md5(song);

    callApi(duration, fingerprint, hash, url);
}

function callApi(duration, fingerprint, hash, url) {
    var fullUrl = apiBaseUrl+apiBaseParam+"&duration="+duration+"&fingerprint="+fingerprint;

    var res = request('GET', fullUrl);
    var resp =  res.getBody();
    var json = JSON.parse(resp.toString('utf-8'));

    // console.log(resp.toString('utf-8'));
    var recordId = json.results[0].recordings;

    //console.log(recordId);

    for(var i in recordId){
        var id = recordId[i].id;

        saveToDb(id, hash, url);

    }
}

function saveToDb(recordId, hash, url){
    //console.log(recordId, hash, url);
    var apiUrl = ownApiUrl+"?url="+url+"&mbid="+recordId+"&hash="+hash;

    //console.log(apiUrl);

    var res = request('GET', apiUrl);
    console.log(res.getBody('utf-8'))
}