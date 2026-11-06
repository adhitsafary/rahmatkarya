<?php
$url = "https://103.30.147.68:2083/execute/Mysql/create_database?name=netdigi1_billing3";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "netdigi1:9V2)2#aboc8ZOX");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
echo "HTTP code: $code\n";
echo "Curl error: $err\n";
echo "Response: " . substr($res, 0, 500) . "\n";
