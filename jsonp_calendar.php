<?php
/**
 * JSONP Event Calendar - jsonp_calendar.php
 *
 * @author      Stephen Cox <mail@stephencox.net>
 * @version     1.3
 * @copyright   University of Oxford
 * @package     jsonp_calendar
 */

/**
 * Database login information
 */
$dbhost = "localhost";
$dbname = "";
$dbuser = "";
$dbpass = "";

/**
 * Send debugging information in the JSONP return
 * Set to false for production use.
 */
$debug = true;

/**
 * SQL statement to get events list from database
 * Variables :cal and :date will be replaced by the specified calendar and 
 * date respectively.
 */
$events_sql = "
SELECT 
    bookers.series_id AS id, 
    bookers.lecture AS title, 
    bookers.booker_name AS lecturers, 
    LEFT(bookings.start, 5) AS time, 
    languages.language AS dept,
    buildings.building AS building
FROM bookers
JOIN bookings ON bookers.series_id = bookings.series_id
JOIN languages ON bookers.language_id = languages.lang_id
JOIN rooms ON bookings.room_id = rooms.room_id
JOIN buildings ON rooms.building_id = buildings.building_id
WHERE bookers.subject_id = :cal 
    AND bookings.date = :date
ORDER BY time ASC;";

/**
 * SQL statement to get the days with events on in a month
 * Variables :cal, :month_start and :month_end will be replaced by the 
 * specified calendar and the month's start and end dates respectively.
 */
$calendar_sql = "
SELECT DISTINCT DAYOFMONTH(bookings.date) AS days 
FROM bookings 
JOIN bookers ON bookings.series_id = bookers.series_id 
WHERE bookers.subject_id = :cal  
    AND bookings.date >= :month_start 
    AND bookings.date < :month_end 
ORDER BY days ASC;";

/**
 * JavaScript callback functions
 * Included as a security check.
 */
$callbacks = array('calendar_callback', 'events_callback');


/**
 * Main PHP code
 */

// Validate GET options
$errors = array();
$error = 0;
$callback = $_GET['jsonp'];
if ($_GET['type'] == 'calendar' or $_GET['type'] == 'events') {
    $type = 'calendar';
    // Validate jsonp
    if (isset($_GET['jsonp']) and is_string($_GET['jsonp']) and in_array($_GET['jsonp'], $callbacks)) {
        $callback = $_GET['jsonp'];
    }
    else {
        $errors['jsonp'] = "Invalid callback function name: {$_GET['jsonp']}";
        $error = 1;
    }
    // Validate cal
    if (isset($_GET['cal']) and is_string($_GET['cal']) and strlen($_GET['cal']) < 255) {
        $cal = mysql_escape_string($_GET['cal']);
    }
    else {
        $errors['cal'] = "Invalid calendar: {$_GET['cal']}";
        $error = 1;
    }
    // Validate year
    if (isset($_GET['year']) and is_int((int) $_GET['year']) and $_GET['year'] > 1900 and $_GET['year'] < 2100) {
        $year = (int) $_GET['year'];
    }
    else {
        $errors['year'] = "Invaild year: {$_GET['year']}";
        $error = 1;
    }
    // Validate month
    if (isset($_GET['month']) and is_int((int) $_GET['month']) and $_GET['month'] >= 0 and $_GET['month'] < 12) {
        $month = 1 + (int) $_GET['month'];
    }
    else {
        $errors['month'] = "Invaild month: {$_GET['month']}";
        $error = 1;
    }
    if ($_GET['type'] == 'events') {
        $type = 'events';
        // Validate month
        if (isset($_GET['day']) and is_int((int) $_GET['day']) and $_GET['day'] > 0 and $_GET['day'] < 32) {
            $day = (int) $_GET['day'];
        }
        else {
            $errors['day'] = "Invaild day: {$_GET['day']}";
            $error = 1;
        }
    }
}
else {
    $errors['type'] = "Invalid type: {$_GET['type']}";
    $error = 1;
}

// Query database
if (!$error) {
    // Open DB connection
    try {
        $dsn = "mysql:host={$dbhost};dbname={$dbname}";
        $options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'); 
        $pdo = new PDO($dsn, $dbuser, $dbpass, $options);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } 
    catch (PDOException $e) {
        $errors['database']  = "Database Error: ". $e->getMessage();
        $error = 1;
    }
    
    if (!$error) {
        // Get the days events
        if ($type == 'events') {
            $date = $year.'-'.($month < 10 ? '0'.$month : $month ).'-'.($day < 10 ? '0'.$day : $day);
            $params = array('cal' => $cal, 
                            'date' => $date);
            try {
                $stmt = $pdo->prepare($events_sql);
                $stmt->execute($params);
                $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            catch (PDOException $e) {
                $errors['query'] = "Database Error: ". $e->getMessage();
                $error = 1;
            }
        }
        
        // Get days in the month with events on
        elseif ($type == 'calendar') {
            $month_start = $year.'-'.($month < 10 ? '0'.$month : $month).'-01';
            $month_end = $year.'-'.($month + 1 % 12 < 10 ? '0' : '').($month + 1 % 12).'-01';
            $params = array('cal' => $cal, 
                            'month_start' => $month_start, 
                            'month_end' => $month_end);
            try {
                $stmt = $pdo->prepare($calendar_sql);
                $stmt->execute($params);
                $days = $stmt->fetchAll(PDO::FETCH_NUM);
            }
            catch (PDOException $e) {
                $errors['query'] = "Database Error: ". $e->getMessage();
                $error = 1;
            }
        }
    }
}

// Encode objects to JSONP
$jsonp_str = "{$callback}(\n{";
$jsonp_str .= "\n  \"error\" : {$error}";
if ($debug) {
    $jsonp_str .= ",\n  \"errors\" : ".json_encode($errors);
    $jsonp_str .= ",\n  \"server\" : ".json_encode($_SERVER);
    if ($type == 'events')
        $jsonp_str .= ",\n  \"sql\" : ".json_encode($events_sql);
    elseif ($type == 'calendar')
        $jsonp_str .= ",\n  \"sql\" : ".json_encode($calendar_sql);
    $jsonp_str .= ",\n  \"params\" : ".json_encode($params);
}
if (!$error) {
    $jsonp_str .= ",\n  \"calendar\" : ".json_encode($cal);
    $jsonp_str .= ",\n  \"year\" : ".json_encode($year);
    $jsonp_str .= ",\n  \"month\" : ".json_encode($month - 1);
    if ($type == 'calendar') {
        $jsonp_str .= ",\n  \"days\" : ".json_encode($days);
    }
    elseif ($type == 'events') {
        $jsonp_str .= ",\n  \"day\" : ".json_encode($day);
        $jsonp_str .= ",\n  \"events\" : ".json_encode($events);
    }
}
$jsonp_str .= "\n}\n);";

// Return JSONP string
header("Content-Type: text/javascript; charset=utf-8");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
echo $jsonp_str;

?>
