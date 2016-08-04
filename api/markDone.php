<?php
if (!isset($_GET["url"]) || $_GET["url"] == "") {
    die("no url found");
}

$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

$url = $_GET["url"];

$url = mysqli_real_escape_string($link,$url);

$query = "UPDATE `urls` SET `done` = '1' WHERE `urls`.`url` = '".$url."'";
mysqli_query($link, $query) or die(mysqli_error($link));

mysqli_close($link);
