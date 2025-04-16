// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCUHUAwhenz_p25Rc3gwxif9rBsqM_RJdk",
  authDomain: "kineticore-67d30.firebaseapp.com",
  databaseURL: "https://kineticore-67d30-default-rtdb.firebaseio.com/",
  projectId: "kineticore-67d30",
  storageBucket: "kineticore-67d30.appspot.com",
  messagingSenderId: "46174776153",
  appId: "1:46174776153:web:c6b7ec4e8b5e049923fa48"
};

// Initialize Firebase
let app;
try {
  app = firebase.initializeApp(firebaseConfig);
} catch (error) {
  // Silently handle initialization error
}

const auth = firebase.auth();
const database = firebase.database();

// Check if Firebase is properly initialized
if (!app) {
  console.error('Firebase app not initialized');
  alert('Error: Firebase not initialized. Please refresh the page.');
}

/**
* @param {string} email 
* @param {string} password 
*/
function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Fetch user type from Realtime Database
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value')
          .then((snapshot) => {
            const userData = snapshot.val();
            if (!userData) {
              reject(new Error('User data not found'));
              return;
            }

            const userType = userData.userType;

            // Redirect based on user type
            if (userType === 'doctor') {
              window.location.href = 'HomeDoctors.html';
              resolve();
            } else if (userType === 'patient') {
              window.location.href = 'HomePatients.html';
              resolve();
            } else {
              reject(new Error('Invalid user type'));
            }
          })
          .catch((error) => {
            reject(new Error('Error fetching user data'));
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
* Signs up the user and saves their data (fullName and userType) in the Realtime Database.
* @param {string} fullName - The full name of the user.
* @param {string} email - The email address of the user.
* @param {string} password - The password of the user.
* @param {string} confirmPassword - The confirmation of the password.
* @param {string} userType - The type of user (doctor or patient).
*/
function signUpUser(fullName, email, password, confirmPassword, userType) {
  if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
  }

  auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
          const user = userCredential.user;

          // Save user data to Realtime Database
          database.ref('users/' + user.uid).set({
              fullName: fullName,
              email: email,
              userType: userType
          }).then(() => {
              alert('Sign-up successful! Redirecting to login page.');
              window.location.href = 'Login.html';
          }).catch((error) => {
              console.error('Error saving user data:', error);
              alert('Error saving user data.');
          });
      })
      .catch((error) => {
          alert("Error: " + error.message);
      });
}

// Function to sign up a doctor
function signUpDoctor(email, password, name, medicalLicense, specialization) {
  return new Promise((resolve, reject) => {
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userData = {
          email: email,
          name: name,
          userType: 'doctor',
          medicalLicense: medicalLicense,
          specialization: specialization,
          patients: {}
        };
        return database.ref('users/' + user.uid).set(userData);
      })
      .then(() => {
        resolve('Doctor registered successfully');
      })
      .catch((error) => {
        console.error('Error in signUpDoctor:', error);
        reject(error.message);
      });
  });
}

// Function to create a patient account
function createPatientAccount(email, password, name, doctorId) {
  return new Promise((resolve, reject) => {
    // First, add the patient to the doctor's patient list
    database.ref('users/' + doctorId + '/patients').once('value')
      .then((snapshot) => {
        const patients = snapshot.val() || {};
        const tempPatientId = 'temp_' + Date.now(); // Temporary ID
        patients[tempPatientId] = {
          name: name,
          email: email,
          status: 'pending'
        };
        return database.ref('users/' + doctorId + '/patients').set(patients)
          .then(() => tempPatientId);
      })
      .then((tempPatientId) => {
        // Create a new auth instance for patient creation
        const tempApp = firebase.initializeApp(firebaseConfig, 'temp');
        const tempAuth = tempApp.auth();
        
        // Create the patient account
        return tempAuth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const patientUser = userCredential.user;
            
            // Update the patient data
            return database.ref('users/' + patientUser.uid).set({
              name: name,
              email: email,
              userType: 'patient',
              doctorId: doctorId
            })
            .then(() => {
              // Update the doctor's patient list with the real patient ID
              return database.ref('users/' + doctorId + '/patients').once('value')
                .then((snapshot) => {
                  const patients = snapshot.val();
                  if (patients && patients[tempPatientId]) {
                    delete patients[tempPatientId];
                    patients[patientUser.uid] = {
                      name: name,
                      email: email
                    };
                    return database.ref('users/' + doctorId + '/patients').set(patients);
                  }
                });
            })
            .then(() => {
              // Sign out and delete the temporary auth instance
              return tempAuth.signOut()
                .then(() => {
                  tempApp.delete();
                });
            });
          });
      })
      .then(() => {
        resolve();
      })
      .catch((error) => {
        // Clean up the temporary patient entry if there was an error
        database.ref('users/' + doctorId + '/patients').once('value')
          .then((snapshot) => {
            const patients = snapshot.val();
            if (patients) {
              Object.keys(patients).forEach(key => {
                if (key.startsWith('temp_')) {
                  delete patients[key];
                }
              });
              return database.ref('users/' + doctorId + '/patients').set(patients);
            }
          })
          .catch(() => {});
        reject(error);
      });
  });
}

