const express = require('express');
const router = express.Router();
const db = require('../config/dbconnection');
//by batool
router.post('/signup', (req, res) => {
    const { username, password, isStudent, universityId } = req.body;

    if (!username || !password || (isStudent && !universityId)) {
        return res.status(400).json({ message: "Please fill all required fields." });
    }

    const role = isStudent ? "Student" : "Admin";
    const universityIdValue = universityId || "N/A";

    const user = {
        username,
        password,
        role,
        universityId: universityIdValue,
        staySignin: "no",
        isLogin: "no",
        numberOfTasks: 0,
        numberOfFinishedProjects: 0,
        numberOfProjects: isStudent ? 0 : null,
        numberOfStudents: isStudent ? null : 0
    };

    const query = 'INSERT INTO users (username, password, role, universityId, staySignin, isLogin, numberOfTasks, numberOfFinishedProjects, numberOfProjects, numberOfStudents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [
        user.username,
        user.password,
        user.role,
        user.universityId,
        user.staySignin,
        user.isLogin,
        user.numberOfTasks,
        user.numberOfFinishedProjects,
        user.numberOfProjects,
        user.numberOfStudents
    ], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error saving user data to database.", error: err });
        }
        res.status(201).json({ message: "Sign up successful!" });
    });
});
//by batool

router.post('/signin', (req, res) => {
    const { username, password, rememberMe } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.query(query, [username, password], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Error fetching user data from database.", error: err });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid username or password!" });
        }

        const storedUser = results[0];

        const updateQuery = 'UPDATE users SET isLogin = ?, staySignin = ? WHERE id = ?';

        const newStaySignin = rememberMe ? "yes" : "no";

        db.query(updateQuery, [ "yes", newStaySignin, storedUser.id ], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error updating user data in database.", error: err });
            }
            
            res.status(200).json({
                message: `Sign in successful ${storedUser.role}!`,
                user: storedUser
            });
        });
    });
});
//by batool

router.post("/logout", (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required" });
    }

    const findQuery = 'SELECT * FROM users WHERE username = ?';

    db.query(findQuery, [username], (err, results) => {
        if (err) {
            console.error("Error finding user:", err);
            return res.status(500).json({ error: "Database error while finding user" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const updateQuery = 'UPDATE users SET staySignin = ?, isLogin = ? WHERE username = ?';

        db.query(updateQuery, ["no", "no", username], (err, result) => {
            if (err) {
                console.error("Error updating user status:", err);
                return res.status(500).json({ error: "Database error while updating user status" });
            }

            return res.json({ message: "User logged out successfully" });
        });
    });
});




// //by batool

// router.get("/getMsg", (req, res) => {
//     const { sender, receiver } = req.query;
//     const query = `
//       SELECT * FROM chats 
//       WHERE (sender = ? AND receiver = ?) 
//          OR (sender = ? AND receiver = ?)
//       ORDER BY id ASC
//     `;
//     db.query(query, [sender, receiver, receiver, sender], (err, results) => {
//       if (err) return res.status(500).json({ error: "Database error" });
//       res.json(results);
//     });
//   });
//  //by batool
 
//   router.post("/sendMsg", (req, res) => {
//     const { sender, receiver, message } = req.body;
//     const query = "INSERT INTO chats (sender, receiver, message) VALUES (?, ?, ?)";
//     db.query(query, [sender, receiver, message], (err, result) => {
//       if (err) return res.status(500).json({ error: "Failed to send message" });
//       res.status(201).json({ success: true, id: result.insertId });
//     });
//   });
  


//by batool

  router.get('/users-by-role', (req, res) => {
    const sql = "SELECT username, role FROM users";
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const admins = [];
      const students = [];
  
      results.forEach(user => {
        if (user.role === 'Admin') admins.push(user.username);
        else if (user.role === 'Student') students.push(user.username);
      });
  
      res.json({ admins, students });
    });
  });
  

