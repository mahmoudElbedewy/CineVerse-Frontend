let base_api_path = "http://127.0.0.1:8000";
let loginForm = document.getElementById("login-form");
let messageDiv = document.getElementById("login-message");

async function refreshAccessToken(){
    let refreshToken = localStorage.getItem('refresh_token')

    if (!refreshToken) return false

    try{
        const response = await fetch(`${base_api_path}/api/token/refresh/` , {
            method : 'POST',
            headers : {
                "Content-Type": "application/json"
            },
            body : JSON.stringify({ refresh: refreshToken })
        })

        if (response.ok){
            data = await response.json()

            localStorage.setItem('access_token' , data.access)
            return true
        }else{
            return false
        }
    }catch (error) {
        console.error("Error refreshing token:", error);
        return false;
    }
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let loginData = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
    };

    try{
        let response = await fetch(`${base_api_path}/api/login/` , {
            method : 'POST',
            headers : {
                "Content-Type": "application/json"            
            },
            body : JSON.stringify(loginData)
        })

        if (!response.ok && response.status === 500) {
            messageDiv.innerHTML = `<span style='color: red;'>Server Error (500). Check Django Terminal!</span>`;
            return;
        }

        let data = await response.json() 

        if (response.status === 200){
            localStorage.setItem('access_token' , data.access)
            localStorage.setItem('refresh_token' , data.refresh)
            messageDiv.innerHTML = "<span style='color: green;'>Login successful! Taking you to movies...</span>";
            setTimeout(() => {
                window.location.href = "index.html"; 
            }, 1000);
        }else {
            messageDiv.innerHTML = `<span style='color: red;'>Invalid Email or Password!</span>`;
        }
    }catch (error) {
        console.error("Error:", error);
    }
})