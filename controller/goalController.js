const { Goal, db } = require('../config')

const getGoals = async (req, res) =>{
    const { id } = req.params
    console.log(`this is the id: ${id}`)
    try {
        const snapshot = await Goal
        .where('userid', '==', id)
        .get();
        
        const list = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log(list);
    
        res.status(200).json(list);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}

const createGoal = async (req, res) =>{
    const {contributionamount,
        contributiontype, 
        currentamount,
        deadline,
        name,
        targetamount,
        userid,
        notify
    } = req.body;  

    const createdAt = Date.now()

    try { 
        const newGoal = {
            contributionamount: contributionamount,
            contributiontype: contributiontype,
            currentamount: currentamount,
            deadline: deadline,
            name: name,
            targetamount: targetamount, 
            userid: userid,
            createdAt: createdAt
        }
        await Goal.add( newGoal );

        if(notify){
            const title = 'New Goal Created';
            const message = `Your goal '${name}' has been created successfully.`;
            const notificationResult = await createNotification(userid, title, message)
            if (!notificationResult.success) {
                console.error('Notification creation failed');
                // Optionally: Handle the error or inform the user
            }
        }
        res.status(201).json({ message: 'Goal created successfully.' });
        //res.send({ msg: "User Added" });
    } catch (error) {
        console.error('Error creating Goal:', error);
        res.status(500).json({ error: 'Failed to create Goal' });
    }
}

const updateGoal = async (req, res) =>{
    const { id } = req.params;

    const { contributionamount,
        contributiontype, 
        currentamount,
        deadline,
        name,
        targetamount } = req.body;

    const updatedAt = Date.now()
    try {
        const updatedGoal = {
            contributionamount: contributionamount,
            contributiontype: contributiontype,
            currentamount: currentamount,
            deadline: deadline,
            name: name,
            targetamount: targetamount,
            updatedAt: updatedAt
        }
        const GoalRef = Goal.doc(id);
        await GoalRef.update( updatedGoal );
        res.status(200).json({ message: 'Goal updated successfully.' });
    } catch (error) {
        console.error('Error updating Goal:', error);
        res.status(500).json({ error: 'Failed to update Goal' });
    }
}


const deleteGoal = async (req, res) =>{
    const { id } = req.params;
    try {
        const GoalRef = Goal.doc(id);
        await GoalRef.delete();
        res.status(200).json({ message: 'Goal deleted successfully.' });
    } catch (error) {
        console.error('Error deleting Goal:', error);
        res.status(500).json({ error: 'Failed to delete Goal' });
    }
}


const batchAddGoals = async (req, res) =>{
    const goals = req.body.goals; // Expecting an array of category objects
    
    const batch = db.batch()

    const firebaseGoalIds = [];
    
    console.log(`goals: ${goals}`)
    
    if (!goals || !Array.isArray(goals)) {
        return res.status(400).json({ success: false, message: 'Invalid input. Expected an array of categories.' });
    }
    
    try {
        // Perform batch write in Firebase
        goals.forEach(goal => {
            const newGoalRef = Goal.doc(); // Create a new document reference
            batch.set(newGoalRef, {
                contributionamount: goal.contributionamount,
                contributiontype: goal.contributiontype,
                currentamount: goal.currentamount,
                deadline: goal.deadline,
                name: goal.name,
                targetamount: goal.targetamount, 
                userid: goal.userid,
                createdAt: Date.now()
            });

            firebaseGoalIds.push({ localId: goal.id, firebaseId: newGoalRef.id });
        });

        await batch.commit(); // Commit the batch operation
        console.log(`goal sync successful \n${firebaseGoalIds}`)
        res.status(201).json({ 
            message: `${goals.length} goals added successfully.`,
            ids: firebaseGoalIds 
         });
    } catch (error) {
        console.error('An error has occured while syncing goals:', error)
        res.status(500).json({ success: false, message: error.message });
    }
}



module.exports = { getGoals, createGoal, updateGoal, deleteGoal, batchAddGoals }