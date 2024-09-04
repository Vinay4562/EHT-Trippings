const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default to 3000

// Connect to MongoDB using the URI from the .env file
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Define Mongoose schema and model
const incidentSchema = new mongoose.Schema({
    substationName: String,
    feederName: String,
    feederType: String,
    trippingDate: Date,
    chargeDate: Date,
    duration: String,
    trippingIndications: String,
    breakdownDeclared: String,
    faultIdentified: String,
    faultLocation: String,
    remarks: String
});

const Incident = mongoose.model('Incident', incidentSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'chantichanti2255', // Use environment variable or default secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts from this IP, please try again later.'
});

// Logging middleware
app.use(morgan('combined')); // or 'tiny', depending on your needs

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).send('Internal Server Error');
});

// Predefined credentials for login
const credentials = {
    "400KVSS Shankarpally": { username: "shankarpally400kv", password: "shankarpally@V959" },
    "400/220/132KVSS Kethireddypally": { username: "kethireddypally400kv", password: "kethireddypally@V943" },
    "220/132/33KVSS Tandur": { username: "tandur220kv", password: "tandur@V514" },
    "220/132KVSS Parigi": { username: "parigi220kv", password: "parigi@V326" },
    "220/132KV SS Chandanavally": { username: "chandanavally220kv", password: "chandanavally@V168" },
    "132/33KVSS Vikarabad": { username: "vikarabad132kv", password: "vikarabad@V156" },
    "132/33KVSS KODANGAL": { username: "kodangal132kv", password: "kodangal@V784" },
    "132/33KVSS Parigi": { username: "parigi132kv", password: "parigi@V127" },
    "132/33KVSS PUTTPAHAD": { username: "puttapahad132kv", password: "puttapahad@V198" },
    "132/33KV Kanakamamidi": { username: "kanakamamidi132kv", password: "kanakamamidi@V642" },
    "132/33KVSS Donthanpally": { username: "donthanpally132kv", password: "donthanpally@V848" },
    "132/33KVSS Sriranga Puram": { username: "srirangapuram132kv", password: "srirangapuram@V414" }
};

// Substation names and feeders
const substations = {
    "400KVSS Shankarpally": ["400KV Shankarpally - Maheshwaram - II", "400KV Shankarpally - Maheshwaram - I", "400KV Shankarpally- Narsapur - I", "400KV Shankarpally - Narsapur - II", "400KV Shankarpally -Kethireddypally-1", "400KV Shankarpally - Kethireddypally-2", "400KV Shankarpally - Nizamabad - I", "400KV Shankarpally - Nizamabad - II", "220KV Shankarpally - Parigi-1", "220KV Shankarpally - Parigi-2", "220KV Shankarpally - Thandur", "220KV Shankarpally - Gachibowli-1", "220KV Shankarpally - Gachibowli-2", "220KV Shankarpally -Kethireddypally", "220KV Shankarpally - Yeddumailaram-1", "220KV Shankarpally - Yeddumailaram-2", "220KV Shankarpally - Sadasivapet-1", "220KV Shankarpally - Sadasivapet-2"],
    "400/220/132KVSS Kethireddypally": ["400KV Shankarpally-1", "400KV Shankarpally-2", "400KV Suryapet 1", "400KV Suryapet 2", "400kV Raidurg-1", "400kV Raidurg-2", "220KV Shadnagar", "220KV Chegur", "220KV Yedddumailaram", "220KV Sankarpally", "220KV Chandanvally-1", "220KV Chandanvally-2", "132KV Kanakamamidi-1", "132KV Kanakamamidi-2"],
    "220/132/33KVSS Tandur": ["Shankarpally", "Sedam", "Parigi", "Kodangal", "RTS", "VCIL", "CCI-1", "CCI-2", "Penna Cements", "Clean Solar", "Winsol"],
    "220/132KVSS Parigi": ["220 KV Shankarpally-1", "220 KV Shankarpally-2", "220 KV Kosgi.-1", "220 KV Kosgi.-2", "132 KV Tandur", "132 Kv Vikarabad", "132 KV Parigi-1", "132 KV Parigi-2"],
    "220/132KV SS Chandanavally": ["220kV Kethireddypally -1", "220kV Kethireddypally -2", "Amazon-1", "Amazon-2"],
    "132/33KVSS Vikarabad": ["132KV Parigi", "132KV Dharmasagar", "132KV RAILWAYS"],
    "132/33KVSS KODANGAL": ["Puttapahad-1", "Puttapahad-2", "Kosgi-1", "Kosgi-2", "Tandur"],
    "132/33KVSS Parigi": ["132kV Parigi-I", "132kV Parigi-II", "132 KV Wind Power-1", "132 KV Wind Power-2", "132 KV Suguna"],
    "132/33KVSS PUTTPAHAD": ["132KV MAHUBNAGAR CKT1", "132KV MAHUBNAGAR CKT2", "132KV KODANGAL CKT1", "132KV KODANGAL CKT2", "Tandur"],
    "132/33KVSS KANAKAMAMIDI": ["132 KV KETHIREDDYPALLY-I", "132 KV KETHIREDDYPALLY-I"],
    "132/33KVSS Donthanpally": ["DHONTANPALLY-YEDHUMAILARAM", "DHONTANPALLY-DHARMASAGAR"],
    "132/33KVSS Sriranga Puram": ["132 KV Shadnagar", "132 KV Scan Energy"]
};

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated && req.session.substationName) {
        return next();
    } else {
        res.clearCookie('connect.sid'); // Clear session cookie
        return res.redirect('/login.html');
    }
}

