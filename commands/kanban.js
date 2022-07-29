import fetch from "node-fetch";
import {
    getKrakenList,
    getTrelloList,
    getTrelloCard,
    getKrakenCard,
} from "./groupkanban.js";

/////////////////////////////////////////////////////////////
//              Payload Format                             //
//                                                         //
// {                                                       //
//     "mode":"groupdelete",                               //
//     "userID":0,                                         //
//     "payload": {                                        //
//         "cardName":"Card Name",                         //
//         "listName":"List name"                          //
//         "editParams":{                                  //
//             "title":"New Title / New Card Name",        //
//             "desc":"New Description",                   //
//             "archive":"Archive card (TRUE / FALSE)",    //
//             "listName":"New List Name to place card"    //
//         }                                               //
//     }                                                   //
// }                                                       //
//                                                         //
//                                                         //
/////////////////////////////////////////////////////////////




//FUNCTIONS FOR TRELLO
//RETURNS AN OBJECT WITH CORRECT FORMATS
let trelloFunctions = {
    create: async (payload, user) => {
        let listId = await getTrelloList(user, payload.listName);
        return {
            url: `https://api.trello.com/1/cards?idList=${listId}&name=${payload.title}&key=${user.apps.kanban.trello.key}&token=${user.apps.kanban.trello.token}`,
            fetchParams: {
                method: "POST",
                headers: {
                    Accepts: "application/json",
                },
            },
        };
    },
    delete: async (payload, user) => {
        let cardID = await getTrelloCard(user, payload.cardName);
        return {
            url: `https://api.trello.com/1/cards/${cardID}?key=${user.apps.kanban.trello.key}&token=${user.apps.kanban.trello.token}`,
            fetchParams: {
                method: "DELETE",
            },
        };
    },
    edit: async (payload, user) => {
        let cardID = await getTrelloCard(user, payload.cardName);
        let url = new URL(`https://api.trello.com/1/cards/${cardID}`);
        /////////////////////////////////////
        //                                 //
        // params.name = title             //
        // params.desc = description       //
        // params.closed = archived (T/F)  //
        //                                 //
        /////////////////////////////////////
        let params = {}
        if(payload.editParams.title)
            params.name = payload.editParams.title
        
        if(payload.editParams.desc)
            params.desc = payload.editParams.desc
        
        if(payload.editParams.archive)
            params.closed = payload.editParams.archive
            
        params.key = user.apps.kanban.trello.key;
        params.token = user.apps.kanban.trello.token;
        url.search = new URLSearchParams(params);

        return {
            url: url,
            fetchParams: {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                },
            },
        };
    },
    getBoard: async (payload, user) => {
        let url = new URL(
            `https://api.trello.com/1/boards/${user.apps.kanban.trello.boardID}/lists`
        );
        let params = {};
        params.key = user.apps.kanban.trello.key;
        params.token = user.apps.kanban.trello.token;
        url.search = new URLSearchParams(params);
        return {
            url: url,
            fetchParams: {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            },
        };
    },
};

//GITKRAKEN FUNCTIONS
//RETURNS CORRECT FORMATS
let gkFunctions = {
    create: async (payload, user) => {
        let listId = await getKrakenList(user, payload.listName);
        let params = {};
        params.name = payload.title;
        params.column_id = listId;
        // params.assignees = [{"id": user.apps.kanban.gitkraken.key}];
        return {
            url: `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}/cards`,
            fetchParams: {
                method: "POST",
                body: JSON.stringify(params),
                headers: {
                    Authorization: user.apps.kanban.gitkraken.token,
                    "Content-Type": "application/json",
                },
            },
        };
    },
    delete: async (payload, user) => {
        let cardID = await getKrakenCard(user, payload.cardName);
        return {
            url: `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}/cards/${cardID}`,
            fetchParams: {
                method: "DELETE",
                headers: {
                    Authorization: user.apps.kanban.gitkraken.token,
                },
            },
        };
    },
    edit: async (payload, user) => {
        let cardID = await getKrakenCard(user, payload.cardName);
        if(payload.editParams.listName) {
            var column = await getKrakenList(user, payload.editParams.listName)
        }
        let editPayload = {};
        editPayload.name = payload.editParams.title;
        editPayload.description = {
            text:payload.editParams.desc
        }
        if(column)
            editPayload.column_id = column
        
        if(payload.editParams.archive)
            editPayload.archived = payload.editParams.archive
            
        return {
            url: `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}/cards/${cardID}`,
            fetchParams: {
                method: "POST",
                body: JSON.stringify(editPayload),
                headers: {
                    Authorization: user.apps.kanban.gitkraken.token,
                    "Content-Type": "application/json",
                },
            },
        };
    },
    getBoard: async (body, user) => {
        let url = `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}?`;

        if (Array.isArray(body.payload)) {
            body.payload.map((element) => (url += `fields=${element}&`));
        } else console.log("This is not an array! Returning name of board.");

        return {
            url: url,
            fetchParams: {
                method: "GET",
                headers: {
                    Authorization: user.apps.kanban.gitkraken.token,
                    "Content-Type": "application/json",
                },
            },
        };
    },
};

//OBJECT CONTAINING THE DIFFERENT APPLICATIONS
let kanbanFormat = {
    trello: trelloFunctions,
    gitkraken: gkFunctions,
};

//UNIVERSAL FUNCTION TO GET THE CORRECT APP AND USE THE ACHIEVED FORMAT FOR POSTING TO THE CORRECT APPLICATION
async function UniversalKanban(mode, payload, user, Users) {
    let format;
    let response;
    if (mode.includes("group")) {
        let groupmode = mode.slice(5);
        for (let groupUser of Users) {
            if (groupUser.groupId == user.groupId) {
                if(groupUser.apps.kanban.primary !== "" && groupUser.apps.kanban.primary !== undefined && Object.keys(groupUser.apps.kanban).length !== 0) {
                    format = await kanbanFormat[groupUser.apps.kanban.primary][groupmode](payload, groupUser);
                    response = await fetch(format.url, format.fetchParams).catch(
                        (err) => console.error(err)
                    );
                }
            }
        }
    } else {
        format = await kanbanFormat[user.apps.kanban.primary][mode](
            payload,
            user
        );
        response = await fetch(format.url, format.fetchParams)
            .then((res) => res.json())
            .catch((err) => console.error(err));
        return response;
    }
}

//EXPORT COMMAND FOR USE IN INDEX
export { UniversalKanban };
