import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = 10;
const uri = "mongodb+srv://shauntelbrady:Password1@cluster0.qylcvtx.mongodb.net/";
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');


async function connectToMongoDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB Atlas!");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}
connectToMongoDB();

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

const patientSchema = new mongoose.Schema({
  fullname: String,
  emailaddress: String,
  dateOfBirth: Date,
  contactNumber: String,
  lastDoctorVisit: Date,
  illnessDescription: String,
  doctorName: String
});

const User = new mongoose.model("User", userSchema);
const patient = new mongoose.model("Patient", patientSchema);

// Get auth page
app.get("/", (req, res) => {
  res.render("auth.ejs");
});

// Get home page
app.get("/home", (req, res) => {
  res.render("home.ejs");
});

// Get registration page
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// Get login page
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// Get add patient
app.get("/addPatient", (req, res) => {
  res.render("addPatient.ejs");
});

// Get all patients data
app.get('/viewPatients', async (req, res) => {
  try {
    const patients = await patient.find({});
    res.render('viewPatients', { patients: patients });
  } catch (error) {
    console.error("Error rendering viewPatients:", error);
    res.render('viewPatients', { patients: [] });
  }
});

// Get update patient view when view button is clicked
app.get("/updatePatientView/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const patientData = await patient.findOne({ _id: id }).exec();

    if (patientData) {
      res.render('updatePatient', { patient: patientData });
    } else {
      res.redirect("/viewPatients");
    }
  } catch (error) {
    console.error("Error rendering updatePatient:", error);
    res.redirect("/viewPatients");
  }
});

// Update patient record
app.post('/updatePatient/:id', (req, res) => {
  const id = req.params.id;
  const updatePatient = {
    fullname: req.body.fullname,
    emailaddress: req.body.emailaddress,
    dateOfBirth: req.body.birthdate,
    contactNumber: req.body.contact,
    lastDoctorVisit: req.body.lastDoctorVisit,
    illnessDescription: req.body.illness,
    doctorName: req.body.doctorname
  };
  patient.findByIdAndUpdate(id, updatePatient, { new: true })
    .then((updatedPatient) => {
      res.redirect('/viewPatients');
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/addPatient');
    });
});

// Post registration info
app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });    
        newUser.save()
            .then(() => {
                res.render("home");
            })
            .catch((err) => {
                console.log(err);
            });    
    });
});

// Post login page
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username })
    .then(foundUser => {
        if (!foundUser) {
          console.log("User not found");
        } else if (foundUser) {
          bcrypt.compare(password, foundUser.password, function(err, result) {
              if (result === true) {
                res.redirect("/viewPatients");
              }
            });
        } else {
          res.redirect("/");
        }
    })
    .catch(err => {
        console.log(err);
    });
});


// Post patient record
app.post('/addPatient', (req, res) => {
  const newPatient = new patient({
    fullname: req.body.fullname,
    emailaddress: req.body.emailaddress,
    dateOfBirth: req.body.birthdate,
    contactNumber: req.body.contact,
    lastDoctorVisit: req.body.lastDoctorVisit,
    illnessDescription: req.body.illness,
    doctorName: req.body.doctorname
  });
  newPatient.save()
    .then(() => {
      // After saving the patient, redirect to the '/viewPatients' page
      res.redirect('/viewPatients');
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/addPatient');
    });
});

// Delete patient record
app.post("/deletePatient/:id", (req, res) => {
  try {
    let id = req.params.id;
    console.log(id);
    const deletePatient = () => {
      return patient.deleteOne({ _id: id }).exec();
    };
    deletePatient().then(() => {
        res.redirect('/viewPatients');
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.error("Error for check endpoint", error);
  }
});

// To listen to port
app.listen(port, function(){
console.log("Server is running on port 3000");
});
