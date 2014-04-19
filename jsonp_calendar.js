/**
 * JSONP Event Calendar - jsonp_calendar.js
 *
 * @author      Stephen Cox <mail@stephencox.net>
 * @version     1.3
 * @copyright   University of Oxford
 * @package     jsonp_calendar
 */

/**
 * URL to page that will handle AJAX requests
 * Edit this to point to server side script that generates data for the calendar
 * @var url
 */
var url = 'http://intranet.orient.ox.ac.uk/roombooker/json/jsonp_calendar.php';

/**
 * HTML template for a single event, enclose variables in braces {}
 * @var event_template
 */
var event_template = "\
<p>\
  {time} <strong><em>{dept}<\/em><\/strong><br \/>\
  <em>{title}<\/em><br \/>\
  {lecturers}<br \/>\
  {building}\
<\/p>";

/**
 * Message to be displayed if there are no events for the day
 * @var no_events_message
 */
var no_events_message = "\
There are no Faculty or Sub-Faculty meetings listed as taking place today.";

/**
 * Error message to display if there are problems with the JSONP call
 * @var error_message
 */
var error_message = "\
There has been a problem with the calendar!<br \/>\
Try refreshing the page, if the problem continues please contact it-support@orinst.ox.ac.uk \
giving as much detail about the problem as possible."; 

/**
 * Name for the calendar to draw, this is passed to the server to differentiate 
 * between multiple calendars. This is set by a call to init_calendar or directly
 * override this in an html script tag if required.
 * @var calendar
 */
var calendar = '';

/** 
 * Shortened names for days of week 
 * @var days_short
 */
var days_short = ['Sun','Mn','Tu','Wd','Th','Fri','Sat'];

/** 
 * Full month names
 * @var months_long
 */
var months_long = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


/**
 * Return number of days in a month
 * @function days_in_month
 * @param {int} year    Year 
 * @param {int} month   Month (0 to 11)
 * @return {int}        Number of days in the month
 */
function days_in_month(year, month) {

    var month_length = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month != 1) 
        return month_length[month];
    if (year % 4 == 0 || (year % 100 == 0 && year % 400 != 0))
        return 29;
    else
        return 28;
}


/**
 * Return the full date suitable for printing
 * @fucntion full_date
 * @param {int} year    Year 
 * @param {int} month   Month
 * @param {int} day     Day
 * @return {string}     Full date string
 */
function full_date(year, month, day) {
    
    postfix = ((day == 1) || (day == 21) || (day == 31)) ? 'st' : 
        ((day == 2) || (day == 22)) ? 'nd' :
        ((day == 3) || (day == 23)) ? 'rd' : 'th';
    month_str = months_long[month];
    return day + postfix + ' ' + month_str + ' ' + year;
}


/**
 * Initialise and draw the HTML calendar
 * @function init_calendar
 * @param {string} cal_name     Name of calendar to draw, see calendar var
 * @return {bool}               Sucessful
 */
function init_calendar(cal_name) {
    
    if (typeof(cal_name) != 'undefined')
        calendar = cal_name;
    return set_calendar();
}


/** 
 * Return the HTML calendar 
 * @function get_calendar
 * @param {int} year        Year of the calendar to produce (1900 to 2100)
 * @param {int} month       Month of the calendar to produce (0 to 11)
 * @return {string}         HTML calendar for given month and year
 */
function get_calendar(year, month) {
    
    // Check arguments
    if (month < 0 || month > 11)
        return 'Error! Month out of range.';
    if (year < 1900 || year > 2100)
        return 'Error! Year out of range!';
    
    // Data needed to create calendar
    var date = new Date(year, month, 1);
    var month_start = date.getDay();
    var month_length = days_in_month(year, month);
    var today = new Date();
    if ((today.getYear() < 1900 ? today.getYear() + 1900 : today.getYear()) == year && today.getMonth() == month)
        today = today.getDate();
    else
        today = 0;
    
    // Add calendar header
    cal_str = '<div id="cal">\n  <table>\n';
    cal_str += '    <tr class="cal-header"><th colspan="7">' + months_long[month] + ' ' + year + '<\/th><\/tr>\n';
    cal_str += '    <tr>\n';
    for (var i = 0; i < 7; i++)
        cal_str += '      <td>' + days_short[i] + '</td>\n';
    cal_str += '    <\/tr>\n';
    
    // Add days
    var d = 1;
    for (var j = 0; j < 6; j++) {
        cal_str += '    <tr>\n';
        for (i = 0; i < 7; i++) {
            if ((d == 1 && i < month_start) || (d > month_length))
                cal_str += '      <td>' + '&nbsp;' + '<\/td>\n';
            else {
                if (today == d)
                    today_cls = ' class="today"';
                else
                    today_cls = '';
                cal_str += '      <td id="day' + d + '"' + today_cls + '>' + d + '<\/td>\n';
                d++;
            }
        }
        cal_str += '    <\/tr>\n';
    }
    cal_str += '  <\/table></div>';
    
    // Add navigation
    var next_month = (month + 1) > 11 ? 0 : month + 1;
    var next_year = next_month != 0 ? year : year + 1;
    var prev_month = (month - 1) < 0 ? 11 : month - 1;
    var prev_year = prev_month != 11 ? year : year - 1;
    cal_str += "\
<div id=\"cal-nav\">\
  <span id=\"cal-nav-left\"><a onclick=\"return set_calendar(" + prev_year + ", " + prev_month + ");\" href=\"#\"><<\/a><\/span>\n\
  <span id=\"cal-nav-right\"><a onclick=\"return set_calendar(" + next_year + ", " + next_month + ");\" href=\"#\">><\/a><\/span>\n\
<\/div>\n";
    
    return cal_str;
}


