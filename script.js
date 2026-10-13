const API_URL = 'https://dummyjson.com';
const TOKEN_KEY = 'accessToken';

const form = document.getElementById('loginSection');
const button = document.getElementById('loginBtn');
const message = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const profileSection = document.getElementById('profileSection');


async function loginEmily(){
    const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'emilys',
        password: 'emilyspass',
        expiresInMins: 30, 
    }),
    credentials: 'include'
    });

    const data = await res.json();
    console.log(data);
    
    if (!res.ok) throw new Error(data.message || 'Usuario o password incorrectos.');
}

function showLogin(errorText = '') {
    profileSection.hidden = true;
    form.hidden = false;
    message.style.color = '#c0392b';
    message.textContent = errorText;
}

function showProfile(user) {
    document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-phone').textContent = user.phone;
    document.getElementById('profile-city').textContent = user.address?.city ?? '—';

    form.hidden = true;
    profileSection.hidden = false;
}

async function loadProfile() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
        showLogin();
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            showLogin('Sesion expirada, has login de nuevo');
            return;
        }

        if (!respuesta.ok) {
            showLogin('No se pudo cargar el perfil.');
            return;
        }
        
        showProfile(await respuesta.json());
    } catch (error) {
        showLogin('No se pudo conectar con el servidor.');
    }
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    button.disabled = true;
    button.textContent = 'Entrando';

    try {
        await loginEmily();
        form.reset();
        await loadProfile();
    } catch (error) {
        message.style.color = '#c0392b';
        message.textContent = error.message || 'No se pudo conectar con el servidor.';
    } finally {
        button.disabled = false;
        button.textContent = 'Login';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    showLogin();
});

loadProfile();