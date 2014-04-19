# jsonp_calendar

__Do you have a calendar stored in a MySQL database in one domain that you would
like to display on a webpage in a different domain?__

If so, jsonp_calendar is for you.

jsonp_calendar is designed to get around the same-origin policy that restricts
the use of Ajax calls to servers in different domains.

To install, put the PHP file on the calendar server with Apache and PHP
installed, adding the database login details and editing the SQL statements in
the top of the file for your specific database. There are two SQL statements;
one for finding thhe days in a month with events on and one to get the events
for a particular day. Add the JS and CSS files to your webpage, change the url
in the JS file to the location of the PHP script and template string to the
reflect the names of the variables that will be returned in the JSON. The CSS
file controls how the calendar will look on the webpage.

Once the CSS and JS files have been added to your webpage, add two divs to the
page with ids calendar and events, and call the calendar_init JavaScript
function. See the jsonp_calendar.html file for an example.
