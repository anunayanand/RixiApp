const mongoose = require('mongoose');
require('dotenv').config();

const Bootcamp = require('./models/Bootcamp');
const BootcampUser = require('./models/BootcampUser');

async function runMigration() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    console.log("Migrating Bootcamps...");
    const bootcampsCollection = mongoose.connection.db.collection('bootcamps');
    const bootcamps = await bootcampsCollection.find({}).toArray();
    const sessionMap = {}; // Maps bootcamp_id -> { "old_string_id": new_number_id }

    for (const bc of bootcamps) {
      let modified = false;
      const mapForBc = {};

      for (let i = 0; i < bc.sessions.length; i++) {
        const s = bc.sessions[i];
        const oldId = s.session_id;
        const newId = i + 1; // Generate numeric ID

        // If it's a string and looks like a name (not just a number)
        if (typeof oldId === 'string' && isNaN(Number(oldId))) {
          s.session_name = oldId; // Store old string as name
          s.session_id = newId;   // Store number as ID
          
          // Add to lookup map using normalized strings
          mapForBc[oldId] = newId;
          mapForBc[oldId.trim()] = newId;
          mapForBc[oldId.toLowerCase().replace(/\s+/g, '')] = newId;
          modified = true;
        } else {
          // Ensure session_name exists even if session_id is already a number
          if (!s.session_name) {
            s.session_name = `Session ${newId}`;
            modified = true;
          }
          // Add existing number to map just in case
          mapForBc[String(oldId)] = oldId;
          mapForBc[String(oldId).toLowerCase().replace(/\s+/g, '')] = oldId;
        }
      }

      sessionMap[bc._id.toString()] = mapForBc;

      if (modified) {
        await bootcampsCollection.updateOne(
          { _id: bc._id },
          { $set: { sessions: bc.sessions } }
        );
        console.log(`Updated bootcamp: ${bc.name}`);
      }
    }

    console.log("Migrating BootcampUsers...");
    const usersCollection = mongoose.connection.db.collection('bootcampusers');
    const users = await usersCollection.find({}).toArray();
    
    for (const user of users) {
      let modified = false;

      for (const eb of user.enrolledBootcamps) {
        if (!eb.bootcamp_id || !eb.attendance) continue;
        const bcMap = sessionMap[eb.bootcamp_id.toString()];
        
        if (!bcMap) continue;

        for (let i = 0; i < eb.attendance.length; i++) {
          const a = eb.attendance[i];
          
          if (typeof a.session_id === 'string' && isNaN(Number(a.session_id))) {
            const match = a.session_id.match(/Session\s*(\d+)/i);
            if (match && match[1]) {
              a.session_id = parseInt(match[1], 10);
              modified = true;
            } else {
              // Try to find it in bcMap as fallback
              const stripped = a.session_id.toLowerCase().replace(/\s+/g, '');
              const newId = bcMap[stripped] || bcMap[a.session_id.trim()] || bcMap[a.session_id];
              
              if (newId !== undefined) {
                a.session_id = newId;
                modified = true;
              }
            }
          }
        }
      }

      if (modified) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { enrolledBootcamps: user.enrolledBootcamps } }
        );
        console.log(`Updated user: ${user.name}`);
      }
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
