const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');

const cors = require('cors'); // Add this line


const app = express();
// Fetch all checklists
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// const app = express();
const port = 3003;

// MongoDB Connection URL
const mongoURL = 'mongodb://localhost:27017';

// Database Name
const dbName = 'checklist';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



// API endpoint to retrieve all checklists
app.get('/checklists', (req, res) => {
  console.log('hello');
  // Connect to MongoDB
  mongodb.MongoClient.connect(mongoURL, (err, client) => {
    if (err) {
      res.status(500).send('Error connecting to the database');
      return;
    }

    const db = client.db(dbName);
    const collection = db.collection('list');

    // Fetch all checklists
    collection.find({}).toArray((err, checklists) => {
      if (err) {
        res.status(500).send('Error retrieving checklists from the database');
        return;
      }
      console.log('checklists',checklists);
      res.json(checklists);
      client.close();
    });
  });
});

// API endpoint to create a new checklist
app.post('/checklists', (req, res) => {
  const checklist = {
    checklist: req.body.checklist,
    items: req.body.items || [],
  };

  // Connect to MongoDB
  mongodb.MongoClient.connect(mongoURL, (err, client) => {
    if (err) {
      res.status(500).send('Error connecting to the database');
      return;
    }

    const db = client.db(dbName);
    const collection = db.collection('list');

    // Insert the new checklist
    collection.insertOne(checklist, (err) => {
      if (err) {
        res.status(500).send('Error creating the new checklist');
        return;
      }

      res.sendStatus(201);
      client.close();
    });
  });
});

// API endpoint to update an existing checklist
app.put('/checklists/:id', (req, res) => {
  const checklistId = new mongodb.ObjectID(req.params.id);
  const updatedChecklist = {
    checklist: req.body.checklist,
    items: req.body.items || [],
  };

  // Connect to MongoDB
  mongodb.MongoClient.connect(mongoURL, (err, client) => {
    if (err) {
      res.status(500).send('Error connecting to the database');
      return;
    }

    const db = client.db(dbName);
    const collection = db.collection('list');

    // Update the checklist
    collection.updateOne({ _id: checklistId }, { $set: updatedChecklist }, (err) => {
      if (err) {
        res.status(500).send('Error updating the checklist');
        return;
      }

      res.sendStatus(200);
      client.close();
    });
  });
});

// API endpoint to delete a checklist
app.delete('/checklists/:id', (req, res) => {
  const checklistId = new mongodb.ObjectID(req.params.id);

  // Connect to MongoDB
  mongodb.MongoClient.connect(mongoURL, (err, client) => {
    if (err) {
      res.status(500).send('Error connecting to the database');
      return;
    }

    const db = client.db(dbName);
    const collection = db.collection('list');

    // Delete the checklist
    collection.deleteOne({ _id: checklistId }, (err) => {
      if (err) {
        res.status(500).send('Error deleting the checklist');
        return;
      }

      res.sendStatus(200);
      client.close();
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
