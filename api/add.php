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

    echo $url."<br>";
    echo $mbid."<br>";

    //$link = mysqli_connect("localhost", "root", "root", "audioCrawl");



?>