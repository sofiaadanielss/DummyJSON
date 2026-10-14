//api dummy json
const API_URL = 'https://dummyjson.com';
// identificadores del doc  
const form = document.getElementById('loginSection');
const button = document.getElementById('loginBtn');
const message = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const profileSection = document.getElementById('profileSection');
// variables
let currentUserId = null;
let todos = [];
// carga ToDo list del user
async function loadTodos() {
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/todos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        todos = data.todos;
    } catch (error) {
        message.textContent = 'No se pudieron cargar las tareas.';
    }
}
// revisar toDo
function renderTodos() {
    const lista = document.getElementById('todoList');
    lista.innerHTML = '';

    if (todos.length === 0) {
        lista.textContent = 'No hay tareas.';
        return;
    }  
    
    todos.forEach((task) => {
        const li = document.createElement('li');
        li.textContent = task.task;
        if (task.completed) li.style.textDecoration = 'line-through';

        lista.appendChild(li);
    });
}
// login con las credenciales de emilys
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
    
    localStorage.setItem('accessToken', data.accessToken);
}
//mostrar error
function showLogin(errorText = '') {
    profileSection.hidden = true;
    form.hidden = false;
    message.style.color = '#c0392b';
    message.textContent = errorText;
}
// mostrar perfil del user 
function showProfile(user) {
    currentUserId = user.id;
    document.getElementById('profile-image').src = user.image;
    document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-phone').textContent = user.phone;
    document.getElementById('profile-city').textContent = user.address?.city ?? '—';

    form.hidden = true;
    profileSection.hidden = false;
    loadTodos();
}
// cargar perfil de usuario
async function loadProfile() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        showLogin();
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('accessToken');
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
// escuchar el boton de login
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    button.disabled = true;
    button.textContent = 'Entrando...';

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
// escuchar el boton de logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('accessToken');
    currentUserId = null;
    showLogin();
});

loadProfile();