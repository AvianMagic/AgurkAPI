import fetch from 'node-fetch'

//Here we import the necessary files for accessing google API
const {
    google
} = require('googleapis');

//These functions are called through the function calendarDist in calendar.js
//depending on which command is chosen by the user and the default application of the user
//The chosenApp parameter is a string retrieved in a users JSON-file
function calendarCreate(chosenApp, user, calendarInput) {
    switch (chosenApp) {
        case "google":
            googleCreate(user, calendarInput);
    }
}

function calendarDelete(chosenApp, user, calendarInput) {
    switch (chosenApp) {
        case "google":
            let eventName = calendarInput.eventName;
            googleDelete(user, eventName);
    }
}

function calendarEdit(chosenApp, user, calendarInput) {
    switch (chosenApp) {
        case "google":
            let originalEventName = calendarInput.originalTitle;
            googleEdit(user, originalEventName, calendarInput);
    }
}

function calendarStatus(chosenApp, user) {
    switch (chosenApp) {
        case "google":
            googleStatus(user);
    }
}

//This function enables the editing of events in any calendar by choosing the 'right' data
//and returns an object that the specific calendar app can use to edit the event
function universalEdit(title, description, location, timeString, calendarInput){
    //Object created to contain all the final informations of the event that is passed and used when editing
    var eventObject = new Object();
    
    //If-statements to determine, if the passed content is the input or the existing events' information
    if(calendarInput.title === null){
        eventObject.title = title;
    } else{
        eventObject.title = calendarInput.title;
    }
    if(calendarInput.description === null){
        eventObject.description = description;
    } else{
        eventObject.description = calendarInput.description;
    }
    if(calendarInput.location === null){
        eventObject.location = location;
    } else{
        eventObject.location = calendarInput.location;
    }

    //Taking the time string and slicing into year, month, date and minutes and then eval to convert string to code
    if(calendarInput.year === null){
        var curYear = timeString.slice(0, 4);
    } else{
        var curYear = calendarInput.year;
    }
    if(calendarInput.month === null){
        var curMonth = timeString.slice(5, 7);
    } else{
        var curMonth = calendarInput.month - 1;
    }
    if(calendarInput.date === null){
        var curDate = timeString.slice(8, 10);
    } else{
        var curDate = calendarInput.date;
    }
    if(calendarInput.hour === null){
        var curHour = timeString.slice(11, 13);
    } else{
        var curHour = calendarInput.hour;
    }
    if(calendarInput.minutes === null){
        var curMinutes = timeString.slice(20, 22);
    } else{
        var curMinutes = calendarInput.minutes;
    }
    eval(curYear, curMonth, curDate, curHour, curMinutes);

    //Following is the functionality to create google cal. events
    eventObject.eventStartTime = new Date(curYear, curMonth, curDate, curHour);

    //End event date + 45min.
    eventObject.eventEndTime = new Date(curYear, curMonth, curDate, curHour);
    eventObject.eventEndTime.setMinutes(eventObject.eventEndTime.getMinutes() + curMinutes);

    return eventObject;
}

//This function is the Google specific event create function
async function googleCreate(user, calendarInput) {
    //Here we authenticate our google credentials to access Google Calendar
    const {
        OAuth2
    } = google.auth;

    const oAuth2Client = new OAuth2(user.apps.calendar.google.clientId, user.apps.calendar.google.clientSecret);

    oAuth2Client.setCredentials({
        refresh_token: user.apps.calendar.google.refreshToken
    });

    //We call google.calendar with the required params, and assign that to a single variable for readability's sake
    const calendar = google.calendar({
        version: 'v3',
        auth: oAuth2Client
    });

    //Initiating variables with 'time' inputs from the user creating the event
    let y = calendarInput.year;
    let m = calendarInput.month - 1;
    let d = calendarInput.date;
    let h = calendarInput.hour;
    let minutes = calendarInput.minutes;

    //Following is the functionality to create google cal. events
    const eventStartTime = new Date(y, m, d, h);

    //End event date + 45min.
    const eventEndTime = new Date(y, m, d, h);
    eventEndTime.setMinutes(eventEndTime.getMinutes() + minutes);

    //Create the event (putting event in calendar)
    const event = {
        summary: calendarInput.title,
        location: calendarInput.location,
        description: calendarInput.description,
        start: {
            dateTime: eventStartTime,
            timeZone: 'Europe/Copenhagen',
        },
        end: {
            dateTime: eventEndTime,
            timezone: 'Europe/Copenhagen'
        },
        //The colorId is not necessary but is included here
        colorId: 1,
    }

    //The following code is to check if something is already in the given date in the calendar
    return calendar.freebusy.query({
        resource: {
            timeMin: eventStartTime,
            timeMax: eventEndTime,
            timeZone: 'Europe/Copenhagen',
            //items is an array of objects of calendar ID's
            items: [{
                id: 'primary'
            }],
        },
    }, (err, res) => {
        if (err) {
            console.error('Free Busy Query Error: ', err)
            return err
        }
        //Inserting any events in the time period (eventStartTime to eventEndTime) in the variable eventsArr
        const eventsArr = res.data.calendars.primary.busy;

        //If the variable eventsArr contains anything an event is in the time period
        if (eventsArr.length === 0) {
            //calendar.events.insert inserts the event specified above in the Google Calendar of the specified user
            return calendar.events.insert({
                    calendarId: 'primary',
                    resource: event
                },
                err => {
                    if (err) {
                        console.error('Calendar Event Creation Error: ', err);
                        return err
                    } else {
                        console.log('Calendar Event Created');
                        return 200
                    }
                }
            )
        }
        console.log('Sorry I am Busy');
        return 400
    })
}

