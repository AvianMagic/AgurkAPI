//Imports
import "dotenv/config";
import express from "express";
import fs from "node:fs";
import { message } from "./commands/messaging.js";
import { UniversalKanban } from "./commands/kanban.js";
import { calendarDist } from "./commands/calendar.js";
const ejs = require("ejs");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const publicDir = path.join(__dirname + "/public/");

//Initial Express Application
const app = express();

//User DataBase
let Users = [];
const userDir = __dirname + "/data/";
const userFiles = fs.readdirSync(userDir);
for (const userFile of userFiles) {
    Users.push(JSON.parse(fs.readFileSync(path.join(userDir, userFile))));
}

//Functional Applications
let Apps = {
    communication: ["discord", "slack"],
    kanban: ["trello", "gitkraken"],
    calendar: ["google"],
};

/////////////////////////
///EXPRESS MIDDLEWARE///
///////////////////////

//express.json() allows for passing json files in req.
app.use(express.json());

//bodyParser middleware allows for passing bodies in url. (Used in Login form)
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);

//session makes unique session id's possible
app.use(
    session({
        secret: "Keep it secret",
        name: "uniqueSessionID",
        saveUninitialized: false,
    })
);

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//using the EJS view engine. Allows for inline javascript with imported variables and objects. (Used for Dynamic HTML)
app.set("view engine", "ejs");

//////////////////////////
///     ENDPOINTS     ////
//////////////////////////

//GET ENDPOINT: HOMEPAGE, REDIRECT TO DASHBOARD IF LOGGED IN.
app.get("/", (req, res) => {
    //If user is logged in, redirect to dashboard
    if (req.session.loggedIn) {
        res.redirect("dashboard");
    } else {
        //Render homepage
        res.render(path.join(publicDir + "index.ejs"));
    }
});

//GET ENDPOINT: LOGIN, RENDERS THE LOGIN PAGE.
app.get("/login", (req, res) => {
    //Render login page
    if (req.session.loggedIn) {
        res.redirect("dashboard");
    } else {
        res.render(path.join(publicDir + "login.ejs"));
    }
});

//GET ENDPOINT: REGISTER, RENDERS THE REGISTRATION PAGE.
app.get("/register", (req, res) => {
    //Render login page
    if (req.session.loggedIn) {
        res.redirect("dashboard");
    } else {
        res.render(path.join(publicDir + "register.ejs"));
    }
});

//POST ENDPOINT: REGISTER, CREATES THE USER FROM THE REGISTRATION FORM AT THE GET ENDPOINT
app.post("/register", async (req, res) => {
    //Create a new user object from the provided information at registration.
    let emailExists = 0;
    for (let user of Users) {
        if (user.info.email == req.body.email) {
            emailExists = 1;
            break;
        }
    }
    if (!emailExists) {
        let newUser = {
            id: Users.length,
            info: {
                name: {
                    first: req.body.firstName,
                    last: req.body.lastName,
                    full: req.body.firstName + " " + req.body.lastName,
                },
                email: req.body.email,
                password: req.body.password[0],
            },
            apps: {
                communication: {},
                kanban: {},
                calendar: {},
            },
        };
        //Push the new user to the Users array.
        Users.push(newUser);

        //Create a unique JSON file for the new user.
        fs.writeFile(
            path.join(userDir, `user${newUser.id}.json`),
            JSON.stringify(newUser, null, 4),
            (err) => {
                if (!err) {
                    console.log("done");
                }
            }
        );

        //Initialize a session for the new user.
        req.session.loggedIn = true;
        req.session.username = req.body.email;
        req.session.user = newUser;

        //Redirect to the dashboard
        res.redirect("dashboard");
    }

    if (emailExists) {
        let alert = `<script> alert("EMAIL IS ALREADY USED!"); window.location =  'register'; </script>`;
        return res.send(alert);
    }
});