/**
 * Draw the calendar in the div with id calendar
 * @function set_calendar
 * @param {string} category     Event category (sent to the server to filter results)
 * @param {int} year            Year to draw calendar for, default current year
 * @param {int} month           Month to draw calendar for, default current month
 * @return {bool}               Successful
 */
function set_calendar(year, month) {
    
    // Check arguments
    if (typeof(year) != 'undefined' && typeof(month) != 'undefined') {
        if (month < 0 || month > 11)
            return false;
        if (year < 1900 || year > 2100)
            return false;
    }
    else {
        var today = new Date();
        year = today.getYear();
        if (year < 1900)
            year += 1900;
        month = today.getMonth();
    }
    
    // Set calendar
    var cal_id = document.getElementById('calendar');
    if (cal_id)
        cal_id.innerHTML = get_calendar(year, month);
    
    // Use JSONP to set days with events on
   jsonp('type=calendar&cal=' + calendar + '&year=' + year + '&month=' + month, 'calendar_callback');
    
    // Set events
    if (today)
        set_events(year, month, today.getDate());
    
    return true;
}


/**
 * Set links for days on the calendar if events exist for those days
 * @function calendar_callback
 * @param {array} days       Array of ints of the days that events exist for
 */
function calendar_callback(json_obj) {
    
    if (!json_obj.error) {
        for (var i = 0; i < json_obj.days.length; i++) {
            var day_id = document.getElementById('day' + json_obj.days[i]);
            if (day_id) {
                var a = '<a href="#" class="event" onclick="set_events(' + json_obj.year + ', ' + json_obj.month + ', ' + json_obj.days[i] + ');">'
                a += json_obj.days[i];
                a += '<\/a>';
                day_id.innerHTML = a;
            }
        }
    }
}


/**
 * Set the events list for the specified day
 * @function set_events
 * @param {int} year        Year of events, default current year
 * @param {int} month       Month of events, default current month
 * @param {int} day         Day of month of events, default today
 * @return {bool}           Success
 */
function set_events(year, month, day) {
    
    jsonp('type=events&cal=' + calendar + '&year=' + year + '&month=' + month + '&day=' + day, 'events_callback');
}


/**
 * Set links for days on the calendar if events exist for those days
 * @function events_callback
 */
function events_callback(json_obj) {
    
    if (!json_obj.error) {
        var html = '<p class="date">' + full_date(json_obj.year, json_obj.month, json_obj.day) + '<\/p>';
        if (json_obj.events.length == 0)
            html += '<p>' + no_events_message + '<\/p>';
        else {
            for (var i = 0; i < json_obj.events.length; i++) {
                var event = event_template;
                for (var property in json_obj.events[i])
                    //alert(event);
                    event = event.replace('{'+property+'}', json_obj.events[i][property]);
                html += event + '\n';
            }
        }
    }
    else
        var html = '<p class="error">' + error_message + '<\/p>';
    var events_id = document.getElementById('events');
    if (events_id)
        events_id.innerHTML = html;
}


/**
 * JSONP function - Create a dynamically executed javscript file from remote host
 * @function jsonp
 * @param {string} query            GET query string
 * @param {string} callback_name    Name of callback function
 */
function jsonp(query, callback_name) {
    
    // Create URI to call JSONP data
    var uri = url + '?jsonp=' + callback_name;
    if (query)
        uri += '&' + query;
    uri += '&' + new Date().getTime().toString(); // prevent caching
    
    // Create script tag to execute data removing old one if present
    var script = document.getElementById(callback_name + '_id');
    if (script)
        document.body.removeChild(script);
    script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('id', callback_name + '_id');
    script.setAttribute('src', uri);
    document.body.appendChild(script);   
}


/**
 * Find the first instance of search in array returning the position of the 
 * first occurence or -1 if not found.
 * (should have been included in Array class from the start)
 * @function find
 * @param {object} search       Variable to find in array
 * @return {int}                Position of first occurrence of search or -1.
 */
Array.prototype.find = function(search) {
    
    for (var i = 0; i < this.length; i++) {
        if (this[i] == search)
            return i;
    }
    return -1;
}
    