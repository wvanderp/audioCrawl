<?php
if (!isset($_GET["url"]) || $_GET["url"] == "") {
    die("no url found");
}

$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

$url = $_GET["url"];

$query = "DELETE FROM `urls` WHERE `urls`.`url` = ".$url;
mysqli_query($link, $query) or die(mysqli_error($link));

mysqli_close($link);