//POST ENDPOINT: CREATEGROUP, HANDLES CREATING A NEW GROUP
app.post("/createGroup", async (req, res) => {
    let newGroup = Array.from(Array(6), () =>
        Math.floor(Math.random() * 36).toString(36)
    ).join("");
    let idExists = 0;
    do {
        for (let user of Users) {
            if (newGroup == user.groupId) {
                idExists = 1;
                newGroup = Array.from(Array(6), () =>
                    Math.floor(Math.random() * 36).toString(36)
                ).join("");
            }
        }
    } while (idExists == 1);

    if (typeof Users[req.session.user.id].groupId == "undefined") {
        Users[req.session.user.id].groupId = newGroup;
        req.session.user = Users[req.session.user.id];
        fs.writeFile(
            path.join(userDir, `user${req.session.user.id}.json`),
            JSON.stringify(Users[req.session.user.id], null, 4),
            (err) => {
                if (!err) {
                    console.log("done");
                    res.send({
                        res: "CREATED GROUP",
                    });
                }
            }
        );
    }
});

//POST ENDPOINT: JOINGROUP, HANDLES JOINING AN EXISTING GROUP
app.post("/joinGroup", async (req, res) => {
    let found = 0;
    for (let user of Users) {
        if (req.body.groupId == user.groupId) {
            Users[req.session.user.id].groupId = req.body.groupId;
            req.session.user = Users[req.session.user.id];
            fs.writeFile(
                path.join(userDir, `user${req.session.user.id}.json`),
                JSON.stringify(Users[req.session.user.id], null, 4),
                (err) => {
                    if (!err) {
                        res.redirect("dashboard");
                    }
                }
            );
            found = 1;
            break;
        }
    }
    if (found == 0) {
        let alert = `<script> alert("GROUP ID DOESN'T EXIST"); window.location =  'dashboard'; </script>`;
        return res.send(alert);
    }
});

//DELETE ENDPOINT: LEAVEGROUP, HANDLES LEAVING A GROUP
app.delete("/leaveGroup", async (req, res) => {
    if (typeof Users[req.session.user.id].groupId != "undefined") {
        delete Users[req.session.user.id].groupId;
        req.session.user = Users[req.session.user.id];

        fs.writeFile(
            path.join(userDir, `user${req.session.user.id}.json`),
            JSON.stringify(Users[req.session.user.id], null, 4),
            (err) => {
                if (!err) {
                    console.log("done");
                    res.send({
                        res: "LEFT GROUP",
                    });
                }
            }
        );
    }
});

