

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));



// Utility: List all projects
function getProjects() {
  return fs.readdirSync(DATA_DIR).map(f => path.basename(f, '.txt'));
}

// Utility: Load tasks for a project
function loadTasks(subject, project) {
  const filePath = path.join(DATA_DIR, `${subject}__${project}.txt`);
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return data.split('\n').filter(line => line.trim() !== '');
}

// Utility: Save tasks
function saveTasks(subject, project, tasks) {
  const filePath = path.join(DATA_DIR, `${subject}__${project}.txt`);
  fs.writeFileSync(filePath, tasks.join('\n'), 'utf-8');
}



// Utility: Get a map of subjects → projects
function getSubjectProjects() {
  const map = {};

  const files = fs.readdirSync(DATA_DIR);
  files.forEach(filename => {
    const [subject, project] = filename.replace('.txt', '').split('__');
    if (!subject || !project) return;
    if (!map[subject]) map[subject] = [];
    if (!map[subject].includes(project)) {
      map[subject].push(project);
    }
  });

  return map;
}

// Show project view
app.get('/', (req, res) => {
  const subject = req.query.subject || 'general';
  const project = req.query.project || 'default';

  const filePath = path.join(DATA_DIR, `${subject}__${project}.txt`);
  let tasks = [];

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    tasks = data.split('\n').filter(line => line.trim() !== '');
  }

  const subjectProjects = getSubjectProjects();

  res.render('index', {
    tasks,
    project,
    subject,
    projects: subjectProjects[subject] || [],
    subjects: Object.keys(subjectProjects)
  });
});



// Add new task
app.post('/add', (req, res) => {
  const { subject, project, task } = req.body;

  if (!subject || !project || !task) {
    return res.redirect('/');
  }

  const filePath = path.join(DATA_DIR, `${subject}__${project}.txt`);

  let tasks = [];
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    tasks = data.split('\n').filter(line => line.trim() !== '');
  }

  tasks.push(task);
  fs.writeFileSync(filePath, tasks.join('\n'), 'utf-8');

  res.redirect(`/?subject=${subject}&project=${project}`);
});



// Delete task
app.post('/delete', (req, res) => {
  const { subject, project, index } = req.body;
  const tasks = loadTasks(subject, project);
  tasks.splice(index, 1);
  saveTasks(subject, project, tasks);
  res.redirect(`/?subject=${subject}&project=${project}`);
});

// Create new project
app.post('/create-project', (req, res) => {
  const { subject, project } = req.body;
  const safeProject = project.trim().toLowerCase().replace(/\s+/g, '-'); // optional cleanup
  const filePath = path.join(DATA_DIR, `${subject}__${safeProject}.txt`);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf-8');
  }

  res.redirect(`/?subject=${subject}&project=${safeProject}`);
});


// DELETE PROJECT ROUTE
app.post('/delete-project', (req, res) => {
  const project = req.body.project;
  const filePath = path.join(DATA_DIR, `${project}.txt`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  res.redirect('/');
});





app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
