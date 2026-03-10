const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function exportData() {
    let client;
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined. Please verify the .env file.");
        }

        console.log("Connecting to MongoDB...");
        client = new MongoClient(uri);
        await client.connect();
        console.log("Connected successfully!");

        const dbName = "test"; 
        const db = client.db(dbName);

        // Generate dynamic folder name based on current date
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yy = String(date.getFullYear()).slice(-2);
        const folderName = `Backup [${dd}-${mm}-${yy}]`;
        
        // Folder path in the same 'utilities' folder
        const folderPath = path.join(__dirname, folderName);

        // Create the backup folder if it does not exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Created backup folder: ${folderName}`);
        }

        // Get all collections in the database
        const collections = await db.listCollections().toArray();
        if (collections.length === 0) {
            console.log(`No collections found in the '${dbName}' database.`);
            return;
        }

        console.log(`Found ${collections.length} collections. Starting download...`);

        // Fetch data and save as JSON file for each collection
        for (const col of collections) {
            const collectionName = col.name;
            const data = await db.collection(collectionName).find({}).toArray();

            const filePath = path.join(folderPath, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            console.log(`Saved ${data.length} documents from '${collectionName}'`);
        }

        console.log(`\n✅ All Data Exported Successfully into '${folderName}'`);
        
    } catch (error) {
        console.error("❌ An error occurred during the process:");
        console.error(error.message || error);
    } finally {
        if (client) {
            await client.close();
            console.log("MongoDB connection closed.");
        }
    }
}

exportData();