//POST ENDPOINT: ADDAPPLICATION, HANDLES ADDING AN APPLICATION TO A USER ACCOUNT.
app.post("/addApplication", async (req, res) => {
    //If the provided application name is slack or discord, add the application as a communication app
    if (!Users[req.session.user.id]["apps"]) {
        Users[req.session.user.id].apps = {
            communication: {},
            kanban: {},
            calendar: {},
        };
    }

    //Add the application to the current users applications
    //Communication Applications
    if (req.body.appName.toLowerCase() == "discord") {
        let Discord = {
            discord: {
                appName: req.body.appName,
                token: req.body.token,
                channel: req.body.channelId,
            },
        };
        if (
            typeof Users[req.session.user.id].apps.communication.primary ==
            "undefined"
        ) {
            Users[req.session.user.id].apps.communication.primary = "discord";
        }
        Object.assign(Users[req.session.user.id].apps.communication, Discord);
    } else if (req.body.appName.toLowerCase() == "slack") {
        let Slack = {
            slack: {
                appName: req.body.appName,
                token: req.body.token,
                channel: req.body.channelId,
            },
        };
        if (
            typeof Users[req.session.user.id].apps.communication.primary ==
            "undefined"
        ) {
            Users[req.session.user.id].apps.communication.primary = "slack";
        }
        Object.assign(Users[req.session.user.id].apps.communication, Slack);
    }
    //Kanban Application
    if (req.body.appName.toLowerCase() == "trello") {
        let Trello = {
            trello: {
                appName: req.body.appName,
                token: req.body.token,
                key: req.body.key,
            },
        };
        if (
            typeof Users[req.session.user.id].apps.kanban.primary == "undefined"
        ) {
            Users[req.session.user.id].apps.kanban.primary = "trello";
        }
        Object.assign(Users[req.session.user.id].apps.kanban, Trello);
    } else if (req.body.appName.toLowerCase() == "gitkraken") {
        let GitKraken = {
            gitkraken: {
                appName: req.body.appName,
                token: req.body.token,
                key: req.body.key,
            },
        };
        if (
            typeof Users[req.session.user.id].apps.kanban.primary == "undefined"
        ) {
            Users[req.session.user.id].apps.kanban.primary = "gitkraken";
        }
        Object.assign(Users[req.session.user.id].apps.kanban, GitKraken);
    }

    //Calendar Applications
    if (req.body.appName.toLowerCase() == "google") {
        let GoogleCalendar = {
            google: {
                appName: req.body.appName,
                refreshToken: req.body.refreshToken,
                clientID: req.body.clientID,
                clientSecret: req.body.clientSecret,
            },
        };
        if (
            typeof Users[req.session.user.id].apps.calendar.primary ==
            "undefined"
        ) {
            Users[req.session.user.id].apps.calendar.primary = "google";
        }
        Object.assign(Users[req.session.user.id].apps.calendar, GoogleCalendar);
    }

    //Update the users JSON file with the new application
    fs.writeFile(
        path.join(userDir, `user${req.session.user.id}.json`),
        JSON.stringify(Users[req.session.user.id], null, 4),
        (err) => {
            if (!err) {
                console.log("done");
            }
        }
    );

    //Update the session user with the new information
    req.session.user = Users[req.session.user.id];
    res.redirect("dashboard");
});

//POST ENDPOINT: MESSAGE, HANDLES MESSAGING BETWEEN APPLICATIONS.
//Users are to provide a sender, receiver and a message to send a message to another user.
//message function uses the User database to determine the correct messaging application and
//converts the users input into the correct format and posts the information to the correct API.
app.post("/message", async (req, res) => {
    //Declaration of variables for the receiver and sender
    let receiver;
    let sender;

    //Go through the Users array and find the correct user for the receiver
    for (let user of Users) {
        if (user.id === req.body.receiver) {
            receiver = user;
        }
    }

    //Go through the Users array and find the correct user for the sender
    for (let user of Users) {
        if (user.id === req.body.sender) {
            sender = user;
        }
    }

    //Calls the messaging function for sending the message to the correct platform with the correct format.
    message(sender, receiver, req.body.message);
    res.end();
});

//POST ENDPOINT: LOGIN, LOGIN IN TO THE USER WITH GIVEN INFORMATION
//FROM THE LOGIN FORM AT THE GET ENDPOINT
app.post("/login", async (req, res) => {
    //Declaration of variable to contain the found user
    let foundUser;

    //Find a user containing the provided email.
    for (let user of Users) {
        if (req.body.email === user.info.email) foundUser = user;
    }

    //If a user is found, and the password matches the found users password
    //Log the user into a session and redirect to the dashboard
    if (foundUser && req.body.password == foundUser.info.password) {
        req.session.loggedIn = true;
        req.session.username = req.body.email;
        req.session.user = Users[foundUser.id];
        return res.redirect("dashboard");
    }
    //If a user is not found, or the password doesn't match, Provide, invalid password.
    else if (!foundUser || req.body.password !== foundUser.info.password) {
        return res.send("Invalid email or password");
    }
});

app.get("/guide", async (req, res) => {
    if (req.session.loggedIn) {
        //res.send(`Welcome back, ${req.session.user.info.name.first}!`)
        res.render(path.join(publicDir + "guide.ejs"), {
            user: Users[req.session.user.id],
            error: req.query.error,
        });
    } else if(!req.session.loggedIn){
        //If the user is not logged in, redirect to the login page.
        return res.redirect("");
    }
});