//by batool

  router.get("/stayed-signedin", (req, res) => {
    const sql = "SELECT username, password FROM users WHERE staySignin = 'yes'";
    db.query(sql, (err, result) => {
      if (err) {
        console.error("Error fetching signed-in users:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
  
      res.json({ signedInUsers: result });
    });
  });

  // by marwaaaaaaa************
  router.post('/add-project', (req, res) => {
    const {
      title,
      description,
      category,
      startDate,
      endDate,
      status,
      adminName,
      selectedStudents 
    } = req.body;
  
    const insertProjectQuery = `
      INSERT INTO projects (title, description, category, startDate, endDate, status, adminName)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
  
    db.query(insertProjectQuery, [title, description, category, startDate, endDate, status, adminName], (err, result) => {
      if (err) {
        console.error('خطأ في إضافة المشروع:', err);
        return res.status(500).json({ error: 'فشل في إضافة المشروع' });
      }
  
      const insertStudentQuery = `
        INSERT INTO projectstudents (projectTitle, studentUsername)
        VALUES (?, ?)
      `;
  
      const promises = selectedStudents.map(username => {
        return new Promise((resolve, reject) => {
          db.query(insertStudentQuery, [title, username], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
  
      Promise.all(promises)
        .then(() => res.json({ message: 'تمت إضافة المشروع والطلاب بنجاح' }))
        .catch((err) => {
          console.error('خطأ في إضافة الطلاب:', err);
          res.status(500).json({ error: 'تم إضافة المشروع لكن فشل في إضافة الطلاب' });
        });
    });
  });
  
  router.get("/search-projects/:keyword", (req, res) => {
    const keyword = req.params.keyword;
  
    if (!keyword) {
      return res.status(400).json({ message: "يرجى إرسال كلمة البحث باستخدام المعامل ?q=keyword" });
    }
  
    const query = `
      SELECT * FROM projects
      WHERE title LIKE ? OR description LIKE ?
    `;
    const searchTerm = `%${keyword}%`;
  
    db.query(query, [searchTerm, searchTerm], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "حدث خطأ في قاعدة البيانات." });
      }
  
      res.json(results);
    });
  });
  router.get("/projects-by-admin/:adminName", (req, res) => {
    const adminName = req.params.adminName;
  
    if (!adminName) {
      return res.status(400).json({ message: "يرجى إرسال اسم المشرف." });
    }
  
    const query = `SELECT * FROM projects WHERE adminName = ?`;
  
    db.query(query, [adminName], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "حدث خطأ في قاعدة البيانات." });
      }
  
      res.json(results);
    });
  });
  
  router.get('/projects/status/:status', (req, res) => {
    const { status } = req.params; 
    
    const query = 'SELECT * FROM projects WHERE status = ?';
    
    db.query(query, [status], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'حدث خطأ في قاعدة البيانات.' });
      }
      res.json(results); 
    });
  });
  router.get('/project-students/:title', (req, res) => {
    const projectTitle = req.params.title;
    console.log("عنوان المشروع اللي واصل:", projectTitle);
  
    const query = 'SELECT * FROM projectstudents WHERE LOWER(TRIM(projectTitle)) = LOWER(TRIM(?))';
  
    db.query(query, [projectTitle], (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      const students = results.map(row => row.studentUsername);
      res.json(students);
    });
    
  });
  
  router.get("/projects-by-student/:studentName", (req, res) => {
    const { studentName } = req.params;
  
    db.query(
      "SELECT projectTitle FROM projectstudents WHERE studentUsername = ?",
      [studentName],
      (err, titlesRows) => {
        if (err) {
          console.error("Error fetching student project titles:", err);
          return res.status(500).json({ message: "حدث خطأ أثناء جلب عناوين المشاريع." });
        }
  
        const titles = titlesRows.map((row) => row.projectTitle);
  
        if (titles.length === 0) {
          return res.status(200).json([]); 
        }
  
        db.query(
          "SELECT * FROM projects WHERE title IN (?)",
          [titles],
          (err, projectsRows) => {
            if (err) {
              console.error("Error fetching student projects:", err);
              return res.status(500).json({ message: "حدث خطأ أثناء جلب تفاصيل المشاريع." });
            }
  
            res.status(200).json(projectsRows);
          }
        );
      }
    );
  });
  
  router.get("/tasks-by-project/:projectTitle", (req, res) => {
    const { projectTitle } = req.params;
  
    const query = "SELECT * FROM tasks WHERE projectTitle  = ?";
  
    db.query(query, [projectTitle], (err, results) => {
      if (err) {
        console.error("Error fetching tasks:", err);
        return res.status(500).json({ message: "Error fetching tasks" });
      }
  
      res.status(200).json(results);
    });
  });
  
module.exports = router;



// by lara *************************


// (POST) add new task:
router.post("/tasks", (req, res) => {
  const { projectTitle, taskName, taskDescription, taskAssignee, taskStatus, taskDueDate } = req.body;

  const query = `
    INSERT INTO tasks (projectTitle, taskName, taskDescription, taskAssignee, taskStatus, taskDueDate)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [projectTitle, taskName, taskDescription, taskAssignee, taskStatus, taskDueDate], (err, result) => {
    if (err) {
  console.error('❌ Error inserting task:', err.sqlMessage || err);
  return res.status(500).json({ error: 'Database error', details: err.sqlMessage });
}

    res.status(201).json({ message: 'Task added successfully', taskId: result.insertId });
  });
});

module.exports = router;

// (PUT) Edit tasks:
router.put('/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { projectTitle, taskName, taskDescription, taskAssignee, taskStatus, taskDueDate } = req.body;

  const query = `
    UPDATE tasks SET 
      projectTitle = ?, 
      taskName = ?, 
      taskDescription = ?, 
      taskAssignee = ?, 
      taskStatus = ?, 
      taskDueDate = ?
    WHERE id = ?
  `;

  db.query(query, [projectTitle, taskName, taskDescription, taskAssignee, taskStatus, taskDueDate, taskId], (err, result) => {
    if (err) {
      console.error('Error updating task:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task updated successfully' });
  });
});

