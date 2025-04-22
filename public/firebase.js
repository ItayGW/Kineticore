// הגדרות Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCUHUAwhenz_p25Rc3gwxif9rBsqM_RJdk",
  authDomain: "kineticore-67d30.firebaseapp.com",
  databaseURL: "https://kineticore-67d30-default-rtdb.firebaseio.com/",
  projectId: "kineticore-67d30",
  storageBucket: "kineticore-67d30.appspot.com",
  messagingSenderId: "46174776153",
  appId: "1:46174776153:web:c6b7ec4e8b5e049923fa48"
};

// אתחול Firebase
let app;
try {
  app = firebase.initializeApp(firebaseConfig);
} catch (error) {
  // טיפול בשגיאת אתחול
}

const auth = firebase.auth();
const database = firebase.database();

// בדיקת אתחול Firebase
if (!app) {
  console.error('Firebase app not initialized');
  alert('Error: Firebase not initialized. Please refresh the page.');
}

/**
* התחברות משתמש
* @param {string} email - כתובת אימייל
* @param {string} password - סיסמה
*/
function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // שליפת סוג המשתמש ממסד הנתונים
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value')
          .then((snapshot) => {
            const userData = snapshot.val();
            if (!userData) {
              reject(new Error('User data not found'));
              return;
            }

            const userType = userData.userType;

            // הפנייה לפי סוג המשתמש
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
* הרשמת משתמש ושמירת נתוניו במסד הנתונים
* @param {string} fullName - שם מלא
* @param {string} email - כתובת אימייל
* @param {string} password - סיסמה
* @param {string} confirmPassword - אימות סיסמה
* @param {string} userType - סוג משתמש (רופא או מטופל)
*/
function signUpUser(fullName, email, password, confirmPassword, userType) {
  if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
  }

  auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
          const user = userCredential.user;

          // שמירת נתוני המשתמש במסד הנתונים
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

// הרשמת רופא
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

// יצירת חשבון מטופל
function createPatientAccount(email, password, fullName, doctorId) {
  return new Promise((resolve, reject) => {
    // אם doctorId לא מוגדר, יש להפסיק
    if (!doctorId) {
      reject(new Error('Doctor ID is missing'));
      return;
    }

    // יצירת חשבון מטופל
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const patientUser = userCredential.user;

        // שמירת נתוני המטופל במסד הנתונים כולל doctorId
        return firebase.database().ref('users/' + patientUser.uid).set({
          name: fullName,
          email: email,
          userType: 'patient',
          doctorId: doctorId  // שמירת doctorId
        });
      })
      .then(() => {
        resolve(); // הצלחה בהוספת המטופל
      })
      .catch((error) => {
        reject(error); // טיפול בשגיאה
      });
  });
}

// קבלת רשימת מטופלים של רופא
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

// קבלת הרופא של מטופל
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
        reject(error);
      });
  });
}

// שליחת הודעה
function sendMessage(recipientId, message) {
  return new Promise((resolve, reject) => {
    const senderId = auth.currentUser.uid;
    const timestamp = Date.now();
    
    database.ref('messages').push({
      senderId: senderId,
      recipientId: recipientId,
      message: message,
      timestamp: timestamp
    })
    .then(() => {
      resolve();
    })
    .catch((error) => {
      reject(error);
    });
  });
}

// קבלת הודעות
function getMessages(recipientId) {
  return new Promise((resolve, reject) => {
    database.ref('messages')
      .orderByChild('recipientId')
      .equalTo(recipientId)
      .once('value')
      .then((snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        resolve(messages);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// בדיקת סוג משתמש והפניה לדף המתאים
function checkUserTypeAndRedirect() {
  const user = auth.currentUser;
  if (user) {
    database.ref('users/' + user.uid).once('value')
      .then((snapshot) => {
        const userData = snapshot.val();
        if (userData.userType === 'doctor') {
          window.location.href = 'HomeDoctors.html';
        } else if (userData.userType === 'patient') {
          window.location.href = 'HomePatients.html';
        }
      })
      .catch((error) => {
        console.error('Error checking user type:', error);
      });
  }
}

// יצירת משתמש חדש
function createUser(email, password, userData) {
  return new Promise((resolve, reject) => {
    // יצירת מופע אימות זמני
    const tempApp = firebase.initializeApp(firebaseConfig, 'temp');
    const tempAuth = tempApp.auth();
    
    // יצירת המשתמש
    tempAuth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // שמירת נתוני המשתמש
        return database.ref('users/' + user.uid).set(userData)
          .then(() => {
            // התנתקות ומחיקת המופע הזמני
            return tempAuth.signOut()
              .then(() => {
                tempApp.delete();
                resolve(user.uid);
              });
          });
      })
      .catch((error) => {
        // ניקוי במקרה של שגיאה
        tempApp.delete();
        reject(error);
      });
  });
}
