const { admin, messaging, Notification, User } = require('../config')


const sendNotification = async (token, title, body) => {

    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};


const notifyUser = async (userid, title, body) => {
    try {
        const userDoc = await User.doc(userid).get();
        if (userDoc.exists) {
            const token = userDoc.data().fcmToken;
            if (token) {
                await sendNotification(token, title, body);
            } else {
                console.log('No FCM token available for user:', userid);
            }
        }
    } catch (error) {
        console.error('Error notifying user:', error);
        throw new Error('Failed to notify user');
    }
}
 
// const createNotification = async (req, res) => {
//     const { userid, title, message } = req.body;

//     try {
//         // Create a new notification document in Firestore
//         const newNotificationRef = Notification.doc(); // Create a new document with a unique ID
//         await newNotificationRef.set({
//             userid,
//             title,
//             message,
//             status: false, 
//             createdAt: new Date()
//         });

//         // Optionally notify the user via FCM
//         await notifyUser(userid, title, message);

//         res.status(201).json({ message: 'Notification created successfully' });
//     } catch (error) {
//         console.error('Error creating notification:', error);
//         res.status(500).json({ error: 'Failed to create notification' });
//     }
// }

const createNotification = async (userid, title, message) => {
   
    try {
        // Create a new notification document in Firestore
        const newNotification = {
            userid, 
            title,
            message,
            status: false, 
            createdAt: Date.now()
        };

        await Notification.add( newNotification );
         
        console.log('Notification created successfully')
        return { success: true }; // Return success
        //res.status(201).json({ message: 'Notification created successfully' });
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false }; // Return success
        //res.status(500).json({ error: 'Failed to create notification' });
    }
} 


const getNotifications = async (req, res) => {
    const { id } = req.params;

    try {
        const notificationsRef = Notification.where('userid', '==', id);
        const snapshot = await notificationsRef.get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'No notifications found' });
        }

        const notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
}

const markAsRead = async (req, res) => {
    const { id } = req.params;
  
    try {
      const notificationRef = Notification.doc(id);
      await notificationRef.update({ status: true });
  
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
}

const registerToken = async (req, res) => {
    const { id } = req.params;
    const { fcmToken } = req.body;

    try {
        const userRef = User.doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userRef.update({ fcmToken });
        res.status(200).json({ message: 'FCM token registered successfully' });
    } catch (error) {
        console.error('Error registering FCM token:', error);
        res.status(500).json({ error: 'Failed to register FCM token' });
    }
};




module.exports = { createNotification, getNotifications, markAsRead, registerToken };