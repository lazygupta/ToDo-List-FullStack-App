const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
const { userModel, todoModel } = require("./db");

const bcrypt = require("bcrypt");
const saltRounds = 5;

mongoose.connect(
  "mongodb+srv://lazyrabbit:lazyrabbit123@cluster0.kjmsh.mongodb.net/ToDoApp"
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

  try {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (user && passwordMatch) {
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username
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
  const tokenReceived = req.headers.token;
  if (tokenReceived) {
    jwt.verify(tokenReceived, JWT_SECRET, (err, decoded) => {
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

app.get("/todo", authMiddleware, async (req, res) => {
  try {
    let user = req.username;
    // console.log(user);
    
    // Fetch all todos for the given username
    const userTodos = await todoModel.find({
      username: user
    });

    // console.log(userTodos);

    // Respond with the fetched todos
    res.json(userTodos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/todo", authMiddleware, async (req, res) => {
  let user = req.username;
  const { title } = req.body;

  if (!title) {
    return res.json({
      message: "To-Do List title cannot be empty",
    });
  }

  const foundUser = await userModel.findOne({
    username: user,
  });

  const userTodos = todoModel.create({
    id: foundUser._id,
    username: foundUser.username,
    title,
    done: false,
  });

  res.json({
    message: "To-Do created succesfully",
    todo: userTodos
  });
});

app.put("/todo/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const { title } = req.body;

  const currentUser = req.username;

  const todo = await todoModel.findOne({
    username: currentUser
  });

  if (!todo) {
    return res.json({ message: "To-Do not found." });
  }

  if (!title) {
    return res.json({ message: "To-Do title cannot be empty." });
  }

  todo.title = title;

  console.log(todo.title);

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
