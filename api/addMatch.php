<?php
    if(isset($_GET["url"]) && $_GET["url"] != ""){
    	$url = $_GET["url"];
    }else{
    	die("no url");
    }

    if(isset($_GET["mbid"]) && $_GET["mbid"] != ""){
    	$mbid = $_GET["mbid"];
    }else{
    	die("no mbid");
    }

    if(isset($_GET["hash"]) && $_GET["hash"] != ""){
        $hash = $_GET["hash"];
    }else{
        die("no hash");
    }

//    echo $url."<br>";
//    echo $mbid."<br>";
//   echo $hash."<br>";
$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

//escaping that ?

$url = mysqli_real_escape_string($link,$url);
$mbid = mysqli_real_escape_string($link,$mbid);
$hash = mysqli_real_escape_string($link,$hash);


$uniqueQuery = "SELECT * FROM `matches` WHERE `mbid` = '".$mbid."' AND `url` = '".$url."' AND `hash` = '".$hash."'";
$uniqueResult = mysqli_query($link, $uniqueQuery) or die(mysqli_error($link));

if(mysqli_num_rows($uniqueResult) == 0) {
    $query = "INSERT INTO `matches` (`id`, `mbid`, `url`, `hash`) VALUES (NULL, '".$mbid."', '".$url."', '".$hash."');";
    $result = mysqli_query($link, $query) or die(mysqli_error($link));
    die("added");
}else
    die("duplicate");