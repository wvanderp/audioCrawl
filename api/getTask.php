<?php
//this script returns a url that needs to be crawled
error_reporting(-1);
ini_set('display_errors', true);

$link = mysqli_connect("localhost", "root", "", "audiocrawl") or die(mysqli_error($link));

$query = "SELECT * FROM `urls` ORDER BY RAND() limit 1;";

$resp = mysqli_query($link, $query) or die(mysqli_error($link));
$arr = mysqli_fetch_assoc($resp);

// $arr = array();
// while ($row = mysqli_fetch_assoc($resp)) {
//     $arr[] = $row["url"];
// }

// var_dump($resp);
// var_dump($arr);


echo json_encode($arr);