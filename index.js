const express = require('express');
const app = express();
const routes = require('./routes/userRoute'); 
const db = require('./config/dbconnection'); 
const cors = require('cors');
app.use(cors());
app.use(express.json());

app.use('/api', routes);
const cron = require("node-cron");

const { ApolloServer, gql } = require("apollo-server-express");

const typeDefs = gql`
  type Message {
    id: ID!
    sender: String!
    receiver: String!
    message: String!
  }

  type Query {
    getMessages(sender: String!, receiver: String!): [Message]
  }

  type Mutation {
    sendMessage(sender: String!, receiver: String!, message: String!): Message
  }
`;

const resolvers = {
  Query: {
    getMessages: (_, { sender, receiver }) => {
      return new Promise((resolve, reject) => {
        const query = `
          SELECT * FROM chats 
          WHERE (sender = ? AND receiver = ?) 
             OR (sender = ? AND receiver = ?)
          ORDER BY id ASC
        `;
        db.query(query, [sender, receiver, receiver, sender], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    }
  },
  Mutation: {
    sendMessage: (_, { sender, receiver, message }) => {
      return new Promise((resolve, reject) => {
        const query = "INSERT INTO chats (sender, receiver, message) VALUES (?, ?, ?)";
        db.query(query, [sender, receiver, message], (err, result) => {
          if (err) reject(err);
          else {
            resolve({
              id: result.insertId,
              sender,
              receiver,
              message
            });
          }
        });
      });
    }
  }
};

async function startApolloServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });
}

startApolloServer();

cron.schedule("*/1 * * * * *", () => {
  console.log("🟡 Running updates...");
const query = `
    UPDATE projects 
    SET status = 'Completed' 
    WHERE endDate < CURDATE() 
      AND status != 'Completed'
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error(" Error updating project statuses:", err);
    } else {
      console.log(`✅ ${result.affectedRows} project(s) updated to Completed`);
    }
  });



  db.query("SELECT username FROM users WHERE role = 'Admin'", (err, admins) => {
    if (err) return console.error(" Error fetching admins:", err);
    console.log("✅ admins:", admins);

    admins.forEach((admin) => {
      db.query(
        "SELECT COUNT(*) AS count FROM projects WHERE adminName = ? AND status != 'Completed'",
        [admin.username],
        (err, current) => {
          if (err) return console.error(" Error fetching current projects:", err);

          db.query(
            "SELECT COUNT(*) AS count FROM projects WHERE adminName = ? AND status = 'Completed'",
            [admin.username],
            (err, finished) => {
              if (err) return console.error(" Error fetching finished projects:", err);

              console.log("✅ admin.username=", admin.username, "current=", current, "finished=", finished);

              db.query(
                "UPDATE users SET numberOfProjects = ?, numberOfFinishedProjects = ? WHERE username = ?",
                [current[0].count, finished[0].count, admin.username],
                (err) => {
                  if (err) return console.error(" Error updating admin project counts:", err);
                  console.log(` Updated counts for admin ${admin.username}`);
                }
              );
            }
          );
        }
      );
    });
  });

  db.query("SELECT username FROM users WHERE role = 'Student'", (err, students) => {
    if (err) return console.error(" Error fetching students:", err);

    students.forEach((student) => {
      db.query(
        "SELECT COUNT(*) AS count FROM projectstudents WHERE studentUsername = ?",
        [student.username],
        (err, projects) => {
          if (err) return console.error(" Error fetching student projects:", err);

          db.query(
            "UPDATE users SET numberOfFinishedProjects = ? WHERE username = ?",
            [projects[0].count, student.username],
            (err) => {
              if (err) return console.error(" Error updating student project count:", err);
            }
          );
        }
      );
    });

    students.forEach((student) => {
      db.query(
        "SELECT COUNT(*) AS count FROM tasks WHERE taskAssignee = ?",
        [student.username],
        (err, tasks) => {
          if (err) return console.error(" Error fetching student tasks:", err);

          db.query(
            "UPDATE users SET numberOfTasks = ? WHERE username = ?",
            [tasks[0].count, student.username],
            (err) => {
              if (err) return console.error(" Error updating student task count:", err);
            }
          );
        }
      );
    });
  db.query("SELECT COUNT(*) AS count FROM users WHERE role = 'Student'", (err, studentCountResult) => {
    if (err) return console.error(" Error counting students:", err);
    const totalStudents = studentCountResult[0].count;

    db.query("SELECT username FROM users WHERE role = 'Admin'", (err, admins) => {
      if (err) return console.error(" Error fetching admins for student update:", err);

      admins.forEach((admin) => {
        db.query(
          "UPDATE users SET numberOfStudents = ? WHERE username = ?",
          [totalStudents, admin.username],
          (err) => {
            if (err) return console.error(" Error updating numberOfStudents for admin:", err);
            console.log(`Updated numberOfStudents (${totalStudents}) for admin ${admin.username}`);
          }
        );
      });
    });
  });
const query = `
  SELECT p.adminName, COUNT(t.id) AS tasksCount
  FROM tasks t
  JOIN projects p ON t.projectTitle = p.title
  GROUP BY p.adminName
`;

db.query(query, (err, results) => {
  if (err) return console.error(" Error fetching tasks count per admin:", err);

  results.forEach(({ adminName, tasksCount }) => {
    db.query(
      "UPDATE users SET numberOfTasks = ? WHERE username = ?",
      [tasksCount, adminName],
      (err) => {
        if (err) return console.error(` Error updating tasks count for admin ${adminName}:`, err);
        console.log(` Updated tasks count (${tasksCount}) for admin ${adminName}`);
      }
    );
  });
});






  });
});


app.listen(4000, () => {
  console.log('Server running on http://localhost:4000/api');
  console.log('GraphQL running at http://localhost:4000/graphql');
});
