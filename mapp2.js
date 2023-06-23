
const express = require('express');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'checklist2';

// Collection Name
const collectionName = 'list';

// Create a new MongoClient
const client = new MongoClient(url);

// Connect to MongoDB
async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
// Middleware to handle MongoDB errors
function handleMongoError(res, error) {
  console.error('MongoDB Error:', error);
  res.status(500).json({ error: 'An error occurred' });
}

// Retrieve all items when checklist name is given
app.get('/checklists/:name', async (req, res) => {
  const checklistName = req.params.name;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const checklists = await collection.find({ checklist: checklistName }).toArray();

    // Iterate through the checklists and map each item to include the checked status
    const items = checklists.flatMap(checklist => {
      return checklist.items.map(item => {
        return {
          name: item.name,
          checked: item.checked
        };
      });
    });

    res.json(items);
  } catch (error) {
    handleMongoError(res, error);
  }
});



// Retrieve all the checklist names
app.get('/checklists', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const checklistNames = await collection.distinct('checklist');

    res.json(checklistNames);
  } catch (error) {
    handleMongoError(res, error);
  }
});
// Delete a checklist
app.delete('/checklists/:name', async (req, res) => {
  const checklistName = req.params.name;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.deleteMany({ checklist: checklistName });

    res.sendStatus(204); // No Content
  } catch (error) {
    handleMongoError(res, error);
  }
});


// Add items to a checklist
app.post('/checklists/:name/items', async (req, res) => {
  const checklistName = req.params.name;
  const { items } = req.body;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Convert each item to the new nested structure with name and checked properties
    const updatedItems = items.map(item => ({ name: item, checked: false }));

    await collection.updateOne(
      { checklist: checklistName },
      { $push: { items: { $each: updatedItems } } }
    );

    res.sendStatus(200);
  } catch (error) {
    handleMongoError(res, error);
  }
});


app.delete('/checklists/:name/items', async (req, res) => {
  const checklistName = req.params.name;
  const { items } = req.body;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.updateOne(
      { checklist: checklistName },
      { $pull: { items: { name: { $in: items } } } }
    );

    res.sendStatus(200);
  } catch (error) {
    handleMongoError(res, error);
  }
});


// Create new checklists with blank items
app.post('/checklists', async (req, res) => {
  const { checklistName } = req.body;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne({ checklist: checklistName, items: [] });

    res.sendStatus(200);
  } catch (error) {
    handleMongoError(res, error);
  }
});


// Update the checked status of items in a checklist
app.put('/checklists/:name/items', async (req, res) => {
  const checklistName = req.params.name;
  const { item, checked } = req.body; // Update this line

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const filter = { checklist: checklistName, 'items.name': item }; // Update this line
    const update = { $set: { 'items.$.checked': checked } }; // Update this line

    await collection.updateOne(filter, update);

    res.sendStatus(200);
  } catch (error) {
    handleMongoError(res, error);
  }
});


app.put('/checklists/:name/reset', async (req, res) => {
  const checklistName = req.params.name;

  try {
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const filter = { checklist: checklistName };
    const update = { $set: { 'items.$[].checked': false } };

    await collection.updateMany(filter, update);

    res.sendStatus(200);
  } catch (error) {
    handleMongoError(res, error);
  }
});




// Start the server
async function startServer() {
  await connectToDB();

  app.listen(3003, () => {
    console.log('Server is running on port 3003');
  });
}
startServer();
