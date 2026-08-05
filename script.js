//git ke liye bakchodi
function showRegister(){

    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("registerForm").classList.add("active");

}

function showLogin(){

    document.getElementById("registerForm").classList.remove("active");
    document.getElementById("loginForm").classList.add("active");

}


// Registration Validation

document.querySelector("#registerForm form").addEventListener("submit", function(e){

    e.preventDefault();

    let pass=document.getElementById("password").value;
    let confirm=document.getElementById("confirmPassword").value;

    if(pass!==confirm){

        alert("Passwords do not match!");
        return;

    }

    alert("Registration Successful!");

    showLogin();

});


// Login Validation

document.querySelector("#loginForm form").addEventListener("submit", function(e){

    e.preventDefault();

    let email=document.getElementById("loginEmail").value;
    let password=document.getElementById("loginPassword").value;

    if(email==="" || password===""){

        alert("Please enter all fields.");
        return;

    }

    alert("Login Successful!");

});