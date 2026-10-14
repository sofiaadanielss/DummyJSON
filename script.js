//api dummy json
const API_URL = 'https://dummyjson.com';
// identificadores del doc  
const form = document.getElementById('loginSection');
const button = document.getElementById('loginBtn');
const message = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const profileSection = document.getElementById('profileSection');
const JSON_HEADERS = { 'Content-Type': 'application/json' };
// variables
let currentUserId = null;
let todos = [];
// agregar al todo
async function addTodo(text) {
    message.textContent = '';
    try {
        const res = await fetch(`${API_URL}/todos/add`, {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify({ todo: text, completed: false, userId: currentUserId })
        });
        if (!res.ok) throw new Error();

        const data = await res.json();
        todos = [{ ...data, id: Date.now(), local: true }, ...todos];
        renderTodos();
    } catch (error) {
        message.textContent = 'No se pudo agregar la tarea.';
    }
}
// borrar del todo
async function deleteTodo(id) {
    message.textContent = '';
    const task = todos.find((t) => t.id === id);
    if (!task) return;

    try {
        if (!task.local) {
            const res = await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
        }
        todos = todos.filter((t) => t.id !== id);
        renderTodos();
    } catch (error) {
        message.textContent = 'No se pudo eliminar la tarea.';
    }
}
// marcar completada / pendiente
async function toggleTodo(id) {
    message.textContent = '';
    const task = todos.find((t) => t.id === id);
    if (!task) return;

    const newState = !task.completed;
    try {
        if (!task.local) {
            const res = await fetch(`${API_URL}/todos/${id}`, {
                method: 'PUT',
                headers: JSON_HEADERS,
                body: JSON.stringify({ completed: newState })
            });
            if (!res.ok) throw new Error();
        }
        todos = todos.map((t) => (t.id === id ? { ...t, completed: newState } : t));
    } catch (error) {
        message.textContent = 'No se pudo actualizar la tarea.';
    }
    renderTodos();
}
// carga ToDo list del user
async function loadTodos() {
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/todos/user/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        todos = data.todos;
        renderTodos();
    } catch (error) {
        message.textContent = 'No se pudieron cargar las tareas.';
    }
}
// revisar toDo
function renderTodos() {
    renderStats();
    
    const filtro = document.getElementById('todoFilter').value;
    const texto = document.getElementById('todoSearch').value.trim().toLowerCase();

    const visibles = todos.filter((task) => {
        if (filtro === 'pending' && task.completed) return false;
        if (filtro === 'completed' && !task.completed) return false;
        return task.todo.toLowerCase().includes(texto);
    });

    const lista = document.getElementById('todoList');
    lista.innerHTML = '';

    if (visibles.length === 0) {
        lista.textContent = 'No hay tareas.';
        return;
    }  

    visibles.forEach((task) => {
        const li = document.createElement('li');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTodo(task.id));

        const span = document.createElement('span');
        span.textContent = task.todo;
        if (task.completed) span.style.textDecoration = 'line-through';

        const borrar = document.createElement('button');
        borrar.type = 'button';
        borrar.textContent = 'Eliminar';
        borrar.addEventListener('click', () => deleteTodo(task.id));

        li.append(checkbox, span, borrar);
        lista.appendChild(li);
    });
}
// stats del todo list
function renderStats() {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = total - completed;
    const percentage = (completed / total) * 100;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-percentage').textContent = percentage;
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

document.getElementById('todoFilter').addEventListener('change', renderTodos);
document.getElementById('todoSearch').addEventListener('input', renderTodos);
document.getElementById('todoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    if (!text) return;

    await addTodo(text);
    input.value = '';
});

loadProfile();