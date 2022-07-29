import fetch from 'node-fetch'

async function getKrakenList(user, listName) {
    let Lists;
    await fetch(
        `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}?fields=columns`,
        {
            method: "GET",
            headers: {
                authorization: `Bearer ${user.apps.kanban.gitkraken.token}`,
                accept: "application/json",
            },
        }
    )
        .then((res) => res.json())
        .then((data) => (Lists = data))
        .catch((err) => console.error(err));
    let list = Lists.columns.find(
        (list) => list.name === listName
    );
    if (typeof list != "undefined") {
        return list.id;
    } else {
        console.log(`COULD NOT LIST WITH THAT NAME FOR USER ${groupUser.id}`);
    }
}

async function getKrakenCard(user, cardName) {
    let Cards;
    await fetch(
        `https://gloapi.gitkraken.com/v1/glo/boards/${user.apps.kanban.gitkraken.boardID}/cards?fields=name`,
        {
            method: "GET",
            headers: {
                authorization: `Bearer ${user.apps.kanban.gitkraken.token}`,
                accept: "application/json",
            },
        }
    )
        .then((res) => res.json())
        .then((data) => (Cards = data))
        .catch((err) => console.error(err));
    let card = Cards.find(
        (card) => card.name === cardName
    );
    if (typeof card != "undefined") {
        return card.id
    } else {
        console.log(`COULD NOT LIST WITH THAT NAME FOR USER ${user.id}`);
    }
}

async function getTrelloList(user, listName) {
                    let Lists
                    await fetch(`https://api.trello.com/1/boards/${user.apps.kanban.trello.boardID}/lists?key=${user.apps.kanban.trello.key}&token=${user.apps.kanban.trello.token}`, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        }
                    })
                        .then(res => res.json()).then(data=> Lists = data)
                        .catch(err => console.error(err));
                    let list = Lists.find(list => list.name === listName);
                    if(typeof list != 'undefined') {
                        return list.id
                    } else {
                        console.log(`COULD NOT LIST WITH THAT NAME FOR USER ${user.id}`)
                    }
}

async function getTrelloCard(user, cardName) {
    let Cards
    await fetch(`https://api.trello.com/1/boards/${user.apps.kanban.trello.boardID}/cards?key=${user.apps.kanban.trello.key}&token=${user.apps.kanban.trello.token}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(res => res.json()).then(data=> Cards = data)
        .catch(err => console.error(err));
    let card = Cards.find(card => card.name === cardName);
    if(typeof card != 'undefined') {
        return card.id
    } else {
        console.log(`COULD NOT CARD WITH THAT NAME FOR USER ${user.id}`)
    }
}

export {getKrakenList, getKrakenCard, getTrelloList, getTrelloCard}
