const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
//console.log(getFirestore);

const serviceAccount = require("../onefinancial-firebase-db-firebase-adminsdk-g68wg-51d8411d94.json");
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Replace with your service account JSON
    databaseURL: "https://onefinancial-firebase-db.firebaseio.com",
  });
}

const firestoreDB = getFirestore("one-fi-cloud-firestore");

//console.log(db);

async function saveFirestoreData(collectionName, payload) {
  try {
    const collectionRef = firestoreDB
      .collection(collectionName)
      .doc(payload.uid);
    console.log(collectionRef);
    await collectionRef.set(payload, { merge: true });
    console.log("Data successfully saved to Firestore for collection: ", collectionName);
  } catch (error) {
    console.error(
      "Error saving data to Firestore for collection:",
      collectionName,
      error
    );
    throw error;
  }
}

module.exports = { admin, firestoreDB, saveFirestoreData };
