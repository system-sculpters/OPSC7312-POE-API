const { Category, Transaction, db } = require('../config')

const getCategories = async (req, res) =>{
    const {id} = req.params
    console.log(`this is the id: ${id}`)
    try {
        const snapshot = await Category
            .where('userid', '==', id)
            .get();

        const list = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
        
        console.log(list);
            
        res.status(200).json(list);
    } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}

const createCategory = async (req, res) =>{
    const {color, icon, name, transactiontype, userid} = req.body;
    const createdAt = Date.now()

    const newCategory = {
        color: color,
        icon: icon,
        name: name,
        transactiontype: transactiontype, 
        userid: userid,
        createdAt: createdAt
    }
    try { 
        await Category.add( newCategory );
        //res.status(201).json({ message: 'Category created successfully.' });
        res.send({ message: "Category Added" });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
}

const updateCategory = async (req, res) =>{
    const { id } = req.params;
    const { color, icon, name, transactiontype } = req.body;
    const updatedAt = Date.now()

    const updatedCategory = {
        ...(color && { color }),
        ...(icon && { icon }),
        ...(name && { name }),
        ...(transactiontype && { transactiontype }),
        updatedAt
    };
    
    try {
        const CategoryRef = await Category.doc(id);
        await CategoryRef.update( updatedCategory );
        res.status(200).json({ message: 'Category updated successfully.' });
    } catch (error) {
        console.error('Error updating Category:', error);
        res.status(500).json({ error: 'Failed to update Category' });
    }
}


const deleteCategory = async (req, res) => {
    const { id } = req.params; // ID of the category to be deleted
    const uncategorizedCategoryId = 'wEijTYKaY8738zHM4oJb'; 

    try {
        // Check if the "Uncategorized" category exists
        const uncategorizedRef = Category.doc(uncategorizedCategoryId);
        const uncategorizedSnapshot = await uncategorizedRef.get();

        if (!uncategorizedSnapshot.exists) {
            return res.status(400).json({ error: '"Uncategorized" category does not exist.' });
        }

        // Get all transactions linked to the category being deleted
        const snapshot = await Transaction
            .where('categoryId', '==', id)
            .get();

        const batch = Transaction.firestore.batch();

        // Reassign all transactions to "Uncategorized"
        snapshot.docs.forEach((doc) => {
            const transactionRef = Transaction.doc(doc.id);
            batch.update(transactionRef, { categoryId: uncategorizedCategoryId });
        });

        // Commit the batch update
        await batch.commit();

        // Delete the original category after reassignment
        const categoryRef = Category.doc(id);
        await categoryRef.delete();

        res.status(200).json({ message: 'Category deleted and transactions reassigned to "Uncategorized".' });
    } catch (error) {
        console.error('Error deleting category and reassigning transactions to "Uncategorized":', error);
        res.status(500).json({ error: 'Failed to delete category and reassign transactions' });
    }
};


const batchAddCategories = async (req, res) =>{
    const categories = req.body.categories; // Expecting an array of category objects

    const batch = db.batch()

    const firebaseCategoryIds = [];

    console.log(`categories: ${categories}`)
    if (!categories || !Array.isArray(categories)) {
        return res.status(400).json({ success: false, message: 'Invalid input. Expected an array of categories.' });
    }
    try {
        // Perform batch write in Firebase
        categories.forEach(category => {
            const newCategoryRef = Category.doc(); // Create a new document reference
            batch.set(newCategoryRef, {
                color: category.color,
                icon: category.icon,
                name: category.name,
                transactiontype: category.transactiontype,
                userid: category.userid,
                createdAt: Date.now()
            });

            firebaseCategoryIds.push({ localId: category.id, firebaseId: newCategoryRef.id });
        });

        await batch.commit(); // Commit the batch operation
        console.log('category sync successful')
        res.status(201).json({ 
            message: `${categories.length} categories added successfully.`,
            ids: firebaseCategoryIds 
         });
    } catch (error) {
        console.error('An error has occured while syncing categories:', error)
        res.status(500).json({ success: false, message: error.message });
    }
}


module.exports = { getCategories, createCategory, updateCategory, deleteCategory, batchAddCategories }