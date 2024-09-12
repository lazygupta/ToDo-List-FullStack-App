const moveToSignup = () => {
    document.getElementById('sign-in-box').style.display = "none";
    document.getElementById('sign-up-box').style.display = "block";
    document.getElementById('to-do-box').style.display = "none";
}

const moveToSignin = () => {
    document.getElementById('sign-in-box').style.display = "block";
    document.getElementById('sign-up-box').style.display = "none";
    document.getElementById('to-do-box').style.display = "none";
}

const signup = async () =>  {
    const username = document.getElementById("signup-username").value;
    const password = document.getElementById("signup-password").value;

    try {
        const response = await axios.post("http://localhost:3001/signup", {
            username,
            password,
        });

        alert(response.data.message);

        if (response.data.message === "You are signed up successfully!") {
            moveToSignin();
        }
    } catch (error) {
        console.error("Error while signing up:", error);
    }
}

const signin = async () => {
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    try {
        const response = await axios.post("http://localhost:3001/signin", {
            username,
            password,
        });

        if(response.data.token) {
            localStorage.setItem("token" , response.data.token);
        }
        alert(response.data.message);

        if(response.data.message === "You are succesfully signed in") {
            showTodo();
        }
    } catch (error) {
        console.error("Error while signing up:", error);
    }
    
}

const addTodo = async () => {
    const inputElement = document.getElementById("input");
    const title = inputElement.value;

    if(title.trim() === "") {
        alert("Please write something to add to the To-Do List");
        return;
    }

    try {
        const token = localStorage.getItem("token");

        await axios.post("http://localhost:3001/todo" ,
            {title: title},
            {
                headers: {
                    token: token
                },
            }
        );

        inputElement.value = "";

        getTodos();


    } catch (err) {
        console.error("Error while adding new To-Do Item" , err);
    }


}

const showTodo = () => {
    document.getElementById('sign-in-box').style.display = "none";
    document.getElementById('sign-up-box').style.display = "none";
    document.getElementById('to-do-box').style.display = "block";

    getTodos();
}

const getTodos = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await axios.get("http://localhost:3001/todo", {
            headers: {
                token: token
            }
        });

        const todosList = document.getElementById("todo-list");

        todosList.innerHTML = "";

        if(response.data.length) {
            response.data.forEach((todo) => {
                const todoElement = createToDoElement(todo);
                todosList.appendChild(todoElement);
            });
        }
    } catch (error) {
        console.error("Error while getting To-Do list:", error);
    }
}

const createToDoElement =  (todo) => {

    
    const todoDiv = document.createElement("div");
    todoDiv.className = "todo-item"

    const inputElement = createInputElement(todo.title);
    inputElement.readOnly = true;

    const updateBtn = createUpdateButton(inputElement, todo.id);
    const deleteBtn = createDeleteButton(todo.id);
    const doneCheckbox = createDoneCheckbox(todo.done, todo.id, inputElement);

    todoDiv.appendChild(inputElement);
    todoDiv.appendChild(doneCheckbox);
    todoDiv.appendChild(updateBtn);
    todoDiv.appendChild(deleteBtn);

    return todoDiv;
}

function createInputElement(value) {

    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = value;
    inputElement.readOnly = true;

    return inputElement;
}

function createUpdateButton(inputElement, id) {
    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Edit";
    updateBtn.classList.add("edit-btn");

    updateBtn.onclick = () => {
        if (inputElement.readOnly) {
            inputElement.readOnly = false;
            updateBtn.textContent = "Save";
            inputElement.focus(); 
            inputElement.style.outline = "1px solid #007BFF";
        } else {
            inputElement.readOnly = true;
            updateBtn.textContent = "Edit";
            inputElement.style.outline = "none";
            updateTodo(id, inputElement.value);
        }
    };

    return updateBtn;
}

function createDeleteButton(id) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.onclick = function () {
        deleteTodo(id);
    };

    return deleteBtn;
}

async function updateTodo(id, newTitle) {
    const token = localStorage.getItem("token");

    try {
        await axios.put(
            `http://localhost:3001/todo/${id}`,
            { title: newTitle },
            {
                headers: { token: token },
            }
        );

        getTodos();
    } catch (error) {
        console.error("Error while updating a To-Do item:", error);
    }
}

const deleteTodo = async (id) => {
    const token = localStorage.getItem("token");

    try {
        await axios.delete(`http://localhost:3001/todo/${id}`, {
            headers: { token: token },
        });

        getTodos();
    } catch (error) {
        console.error("Error while deleting a To-Do item:", error);
    }
}

function createDoneCheckbox(done, id, inputElement) {
    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.checked = done;

    inputElement.style.textDecoration = done ? "line-through" : "none";

    // Handle checkbox change
    doneCheckbox.onchange = function () {
        toggleTodoDone(id, done); 
        inputElement.style.textDecoration = doneCheckbox.checked ? "line-through" : "none"; 
    };

    return doneCheckbox;
}

async function logout() {
    localStorage.removeItem("token");

    alert("You are logged out successfully!");

    moveToSignin();
}


async function toggleTodoDone(id, done) {
    // Retrieve token from localStorage
    const token = localStorage.getItem("token");

    try {
        // Send the updated status of the To-Do (done/undone) to the server
        await axios.put(
            `http://localhost:3001/todos/${id}/done`,
            { done: !done }, // Toggle the done state
            {
                headers: { Authorization: token },
            }
        );

        // Refresh the To-Do list to reflect the changes
        getTodos();
    } catch (error) {
        // Log error if toggling To-Do status fails
        console.error("Error while toggling To-Do status:", error);
    }
}