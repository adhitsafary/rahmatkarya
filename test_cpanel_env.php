<?php
header('Content-Type: text/plain');
echo "PHP Version: " . phpversion() . "\n";
echo "Tar command: ";
@exec("tar --version", $tarOut, $tarRet);
echo ($tarRet === 0 ? "Available (" . $tarOut[0] . ")" : "Not available") . "\n";

echo "MySQL CLI: ";
@exec("mysql --version", $myOut, $myRet);
echo ($myRet === 0 ? "Available (" . $myOut[0] . ")" : "Not available") . "\n";

echo "Gzip command: ";
@exec("gzip --version", $gzOut, $gzRet);
echo ($gzRet === 0 ? "Available (" . $gzOut[0] . ")" : "Not available") . "\n";