async function googleDelete(user, eventName) {
    //Here we authenticate our google credentials to access Google Calendar
    const {
        OAuth2
    } = google.auth;

    const oAuth2Client = new OAuth2(user.apps.calendar.google.clientId, user.apps.calendar.google.clientSecret);

    oAuth2Client.setCredentials({
        refresh_token: user.apps.calendar.google.refreshToken
    });

    //We call google.calendar with the required params, and assign that to a single variable for readability's sake
    const calendar = google.calendar({
        version: 'v3',
        auth: oAuth2Client
    });

    var calendarEvent = await calendar.events.list({
        'calendarId': 'primary'
    })
    var params = {
        calendarId: 'primary',
        eventId: ''
    };

    //for-loop to check if any event title matches the title given by the user
    //and then assigns the event's id to params object
    for (let i = 0; i < calendarEvent.data.items.length; i++) {
        if (calendarEvent.data.items[i].summary === eventName) {
            params.eventId = calendarEvent.data.items[i].id;

            //Google Calendar function to delete an event using information stored in params object
            calendar.events.delete(params, function (err) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return 401;
                }
                console.log('Event deleted.');
                return 201
            });
            break;
        }
    }
}

async function googleEdit(user, originalEventName, calendarInput) {
    //Here we authenticate our google credentials to access Google Calendar
    const {
        OAuth2
    } = google.auth;

    const oAuth2Client = new OAuth2(user.apps.calendar.google.clientId, user.apps.calendar.google.clientSecret);

    oAuth2Client.setCredentials({
        refresh_token: user.apps.calendar.google.refreshToken
    });

    //We call google.calendar with the required params, and assign that to a single variable for readability's sake
    const calendar = google.calendar({
        version: 'v3',
        auth: oAuth2Client
    });

    var calendarEvent = await calendar.events.list({
        'calendarId': 'primary'
    })
    var params = {
        calendarId: 'primary',
        eventId: ''
    };

    //for-loop to check if any event title matches the title given by the user
    //and then assigns the event's id to params object
    for (let i = 0; i < calendarEvent.data.items.length; i++) {
        if (calendarEvent.data.items[i].summary === originalEventName) {
            params.eventId = calendarEvent.data.items[i].id;

            var event = calendarEvent.data.items[i];

            //This variable (curTime) is initiated with a time string of the event
            var timeString = event.start.dateTime;
            
            //universalEdit is called passing the information about the event as well as the inputs of the user creating the event
            //universalEdit seeks to determine what the user has edited vs. what should be kept of the existing event
            const eventObject = await universalEdit(event.summary, event.description, event.location, timeString, calendarInput);

            event  = {
                summary: eventObject.title,
                location: eventObject.location,
                description: eventObject.description,
                start: {
                    dateTime: eventObject.eventStartTime,
                    timeZone: 'Europe/Copenhagen'
                  },
                end: {
                    dateTime: eventObject.eventEndTime,
                    timeZone: 'Europe/Copenhagen'
                }
            }

            //calendar.events.update updates an event with the new informations given by the user (old event information used if user hasn't modified)
            //calendar.events.update is like insert (create) but overwrites the existing event
            calendar.events.update({
                calendarId: params.calendarId,
                eventId: params.eventId,
                resource: event
            }, function (err) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return 401;
                }
                console.log('Event updated.');
                return 201
            });
            break;
        }
    }
}

async function googleStatus(user) {
    let eventObject = new Object();
    //Here we authenticate our google credentials to access Google Calendar
    const {
        OAuth2
    } = google.auth;

    const oAuth2Client = new OAuth2(user.apps.calendar.google.clientId, user.apps.calendar.google.clientSecret);

    oAuth2Client.setCredentials({
        refresh_token: user.apps.calendar.google.refreshToken
    });

    //We call google.calendar with the required params, and assign that to a single variable for readability's sake
    const calendar = google.calendar({
        version: 'v3',
        auth: oAuth2Client
    });

    var calendarEvent = await calendar.events.list({
        'calendarId': 'primary'
    })

    //eventList is an object that contains two arrays with the titles and dates of all events in a users Google Calendar
    var eventList = {
        summaries: [],
        dates: []
    }

    var messageString = '\n'

    for (let i = 0; i < calendarEvent.data.items.length; i++) {
        eventList.summaries[i] = calendarEvent.data.items[i].summary;
        eventList.dates[i] = calendarEvent.data.items[i].start.dateTime;
        
        //Initializing variables for the current year, month, date and for the event
        var nowYear = new Date().getFullYear();
        var nowMonth = new Date().getMonth();
        var nowDate = new Date().getDate();
        //slice extracts time information from the time string of the event
        var eventYear = calendarEvent.data.items[i].start.dateTime.slice(0,4);
        var eventMonth = calendarEvent.data.items[i].start.dateTime.slice(5,7);
        var eventDate = calendarEvent.data.items[i].start.dateTime.slice(8,10);
            //The if-statement ensures that only the events from the current date and onwards are included
            if(nowYear == eventYear && nowMonth == eventMonth && nowDate == eventDate || 
                nowYear == eventYear && nowMonth < eventMonth || 
                nowYear < eventYear){

                //Creating a string of the title and dates of each event and a newline efter each entry
                //This is the string that will be presented to the user in a given interface (e.g. Discord etc.)
                var dateUnsliced = eventList.dates[i]
                var dateSliced = dateUnsliced.slice(0,10);
                messageString += eventList.summaries[i] + "   Date: " + dateSliced +"\n";
            }
    }
    await fetch('http://127.0.0.1:3191/message', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "receiver": 0,
                "sender": 0,
                "message": messageString
            })
        })
}

//exporting functions to be used in calendar.js which is importing these functions
export {
    calendarCreate,
    calendarDelete,
    calendarEdit,
    calendarStatus
}