//GET ENDPOINT: DASHBOARD, SHOWS THE DASHBOARD WITH USER INFORMATION
//HERE THE USER CAN ADD AN APPLICATION TO THEIR ACCOUNT
app.get("/dashboard", async (req, res) => {
    //Declaration of an object to contain any application the user might not have added to their account
    let missingApps = {
        communication: [],
        kanban: [],
        calendar: [],
    };

    let availableApps = {
        communication: [],
        kanban: [],
        calendar: [],
    };
    //If the user is logged in, look for any missing applications.
    if (req.session.loggedIn) {
        for (let app of Apps.communication) {
            if (!req.session.user.apps.communication.hasOwnProperty(app)) {
                if (!missingApps.communication.includes(app)) {
                    missingApps.communication.push(app);
                }
            } else {
                availableApps.communication.push(app);
            }
        }
        for (let app of Apps.calendar) {
            if (!req.session.user.apps.calendar.hasOwnProperty(app)) {
                if (!missingApps.calendar.includes(app)) {
                    missingApps.calendar.push(app);
                }
            } else {
                availableApps.calendar.push(app);
            }
        }
        for (let app of Apps.kanban) {
            if (!req.session.user.apps.kanban.hasOwnProperty(app)) {
                if (!missingApps.kanban.includes(app)) {
                    missingApps.kanban.push(app);
                }
            } else {
                availableApps.kanban.push(app);
            }
        }
        console.log(availableApps)
        //Render the dashboard with missingApps, availableApps and possible error codes.
        res.render(path.join(publicDir + "dashboard.ejs"), {
            user: Users[req.session.user.id],
            missingApps: missingApps,
            availableApps: availableApps,
            error: req.query.error,
        });
    } else {
        return res.redirect("/");
    }
});

//GET ENDPOINT: LOGOUT, LOGS THE USER OUT OF THE SESSION.
app.get("/logout", async (req, res) => {
    //If the user is logged in, log the user out.
    req.session.destroy();
    //Render a logout splash screen.
    res.render(path.join(publicDir + "logout.ejs"));
});
//POST ENDPOINT: MAKEPRIMARY, SETS AN APPLICATION AS PRIMARY
app.post("/makePrimary", async (req, res) => {
    if (req.body.category === "communication") {
        Users[req.session.user.id].apps.communication.primary = req.body.app;
    } else if (req.body.category === "kanban") {
        Users[req.session.user.id].apps.kanban.primary = req.body.app
    } else if(req.body.category === 'calendar') {
        Users[req.session.user.id].apps.calendar.primary = req.body.app
    }
    fs.writeFile(
        path.join(userDir, `user${req.session.user.id}.json`),
        JSON.stringify(Users[req.session.user.id], null, 4),
        (err) => {
            if (err) {
                console.log(err);
            }
        }
    );

    //Update the session user with the new information
    req.session.user = Users[req.session.user.id];
    res.send({
        res: "test",
    });
});

//POST ENDPOINT: CALENDAR, HANDLES CALENDAR FUNCTIONALITIES
app.post("/calendar", async (req, res) => {
    await calendarDist(req.body.data, Users[req.body.data.userId], Users);
    res.end();
});

//POST ENDPOINT: KANBAN, HANDLES KANBAN FUNCTIONALITIES
app.post("/kanban", async (req, res) => {
    let modes = [
        "create",
        "delete",
        "edit",
        "getBoard",
        "groupcreate",
        "groupdelete",
        "groupedit",
    ];
    if (modes.includes(req.body.mode)) {
        res.send(
            await UniversalKanban(
                req.body.mode,
                req.body.payload,
                Users[req.body.userID],
                Users
            )
        );
    } else console.error("ERROR! Unknown Kanban Mode");
});

//BIND AND LISTEN FOR CONNECTIONS ON SPECIFIED PORT
var listener = app.listen(process.env.PORT, () => {
    console.log(
        `AgurkAPI is listening on http://localhost:${listener.address().port}!`
    );
    console.log("Find it at: https://fs-21-sw-2-a305.p2datsw.cs.aau.dk/node1/");
});
