var keytar = require('keytar');

var form = document.querySelector('form');
var usernameField = form.querySelector('input[name="username"]');
var passwordField = form.querySelector('input[name="password"]');

function getUserCredentials() {
  var username = localStorage.getItem('username');

  return {
    username: username,
    password: isPresent(username) && keytar.getPassword('LiquidBeam', username)
  };
}

function setupListHandleClickEvent(workspaceId) {
  var gui = require('nw.gui');

  function openBrowser(event) {
    var id = $(this).find('.id').text();
    var url = 'https://app.liquidplanner.com/space/' + workspaceId + '/projects/show/' + id;

    gui.Shell.openExternal(url);
  }

  $('.list').on('click', 'li', openBrowser);

  $('.list').on('keyup', 'li', function (event) {
    if (event.keyCode == 13) {
      openBrowser.call(this, event);
    }
  });
}

function getUserTasks(userCredentials) {
  if (!userCredentials.password) { return; }

  $.ajax({
    dataType: 'json',
    url: 'https://app.liquidplanner.com/api/account',
    username: userCredentials.username,
    password: userCredentials.password,
    success: function (data) {
      var userId = data.id;
      var workspaceId = data.workspaces[0].id;

      setupListHandleClickEvent(workspaceId);

      $.ajax({
        dataType: 'json',
        url: 'https://app.liquidplanner.com/api/workspaces/' + workspaceId + '/tasks?filter[]=is_done%20is%20false&filter[]=item_type=Task&filter[]=owner_id=' + userId,
        username: userCredentials.username,
        password: userCredentials.password,
        success: function (data) {
          var options = {
            item: '<li tabindex="0"><h2 class="name"></h2><p><span class="parent_crumbs"></span><span class="client_name"></span></p><span class="id"></span></li>'
          };

          var list = new List('tasks', options, data);
          list.sort('updated_at', { order: 'desc' });
        }
      });
    }
  });
}

function populateFormWithSavedData() {
  var userCredentials = getUserCredentials();

  if (isPresent(userCredentials.password)) {
    usernameField.value = userCredentials.username;
    passwordField.value = userCredentials.password;
  }
}

function saveFormData(event) {
  event.preventDefault();

  var username = usernameField.value;
  var password = passwordField.value;

  if (isPresent(username) && isPresent(password)) {
    localStorage.setItem('username', username);
    keytar.replacePassword('LiquidBeam', username, password);
  }
}

function isPresent(text) {
  return text && text !== '';
}

populateFormWithSavedData();
form.addEventListener('submit', saveFormData);
getUserTasks(getUserCredentials());
