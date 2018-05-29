'use strict';

const request = require('sync-request');
const linkscrape = require('linkscrape');
const fs = require('fs');
const execSync = require('child_process').execSync;
const md5 = require('md5');
const urlParse = require('url');

// --------------------------------------------------------------------------

const acoustidKey = 'RPP8Za7Vnd';
const acoustidUrl = 'http://api.acoustid.org/v2/lookup';
const acoustidParam = '?client=' + acoustidKey + '&format=json&meta=recordingids';

//const ownDomain = "http://cwms.cc/audioCrawl/api/";
const ownDomain = 'http://localhost/audioCrawl/api/';

const addMatchApi = ownDomain + 'addMatch.php';
const addUrlApi = ownDomain + 'addUrl.php';
const getTaskApi = ownDomain + 'getTask.php';
const markDoneApi = ownDomain + 'markDone.php';
const noMatchApi = ownDomain + 'noMatch.php';


const includeExt = ['mp3', 'htm', 'html', 'php', 'asp', 'jsp', 'mhtml', 'shtml', 'aspx', 'ashx', 'cgi', 'cshtml', 'jspx', 'phtml', 'xhtml', 'html5'];
//const ignoredExt = ["jpeg", "css", "deb", "sig", "mov", "rss", "vcf", "gpg", "JPG", "m4a", "rpm", "xml", "jpg", "gif", "pdf", "png", "mp4", "uts", "atom", "wmv", "avi", "wma", "flac", "db", "tar", "gz", "bz2", "ini", "flv", "txt", "doc", "docx", "iso", "zip", "exe", "rtf", "cab", "bmp"];

start();

// --------------------------------------------------------------------------

function start() {
  while (true) {
    const url = getTaskApiCall();

    parseUrl(url);
    markDoneApiCall(url);
  }
}

function getPage(url) {
  console.log('downloading: ' + url);
  const res = request('GET', url);
  if (res.statusCode !== 200) {
    throw 'error received while fetching page: ' + res.statusCode;
  }

  return res.getBody().toString('utf-8');
}

function parseUrl(url) {
  const mp3Regex = /.+?\.mp3$/gim;
  if (mp3Regex.test(url)) {
    // console.log("it is a mp3");
    getSongs(url);
  } else {
    try {
      const page = getPage(url);
      linkscrape(url, page, function (links, $) {
        for (const i in links) {
          const link = links[i].link;
          if (link === null) {
            continue;
          }
          addUrl(link);
        }
      });
    } catch (e) {
      console.log(e);
      markDoneApiCall(url);
    }
  }
}


function addUrl(url) {
  // console.log("it is a normal url");
  const path = urlParse.parse(url).pathname;
  let isGood = false;
  for (const i in includeExt) {
    const ext = includeExt[i];
    const extRegex = new RegExp('/.+?\.' + ext + '$');
    if (extRegex.test(url)) {
      isGood = true;
      //console.log("found good extention: "+ ext);
    }
  }

  if (path === null) {
    isGood = true;
    //console.log("is root: "+ url);
  }

  if (!isGood && path.substr(-1) === '/') {
    isGood = true;
    //console.log("ended on /");
  }

  if (!isGood && path.indexOf('.') === -1) {
    isGood = true;
    //console.log("no points in the path");
  }

  if (path !== null && path.indexOf('mailto:') === -1) {
    isGood = false;
    //console.log("mail to found");
  }

  if (isGood) {
    console.log('adding url to db');
    addUrlApiCall('{"urls":["' + url + '"]}');
  } else {
    //console.log("ended on : " + path.substr(-4))
  }
}

function getSongs(url) {
  console.log('downloading mp3: ' + url);
  const res = request('GET', url);
  if (res.statusCode !== 200) {
    console.log('error received while fetching mp3: ' + res.statusCode);
    return;
  }

  const song = res.getBody();

  fs.writeFileSync('test.mp3', song);

  console.log('calculating fingerprint');
  let result = '';
  try {
    result = execSync('fpcalc test.mp3');
  } catch (e) {
    //console.log(e);
    markDoneApiCall(url);
    return;
  }

  const string = result.toString('utf-8');
  const parts = string.split('\n');

  const duration = parts[1].replace('DURATION=', '');
  const fingerprint = parts[2].replace('FINGERPRINT=', '');


  const hash = md5(song);

  findSong(duration, fingerprint, hash, url);
}

function findSong(duration, fingerprint, hash, url) {
  const recordIds = acoustidApiCall(duration, fingerprint);

  if (recordIds.length === 0) {
    console.log('no matches found');
    noMatchApiCall(url);
    return;
  }

  console.log('adding ' + recordIds.length + ' matches to the db');

  for (const i in recordIds) {
    const mbid = recordIds[i].id;

    addMatchApiCall(url, mbid, hash);
  }
}

// --------------------------------------------------------------------------
// api calls

function addMatchApiCall(urls, mbid, hash) {
  const url = addMatchApi + '?url=' + urls + '&mbid=' + mbid + '&hash=' + hash;

  const res = request('GET', url);
  if (res.statusCode !== 200) {
    throw 'error received from own server: ' + res.statusCode;
  }
}

function addUrlApiCall(urls) {
  const url = addUrlApi + '?urls=' + urls;

  const res = request('GET', url);
  if (res.statusCode !== 200) {
    throw 'error received from own server: ' + res.statusCode;
  }
  //console.log(res.getBody().toString("utf-8"));
}

function getTaskApiCall() {
  const res = request('GET', getTaskApi);
  if (res.statusCode !== 200) {
    throw 'error received from own server: ' + res.statusCode;
  }

  const body = res.getBody().toString('utf-8');

  return JSON.parse(body).url;
}

function markDoneApiCall(urls) {
  const url = markDoneApi + '?url=' + urls;

  const res = request('GET', url);
  if (res.statusCode !== 200) {
    throw 'error received from own server: ' + res.statusCode;
  }
}

function noMatchApiCall(urls) {
  const url = noMatchApi + '?url=' + urls;

  const res = request('GET', url);
  if (res.statusCode !== 200) {
    throw 'error received from own server: ' + res.statusCode;
  }
}

function acoustidApiCall(duration, fingerprint) {
  const fullUrl = acoustidUrl + acoustidParam + '&duration=' + duration + '&fingerprint=' + fingerprint;

  const res = request('GET', fullUrl);

  if (res.statusCode !== 200) {
    throw 'error received from acoustid server: ' + res.statusCode;
  }

  const resp = res.getBody();
  const json = JSON.parse(resp.toString('utf-8'));

  console.log(json);

  if (json.results.length === 0) {
    return [];
  }

  if (json.results.length === 1) {
    return json.results;
  }

  return json.results[0].recordings;
}