// Function to get a list of patients for a doctor
function getDoctorPatients(doctorId) {
  return new Promise((resolve, reject) => {
    database.ref('users/' + doctorId + '/patients').once('value')
      .then((snapshot) => {
        const patients = [];
        snapshot.forEach((childSnapshot) => {
          patients.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        resolve(patients);
      })
      .catch((error) => {
        console.error('Error getting doctor patients:', error);
        reject(error);
      });
  });
}

// Function to get a patient's doctor
function getPatientDoctor(patientId) {
  return new Promise((resolve, reject) => {
    database.ref('users/' + patientId).once('value')
      .then((snapshot) => {
        const patientData = snapshot.val();
        if (patientData && patientData.doctorId) {
          return database.ref('users/' + patientData.doctorId).once('value');
        } else {
          throw new Error('No doctor assigned');
        }
      })
      .then((snapshot) => {
        const doctorData = snapshot.val();
        resolve({
          id: snapshot.key,
          ...doctorData
        });
      })
      .catch((error) => {
        console.error('Error getting patient doctor:', error);
        reject(error);
      });
  });
}

// Function to send a message
function sendMessage(recipientId, message) {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser;
    if (!user) {
      reject('No user is currently logged in.');
      return;
    }

    const messageRef = database.ref('messages').push();
    messageRef.set({
      senderId: user.uid,
      recipientId: recipientId,
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
      resolve('Message sent successfully');
    })
    .catch((error) => {
      console.error('Error sending message:', error);
      reject('Failed to send message');
    });
  });
}

// Function to get messages
function getMessages(recipientId) {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser;
    if (!user) {
      reject('No user is currently logged in.');
      return;
    }

    const messagesRef = database.ref('messages')
      .orderByChild('timestamp')
      .limitToLast(50);

    messagesRef.once('value', (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if ((message.senderId === user.uid && message.recipientId === recipientId) ||
            (message.senderId === recipientId && message.recipientId === user.uid)) {
          messages.push({
            id: childSnapshot.key,
            ...message
          });
        }
      });
      resolve(messages);
    }, (error) => {
      console.error('Error getting messages:', error);
      reject('Failed to get messages');
    });
  });
}

// Function to check user type and redirect
function checkUserTypeAndRedirect() {
  const user = auth.currentUser;
  if (user) {
    const userRef = database.ref('users/' + user.uid);
    userRef.once('value', (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        if (userData.userType === 'doctor') {
          window.location.href = 'HomeDoctors.html';
        } else if (userData.userType === 'patient') {
          window.location.href = 'HomePatients.html';
        }
      } else {
        window.location.href = 'Login.html';
      }
    });
  } else {
    window.location.href = 'Login.html';
  }
}

// Function to create a new user without signing them in
function createUser(email, password, userData) {
  return new Promise((resolve, reject) => {
    // Create a temporary auth instance
    const tempAuth = firebase.auth();
    
    // Create the user
    tempAuth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // Set the user data
        return database.ref('users/' + user.uid).set(userData)
          .then(() => {
            // Sign out the temporary auth
            return tempAuth.signOut();
          })
          .then(() => {
            resolve(user.uid);
          });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
