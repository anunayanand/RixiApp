const cron = require('node-cron');
const Bootcamp = require('../models/Bootcamp');
const BootcampUser = require('../models/BootcampUser');
const { google } = require('googleapis');

// ==============================
// GMAIL CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function makeBody(to, from, subject, message) {
    const str = [
        "Content-Type: text/html; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');
    return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

// ==============================
// CRON JOB: 30-Min Session Reminders
// ==============================
// Runs every minute to check if any session starts in exactly 30 minutes.
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
        
        // Find bootcamps that are live
        const bootcamps = await Bootcamp.find({ status: 'live' });

        for (const bootcamp of bootcamps) {
            for (const session of bootcamp.sessions) {
                const sessionTime = new Date(session.time);
                
                // Check if session starts exactly within the next 30-31 minutes
                const diffMs = thirtyMinutesFromNow - sessionTime;
                if (sessionTime > now && diffMs >= 0 && diffMs < 60000) {
                    
                    const loginLink = `${process.env.BASE_URL || 'http://localhost:3000'}/bootcamp-portal/login`;

                    // Send email to all enrolled users
                    for (const userId of bootcamp.usersEnrolled) {
                        const user = await BootcampUser.findById(userId);
                        if (user) {
                            const subject = `Reminder: Bootcamp Session starting in 30 minutes!`;
                            const body = `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                    <h2 style="color: #6366f1;">Hi ${user.name},</h2>
                                    <p style="font-size: 16px; color: #333;">Get ready! Your session <strong>${session.session_id}</strong> for <strong>${bootcamp.name}</strong> is starting in exactly 30 minutes.</p>
                                    
                                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime.toLocaleString('en-IN')}</p>
                                        <p style="margin: 5px 0;"><strong>Instructor:</strong> ${session.instructor || 'TBA'}</p>
                                        <p style="margin: 5px 0;"><strong>Details:</strong> ${session.details || 'Join via your dashboard.'}</p>
                                    </div>
                                    
                                    <p>Please log in to your dashboard to access the session link and materials:</p>
                                    <a href="${loginLink}" style="display: inline-block; padding: 12px 25px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Go to Dashboard</a>
                                </div>
                            `;

                            const encodedMail = makeBody(user.email, process.env.EMAIL, subject, body);
                            
                            // Send mail asynchronously
                            gmail.users.messages.send({ userId: 'me', resource: { raw: encodedMail } })
                                .catch(err => console.error(`Failed sending reminder to ${user.email}`, err.message));
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Bootcamp Reminder Cron Error:", err);
    }
});
