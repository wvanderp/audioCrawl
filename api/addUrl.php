<?php
$unwanted = [
".gov", "www.youtube.com", "www.facebook.com",
"facebook.com", "youtube.com", "linkedin.com",
"www.linkedin.com", "blogger.com", "www.blogger.com",
"twitter.com", "www.twitter.com", "ebay.com",
"www.ebay.com", "amazon", "www.amazong.com",
"wikipedia.org", "google", "gmail.com", "nu.nl", 
"Baidu.com", "Yahoo.com", "Live.com", 
"Bing.com", "Instagram.com", "Vk.com",
"Yandex.ru", "Reddit.com", "Pinterest.com", "Netflix.com",
"Onclickads.net", "Wordpress.com", "Imgur.com",
"Stackoverflow.com", "Apple.com", "Aliexpress.com",
"Imdb.com", "github.com", "kat.cr", "wordpress.org", 
"zenfolio.com", "walmart.com", "mattel.com", 
"wikimedia.org", "mediawiki.org", "teamliquid.net",
"blizzard.com", "gmane.org", "archive.org",
 "wikimediafoundation.org", "wikidata.org", "youtu.be", 
 "mailto:", "freenode.net", "translatewiki.net",
 "fsf.org", "meetup.com", "gnu.org", "unicorncloud.org",
 "yzu.edu.tw", "/gnu/", "/linuxmint/", "ubuntu.com"
 "/releases/", "oreilly.com", "w3.org", "creativecommons.org",
 "businessinsider.com", "mirror.", "vimeo.com", "open-source-box.org",
 "catchpoint.com", "speakerdeck.com", "ftp.hawo.stw.uni-erlangen.de",
 "goo.gl", "gnupress.org"];

if (!isset($_GET["urls"]) || $_GET["urls"] == "") {
    die("no urls found");
}


$urls = json_decode($_GET["urls"], true)["urls"];
$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

// var_dump($urls);

foreach ($urls as $url) {
	$url = mysqli_real_escape_string($link,$url);

    if(strlen($url) > 2000){
        $urls = array_diff($urls, [$url]);
        break;
    }


	foreach ($unwanted as $domain) {
		if (strstr(strtolower($url), strtolower($domain))) {
			$urls = array_diff($urls, [$url]);
			break;
		}
	}
}

$query = "INSERT IGNORE INTO urls VALUES ";

foreach ($urls as $url) {
    $query .= "('".$url."', 0), ";
}

$query = substr($query,0, strlen($query)-2);
$query .= ";";
// echo($query);
mysqli_query($link, $query) or die(mysqli_error($link));

mysqli_close($link);
