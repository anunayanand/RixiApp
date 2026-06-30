// const mongoose = require("mongoose");

// // Helper: recursively sync doc fields with schema (add + remove)
// function syncWithSchema(doc, schema) {
//   let updated = false;

//   // STEP 1: Remove fields not in schema
//   for (const key of Object.keys(doc.toObject ? doc.toObject() : doc)) {
//     if (!schema.paths[key] && !["_id", "__v"].includes(key)) {
//       delete doc[key];
//       updated = true;
//       // console.log(`🗑️ Removed extra field: ${key}`);
//     }
//   }

//   // STEP 2: Add missing defaults or recurse for subdocs
//   for (const key in schema.paths) {
//     const path = schema.paths[key];

//     // Skip Mongo internal fields
//     if (["_id", "__v"].includes(key)) continue;

//     const defaultValue = path.defaultValue ?? path.options.default;

//     if (path.instance === "Array") {
//       if (!Array.isArray(doc[key])) {
//         doc[key] = [];
//         updated = true;
//       } else if (path.schema) {
//         doc[key].forEach(item => {
//           const changed = syncWithSchema(item, path.schema);
//           if (changed) updated = true;
//         });
//       }
//     } else if (path.instance === "Embedded" || path.instance === "Mixed") {
//       if (!doc[key]) {
//         doc[key] = defaultValue ?? {};
//         updated = true;
//       } else if (path.schema) {
//         const changed = syncWithSchema(doc[key], path.schema);
//         if (changed) updated = true;
//       }
//     } else {
//       if (doc[key] === undefined) {
//         doc[key] = typeof defaultValue === "function" ? defaultValue() : defaultValue;
//         updated = true;
//       }
//     }
//   }

//   return updated;
// }

// // Auto-update all models efficiently using a cursor
// async function autoUpdateAllModels() {
//   try {
//     const modelNames = mongoose.modelNames();
//     for (const name of modelNames) {
//       const Model = mongoose.model(name);
//       console.log(`🔹 Processing model: ${name}`);

//       // Use a cursor to avoid loading all docs into memory
//       const cursor = Model.find().cursor();
//       for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
//         const changed = syncWithSchema(doc, Model.schema);
//         if (changed) {
//           await doc.save();
//           // console.log(`   ✅ Synced document _id: ${doc._id}`);
//         }
//       }
//     }

//     console.log("🎉 All models synced with their schemas (added + removed fields).");
//   } catch (err) {
//     console.error("❌ Error auto-updating models:", err);
//   }
// }

// // Connect to Mongo and run updater
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(async () => {
//   console.log("MongoDB connected");
//   await autoUpdateAllModels();
//   mongoose.connection.close();
// }).catch(err => console.error("MongoDB connection error:", err));
