const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
const { userModel, todoModel } = require("./db");

const bcrypt = require("bcrypt");
const saltRounds = 5;

mongoose.connect(
  "mongodb+srv://lazyrabbit:lazyrabbit123@cluster0.kjmsh.mongodb.net/todo-app-fullstack"
);

app.use(express.json());

// const users = []
const todos = [];

const JWT_SECRET = "ilovewebdev";

app.use(express.static(path.join(__dirname, "public")));

app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({
        message: "Username and password fields can't be empty.",
      });
    }

    if (username.length < 5) {
      return res.json({ message: "Username must have at least 5 characters." });
    }

    const foundUser = await userModel.findOne({
      username,
    });

    console.log(foundUser);

    if (foundUser != null) {
      res.json({
        message: "You are already signed up",
      });
      return;
    } else {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      userModel.create({
        username,
        password: hashedPassword,
      });

      res.json({ message: "You are signed up successfully!" });
    }
  } catch (err) {
    console.log(`No duplicates entries allowed , ${err}`);
  }

});

app.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.json({ message: "Username and password are required." });
  }

  const user = await userModel.findOne({
    username,
  });

  console.log(user);
  
  const passwordMatch =await bcrypt.compare(password, user.password);

  console.log(password);
  console.log(passwordMatch);

  try {
    if (user && passwordMatch) {
      const token = jwt.sign(
        {
          id: user._id,
        },
        JWT_SECRET
      );

      res.setHeader("token", token);

      res.json({
        message: "You are succesfully signed in",
        token,
      });
    } else {
      res.json({
        message: "Incorrect credentials",
      });
    }
  } catch (error) {
    res.json({
      message: "User not found",
    });
  }
});

const authMiddleware = (req, res, next) => {
  const tokenReceievd = req.headers.token;
  if (tokenReceievd) {
    jwt.verify(tokenReceievd, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).send({
          message: "Unauthorized User",
        });
      } else {
        req.username = decoded.username;
        next();
      }
    });
  } else {
    res.status(401).send({
      message: "Unauthorized",
    });
  }
};

app.get("/todo", authMiddleware, (req, res) => {
  let user = req.username;

  console.log(user);

  const userTodos = todos.filter((todo) => todo.username === user);

  console.log(userTodos);

  res.json(userTodos);
});

app.post("/todo", authMiddleware, (req, res) => {
  let user = req.username;
  const { title } = req.body;

  if (!title) {
    return res.json({
      message: "To-Do List title cannot be empty",
    });
  }

  const newTodo = {
    id: todos.length + 1,
    username: user,
    title,
    done: false,
  };

  todos.push(newTodo);

  res.json({
    message: "To-Do created succesfully",
    tofo: newTodo,
  });
});

app.put("/todo/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  const { title } = req.body;

  const currentUser = req.username;

  const todo = todos.find(
    (todo) => todo.id === parseInt(id) && todo.username === currentUser
  );

  if (!todo) {
    return res.json({ message: "To-Do not found." });
  }

  if (!title) {
    return res.json({ message: "To-Do title cannot be empty." });
  }

  todo.title = title;

  res.json({ message: "To-Do updated successfully!", todo });
});

app.delete("/todo/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  const currentUser = req.username;

  const todoIndex = todos.findIndex(
    (todo) => todo.id === parseInt(id) && todo.username === currentUser
  );

  if (todoIndex === -1) {
    return res.json({
      message: "To-Do not found",
    });
  }

  todos.splice(todoIndex, 1);

  res.json({
    message: "To-Do dekleted succesfully",
  });
});

app.put("/todos/:id/done", authMiddleware, (req, res) => {
  // Extract the id from the request parameters
  const { id } = req.params;

  // Get the username from the request object
  const currentUser = req.username;

  // Find the To-Do with the provided id and username
  const todo = todos.find(
    (todo) => todo.id === parseInt(id) && todo.username === currentUser
  );

  // Check if the To-Do is not found
  if (!todo) {
    // Send an error message if the To-Do is not found
    return res.json({ message: "To-Do not found." });
  }

  // Toggle the 'done' status of the To-Do
  todo.done = !todo.done;

  // Send a success response
  res.json({
    message: `To-Do marked as ${todo.done ? "done" : "undone"}.`,
    todo,
  });
});

app.listen(3001, () => {
  console.log("App is running on port 3001");
});
