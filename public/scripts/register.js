let password = document.getElementById('password');
let verifyPassword = document.getElementById('verifyPassword')
let email = document.getElementById('email')
const nextButton = document.getElementById('nextBtn')
const registerButton = document.getElementById('registerButton')

password.addEventListener('keyup', function() {
    if (password.value === verifyPassword.value && password.value !== "" && verifyPassword.value !== "") {
        password.style.borderColor = "green";
        verifyPassword.style.borderColor = 'green';
        registerButton.disabled = false;
    } else if (password.value !== verifyPassword.value || password.value === "" || verifyPassword.value === "") {
        registerButton.disabled = true;
    }
})

verifyPassword.addEventListener('keyup', function() {
    if (password.value === verifyPassword.value && password.value !== "" && verifyPassword.value !== "") {
        password.style.borderColor = "green";
        verifyPassword.style.borderColor = 'green';
        registerButton.disabled = false;
    } else if (password.value !== verifyPassword.value || password.value === "" || verifyPassword.value === "") {
        registerButton.disabled = true;
    }
})


// $('#password, #confirm_password').on('keyup', function () {
//     if ($('#password').val() == $('#confirm_password').val()) {
//       $('#message').html('Matching').css('color', 'green');
//     } else 
//       $('#message').html('Not Matching').css('color', 'red');
//   });