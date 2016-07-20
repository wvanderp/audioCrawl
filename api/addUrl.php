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
"Imdb.com", "github.com", "kat.cr"];

if (!isset($_GET["urls"]) || $_GET["urls"] == "") {
    die("no urls found");
}

$urls = json_decode($_GET["urls"], true)["urls"];
$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

var_dump($urls);

die();
//$urls = ["https://stackoverflow.com/questions/369602/delete-an-element-from-an-array",
//    "https://en.wikipedia.org/wiki/Sledgehammer_(Rihanna_song)",
//    "http://cwms.cc/youtube-rss/",
//    "http://cwms.cc/",
//    "http://cwms.cc/",
//    "https://github.com/wvanderp/tpb-scrape/tree/master/api"];

foreach ($urls as $url) {
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
    $query .= "('".$url."'), ";
}

$query = substr($query,0, strlen($query)-2);
$query .= ";";

mysqli_query($link, $query) or die(mysqli_error($link));
