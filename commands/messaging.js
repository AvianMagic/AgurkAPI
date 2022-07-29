import fetch from 'node-fetch'

//Function for returning the correct format for the correct app
async function appFormatter(sender, receiver, message) {
    switch(receiver.apps.communication.primary.toLowerCase()) {
        case "slack":
            {
                return slackFormat(message, receiver, sender)
            }
        case "discord": {
            return discordFormat(message, receiver, sender)
        }
    }
}


//Function for sending message to different chat applications
async function message(sender, receiver, message) {

    let messageFormat = await appFormatter(sender, receiver, message);
    if ('credentials' in messageFormat) {
        await fetch(messageFormat.url, {
            method: "POST",
            credentials: 'include',
            headers: messageFormat.headers,
            body: JSON.stringify(messageFormat.body)
        })
    } else {
        await fetch(messageFormat.url, {
            method: "POST",
            headers: messageFormat.headers,
            body: JSON.stringify(messageFormat.body)
        })
    }
}
//Function for setting up the correct format for send a slack messagec
async function slackFormat(message, receiver, sender) {
    let slackBody = {
        channel: receiver.apps.communication.slack.channel,
        text: message,
        username: sender.info.name.full
    }
    return {
        url: "https://slack.com/api/chat.postMessage",
        headers: {
            authorization: `Bearer ${receiver.apps.communication.slack.token}`,
            "Content-Type": "application/json;charset=utf-8",
            "Content-Length": slackBody.length
        },
        body: slackBody
    }
}
//Function for setting up the correct format for sending a discord message
async function discordFormat(message, receiver, sender) {
    return {
        url: `https://discord.com/api/v9/channels/${receiver.apps.communication.discord.channel}/messages`,
        credentials: 'include',
        headers: {
            'authorization': `Bot ${receiver.apps.communication.discord.token}`,
            'authority': "discord.com",
            'Content-Type': "application/json"
        },
        body: {
            "content": `**${sender.info.name.full}**:  ${message}`,
            "tts": false,
          }

    }
}


export {message}