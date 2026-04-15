let base_api_path = "https://cineverse.pythonanywhere.com"; // رابط الباك إند بتاعنا
let registerForm = document.getElementById("register-form");
let messageDiv = document.getElementById("register-message");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 

    let userData = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    };

    try{
        let response = await fetch(`${base_api_path}/accounts/register/` , {
            method : 'POST',
            headers : {
                "Content-Type": "application/json"
            },
            body : JSON.stringify(userData)
        })

        let data = await response.json()

        if (response.status === 201){
            messageDiv.innerHTML = "<span style='color: green;'>Account created successfully! Redirecting to login...</span>";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        }else{
            console.log(data)
            messageDiv.innerHTML = `<span style='color: red;'>Error: ${JSON.stringify(data)}</span>`;
        }
    }catch (error) {
        console.error("Error:", error);
    }
})