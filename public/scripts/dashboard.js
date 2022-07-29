const user = <%-JSON.stringify(user)%>;
const availableApps = <%- JSON.stringify(availableApps)%>;
const missingApps = <%- JSON.stringify(missingApps)%>;
const addAppContainer = document.getElementById('addApplicationContainer')
const availableApplicationsContainer = document.getElementById('availableApplicationsContainer')
let availableAppsHTML = document.createElement('div')
let hasNonPrimary = 0;

if (typeof user.apps != 'undefined') {
  if (typeof user.apps.communication != 'undefined' && Object.keys(user.apps.communication).length !== 0) {
    availableAppsHTML.insertAdjacentHTML('beforeend', "<h2>Communication:</h2>")
    availableApps.communication.forEach(function(value) {
      let string = value.charAt(0).toUpperCase() + value.slice(1)
      if (value == user.apps.communication.primary) {
        availableAppsHTML.insertAdjacentHTML('beforeend', `<p>${string} </p>`)
      } else {
        availableAppsHTML.insertAdjacentHTML('beforeend', `<p>${string}<button name="id" value="${value}" data-value="communication" type="submit"
                                                          id="makePrimaryBtn" style="padding: 0; margin: 0; margin-left: 2rem">Make Primary</button></p>`);
        hasNonPrimary = 1;
      }
    })
  }
  if(typeof user.apps.kanban != 'undefined' && Object.keys(user.apps.kanban).length !== 0) {
      availableAppsHTML.insertAdjacentHTML('beforeend', "<h2>Kanban:</h2>")
      availableApps.kanban.forEach(function(value) {
      let string = value.charAt(0).toUpperCase() + value.slice(1)
      if (value == user.apps.kanban.primary) {
        availableAppsHTML.insertAdjacentHTML('beforeend', `<p>${string} </p>`)
      } else {
        availableAppsHTML.insertAdjacentHTML('beforeend', `<p>${string}<button name="id" value="${value}" data-value="communication" type="submit"
                                                          id="makePrimaryBtn" style="padding: 0; margin: 0; margin-left: 2rem">Make Primary</button></p>`);
        hasNonPrimary = 1;
      }
    })
  }
}
availableApplicationsContainer.appendChild(availableAppsHTML)

if (user.apps == 'undefined' || <%=missingApps.communication.length%> > 0 || <%=missingApps.kanban.length%> > 0) {
  addAppContainer.insertAdjacentHTML('beforeend', `
              <h3>Add Application</h3>
              <% if(missingApps.communication.length > 0) { %>
                 Communication <input type="radio" id="applicationTypeCom" name="applicationType" value="Communication">
              <% } %>
              <% if(missingApps.kanban.length > 0) { %>
              Kanban <input type="radio" id="applicationTypeKan" name="applicationType" value="Kanban">
              <% } %>
              <div class="communicationForms">
                  <select name="appName" id="communicationSelect" style="display: none">
                      <option value="" disabled selected hidden>-- CHOOSE AN OPTION --</option>
                      <% for (var i = 0; i < missingApps.communication.length; i++) { %>
                      <option value="<%-missingApps.communication[i]%>"><%=missingApps.communication[i].charAt(0).toUpperCase() + missingApps.communication[i].slice(1)%></option>
                      <% } %>
                  </select>
                  <form id="discordForm" action="/addApplication" method="post" style="display: none">
                      <input type="text" name="appName" value="discord" hidden>
                      <input type="text" name="token" placeholder="TOKEN">
                      <input type="text" name="channelId" placeholder="CHANNEL ID">
                      <input type="submit" value="ADD">
                  </form>
                  <form id="slackForm" action="/addApplication" method="post" style="display: none">
                      <input type="text" name="appName" value="slack" hidden>
                      <input type="text" name="token" placeholder="TOKEN">
                      <input type="text" name="channelId" placeholder="CHANNEL NAME">
                      <input type="submit" value="ADD">
                  </form>
              </div>
              <div id="kanbanForms" style='display: none'>
                  <select name="appName" id="kanbanSelect" style="display: block">
                      <option value="" disabled selected hidden>-- CHOOSE AN OPTION --</option>
                      <% for (var i = 0; i < missingApps.kanban.length; i++) { %>
                      <option value="<%-missingApps.kanban[i]%>"><%=missingApps.kanban[i].charAt(0).toUpperCase() + missingApps.kanban[i].slice(1)%></option>
                      <% } %>
                  </select>
                  <form id="trelloForm" action="/addApplication" method="post" style="display: none">
                      <input type="text" name="appName" value="trello" hidden>
                      <input type="text" name="token" placeholder="TOKEN">
                      <input type="text" name="key" placeholder="KEY">
                      <input type="submit" value="ADD">
                  </form> 
                  <form id="krakenForm" action="/addApplication" method="post" style="display: none">
                      <input type="text" name="appName" value="gitkraken" hidden>
                      <input type="text" name="token" placeholder="TOKEN">
                      <input type="text" name="key" placeholder="KEY">
                      <input type="submit" value="ADD">
                  </form> 
              </div>
              `);
  let kanbanForms = document.getElementById('kanbanForms')
  let communicationForms = document.getElementById('communicationForms')
  if (document.getElementById('applicationTypeCom')) {
    let commsMenuRadio = document.getElementById('applicationTypeCom')
    commsMenuRadio.onclick = (e) => {
      communicationSelect.style.display = 'block';
      kanbanSelect.style.display = 'none';
    }
  }

  if (document.getElementById('applicationTypeKan')) {
    let kanMenuRadio = document.getElementById('applicationTypeKan')
    kanMenuRadio.onchange = (e) => {
      kanbanForms.style.display = 'block'
      kanbanSelect.style.display = 'block'
      communicationSelect.style.display = 'none'
    }
  }
  let kanMenuRadio = document.getElementById('applicationTypeKan')
  let communicationSelect = document.getElementById('communicationSelect')
  let kanbanSelect = document.getElementById('kanbanSelect')




  communicationSelect.onchange = (e) => {
    if (communicationSelect.value == 'discord') {
      discordForm.style.display = 'block';
      slackForm.style.display = 'none'
    } else if (communicationSelect.value == 'slack') {
      slackForm.style.display = 'block';
      discordForm.style.display = 'none';
    }
  }

  kanbanSelect.onchange = (e) => {
    if (kanbanSelect.value == 'trello') {
      trelloForm.style.display = 'block';
      krakenForm.style.display = 'none'
    } else if (kanbanSelect.value == 'gitkraken') {
      krakenForm.style.display = 'block';
      trelloForm.style.display = 'none';
    }
  }

  if (missingApps.communication.length = 0) {
    commsMenuRadio.style.display = 'none'
  }
  if (missingApps.kanban.length = 0) {
    KanMenuRadio.style.display = 'none'
  }

}

let makePrimary = document.getElementById('makePrimaryBtn')
if (hasNonPrimary) {
  makePrimary.addEventListener('click', async () => {
    let app = makePrimary.value;
    let category = makePrimary.getAttribute('data-value')
    let body = new Object({
      app,
      category
    })
    const response = await fetch('/makePrimary', {
      method: 'post',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then(res => res.json()).then(data => window.location.reload())
  });
}

