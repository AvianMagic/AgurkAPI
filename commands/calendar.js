import { calendarCreate, calendarDelete, calendarEdit, calendarStatus } from './calendarFunc.js'
//Here we import the necessary functions from calendarFunc.js

async function calendarDist(calendarInput, user, Users) {
    let responseStatus;

    //If-statements to check which command the user has requested
    //Calls the corresponding function imported from calendarFunc.js
    if (calendarInput.mode === 'groupcreate') {
        for (let groupUser of Users) {
            //Checks if the groupId of the user making the event matches other users in database
            //and iteratively runs the function to create the event for each group member
            if (groupUser.groupId === user.groupId) {
                await calendarCreate(groupUser.apps.calendar.primary, groupUser, calendarInput)
            }
        }
    } else if (calendarInput.mode === 'groupdelete') {
        for (let groupUser of Users) {
            //Checks if the groupId of the user deleting the event matches other users in database
            //and iteratively runs the function to delete the event for each group member
            if (groupUser.groupId === user.groupId) {
                await calendarDelete(groupUser.apps.calendar.primary, groupUser, calendarInput);
            }
        }
    } else if (calendarInput.mode === 'groupedit'){
        for (let groupUser of Users) {
            //Checks if the groupId of the user editing the event matches other users in database
            //and iteratively runs the function to edit the event for each group member
            if (groupUser.groupId === user.groupId) {
                await calendarEdit(groupUser.apps.calendar.primary, groupUser, calendarInput);
            }
        }
    //The group functions ultimately calls the same functions as these functions but iteratively for each group member
    } else if (calendarInput.mode === 'create') {
        return await calendarCreate(user.apps.calendar.primary, user, calendarInput);
    } else if (calendarInput.mode === 'delete') {
        return await calendarDelete(user.apps.calendar.primary, user, calendarInput);
    } else if (calendarInput.mode === 'edit'){
        return await calendarEdit(user.apps.calendar.primary, user, calendarInput);
    } else if(calendarInput.mode === 'status'){
        return await calendarStatus(user.apps.calendar.primary, user);
    }

}

//Exporting calendarDist function so that when importing in calendarFunc.js will function
export { calendarDist }