// Apply middleware to protected routes
app.use('/protected', ensureAuthenticated);

app.get('/trippings.html', ensureAuthenticated, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'public', 'trippings.html'));
});

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Cache-Control', 'post-check=0, pre-check=0');
    res.setHeader('Pragma', 'no-cache');
    next();
});


// Endpoint to handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    let authenticatedSubstation = null;

    for (const [substation, creds] of Object.entries(credentials)) {
        if (username === creds.username && password === creds.password) {
            authenticatedSubstation = substation;
            break;
        }
    }

    if (authenticatedSubstation) {
        req.session.authenticated = true;
        req.session.substationName = authenticatedSubstation;
        res.redirect('/trippings.html');
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Error logging out');
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect('/login.html'); // Redirect to login page
    });
});

// Endpoint to submit new incident data
app.post('/submit', async (req, res) => {
    try {
        const incident = new Incident(req.body);
        await incident.save();
        res.status(200).send('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send('Error saving data');
    }
});

// Endpoint to fetch incidents by substation and feeder
app.get('/fetch/:substation/:feeder', async (req, res) => {
    const { substation, feeder } = req.params;
    console.log(`Fetching data for Substation: ${substation}, Feeder: ${feeder}`);

    try {
        const incidents = await Incident.find({ substationName: substation, feederName: feeder });
        res.json(incidents);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

// Endpoint to fetch all incidents by substation
app.get('/fetch/:substation', async (req, res) => {
    const substation = req.params.substation;
    console.log(`Fetching data for substation: ${substation}`);

    try {
        const incidents = await Incident.find({ substationName: substation });
        const feeders = [...new Set(incidents.map(incident => incident.feederName))];
        res.json({ incidents, feeders });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Endpoint to fetch all feeders
app.get('/feeders', async (req, res) => {
    try {
        const incidents = await Incident.find({});
        const feeders = [...new Set(incidents.map(incident => incident.feederName))];
        res.json({ feeders });
    } catch (error) {
        console.error('Error fetching feeders:', error);
        res.status(500).json({ error: 'Failed to fetch feeders' });
    }
});

app.put('/update/:id', async (req, res) => {
    const recordId = req.params.id;
    const updatedData = req.body;

    console.log('Updating record with ID:', recordId);
    console.log('Update data:', updatedData);

    try {
        const result = await Incident.findByIdAndUpdate(recordId, updatedData, { new: true });

        if (!result) {
            console.log('No record found with the provided ID.');
            return res.status(404).json({ message: 'Record not found' });
        }

        console.log('Update result:', result);
        res.status(200).json({ message: 'Record updated successfully', data: result });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ message: 'Error updating record', error });
    }
});

// Endpoint to delete an incident by ID
app.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const incident = await Incident.findByIdAndDelete(id);

        if (!incident) {
            return res.status(404).send('Incident not found');
        }

        res.status(200).send('Data deleted successfully');
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).send('Error deleting data');
    }
});

// Endpoint to fetch all incidents by date range and return all substations and feeders
app.get('/fetch-data', async (req, res) => {
    const { fromDate, toDate } = req.query;

    try {
        // Find incidents within the date range
        const incidents = await Incident.find({
            trippingDate: { $gte: new Date(fromDate), $lte: new Date(toDate) }
        });

        // Find all unique substations
        const allIncidents = await Incident.find({});
        const remainingSubstations = [...new Set(allIncidents.map(incident => incident.substationName))];
        const feeders = remainingSubstations.reduce((acc, substation) => {
            const feedersForSubstation = [...new Set(allIncidents.filter(incident => incident.substationName === substation).map(incident => incident.feederName))];
            acc[substation] = feedersForSubstation;
            return acc;
        }, {});

        res.json({
            message: incidents.length === 0 ? "No data found" : "Data found",
            incidents,
            remainingSubstations,
            feeders
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});

app.get('/current-substation', ensureAuthenticated, (req, res) => {
    const substation = req.session.substationName;
    console.log('Current substation from session:', substation); // Debugging
    
    if (substation) {
        const feeders = substations[substation] || [];
        res.json({ substation, feeders });
    } else {
        res.status(404).send('Substation not found');
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