// (Delete) delete Tasks by id
router.delete('/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  const query = `DELETE FROM tasks WHERE id = ?`;

  db.query(query, [taskId], (err, result) => {
    if (err) {
      console.error('Error deleting task:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  });
});

//(GET) لعرض جميع المهام
// router.get('/tasks', (req, res) => {
//   const allowedSortFields = ['taskStatus', 'projectTitle', 'taskDueDate', 'taskAssignee'];
//   const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'taskStatus';

//   const query = `SELECT * FROM tasks ORDER BY ${sortBy}`;

//   db.query(query, (err, results) => {
//     if (err) {
//       console.error('Error fetching tasks:', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     res.status(200).json(results);
//   });
// });

router.get("/tasks/byAdmin/:adminName", (req, res) => {
  const adminName = req.params.adminName;

  const projectQuery = `
    SELECT title FROM projects WHERE adminName = ?
  `;

  db.query(projectQuery, [adminName], (err, projectResults) => {
    if (err) {
      console.error(" Error fetching admin's projects:", err);
      return res.status(500).json({ error: "Database error in projects query" });
    }

    if (projectResults.length === 0) {
      return res.status(200).json([]); 
    }

    const projectTitles = projectResults.map((p) => p.title);
    const placeholders = projectTitles.map(() => '?').join(',');

    const taskQuery = `
      SELECT * FROM tasks WHERE projectTitle IN (${placeholders})
    `;

    db.query(taskQuery, projectTitles, (err, taskResults) => {
      if (err) {
        console.error(" Error fetching tasks:", err);
        return res.status(500).json({ error: "Database error in tasks query" });
      }

      res.status(200).json(taskResults);
    });
  });
});


//(Get) show all  project 
router.get('/projects', (req, res) => {
  const query = 'SELECT * FROM projects';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(results);
  });
});

router.get("/projects/byAdmin/:adminName", (req, res) => {
  const { adminName } = req.params;
  const query = `SELECT * FROM projects WHERE adminName = ?`;

  db.query(query, [adminName], (err, results) => {
    if (err) {
      console.error(" Error fetching projects:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(results);
  });
});

router.get("/projectstudents/:projectTitle", (req, res) => {
  const { projectTitle } = req.params;
  const query = `SELECT studentUsername FROM projectstudents WHERE projectTitle = ?`;

  db.query(query, [projectTitle], (err, results) => {
    if (err) {
      console.error(" Error fetching project students:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(results);
  });
});

// (GET) Tasks for specific student
router.get("/tasks/student/:studentName", (req, res) => {
  const studentName = req.params.studentName;

  const query = `SELECT * FROM tasks WHERE taskAssignee = ?`;

  db.query(query, [studentName], (err, results) => {
    if (err) {
      console.error("Error fetching student's tasks:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(results);
  });
});

