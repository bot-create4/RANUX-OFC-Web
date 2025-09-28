const { Storage } = require('megajs');

// This function will upload the session file to Mega.nz
async function uploadToMega(sessionData) {
    const email = process.env.MEGA_EMAIL;
    const password = process.env.MEGA_PASSWORD;

    if (!email || !password) {
        console.error('Mega.nz credentials are not set in environment variables.');
        throw new Error('Mega credentials not configured.');
    }

    try {
        // Connect to Mega
        const storage = await new Storage({ email, password }).ready;

        // Create a buffer from the session string
        const sessionBuffer = Buffer.from(sessionData, 'utf-8');

        // Check if the file already exists
        const existingFile = storage.root.children.find(file => file.name === 'session.json');
        if (existingFile) {
            // Delete the old file before uploading the new one
            await existingFile.delete();
            console.log('Old session.json file deleted.');
        }

        // Upload the buffer as a file named 'session.json'
        const file = await storage.upload({
            name: 'session.json',
            size: sessionBuffer.length
        }, sessionBuffer).complete;

        // Get the public link for the uploaded file
        const link = await file.link();
        
        console.log('Session successfully uploaded to Mega.nz!');
        return link;

    } catch (error) {
        console.error('Error uploading to Mega.nz:', error.message);
        if (error.message.includes('EINVALID_EMAIL') || error.message.includes('EBLOCKED') || error.message.includes('EPASSWORD')) {
            throw new Error('Mega.nz login failed. Please check your MEGA_EMAIL and MEGA_PASSWORD in Render environment variables.');
        }
        throw new Error('Failed to upload session to Mega.nz.');
    }
}

module.exports = { uploadToMega };